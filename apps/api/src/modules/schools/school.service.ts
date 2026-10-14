import { School, SchoolDocument } from './school.model.js';
import { User } from '../auth/user.model.js';
import { Student } from '../students/student.model.js';
import {
  CreateSchoolInput,
  OnboardSchoolInput,
  UpdateSchoolBrandingInput,
  UpdateSchoolSubscriptionInput,
  ConfigureCustomDomainInput,
  SchoolQueryInput,
} from '@smart-school/validation';
import {
  SchoolStatus,
  SubscriptionPlanType,
  ISchoolBranding,
} from '@smart-school/shared-types';
import { slugify, SUBSCRIPTION_PLAN_PRESETS, DEFAULT_SCHOOL_BRANDING } from '@smart-school/shared-utils';
import { AppError } from '../../utils/appError.js';
import { auditService } from '../audit/audit.service.js';
import { dnsService } from '../../services/dns.service.js';
import bcrypt from 'bcryptjs';

export interface ActorContext {
  id: string;
  email: string;
  role: string;
  ipAddress?: string;
  userAgent?: string;
}

export class SchoolService {
  async getSchoolBySlug(slug: string): Promise<SchoolDocument | null> {
    return School.findOne({ slug: slug.toLowerCase() });
  }

  async getSchoolById(id: string): Promise<SchoolDocument | null> {
    return School.findById(id);
  }

  async listSchools(params: SchoolQueryInput = { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }): Promise<{
    items: SchoolDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filter: Record<string, unknown> = {};

    if (params.status) {
      filter.status = params.status;
    }
    if (params.plan) {
      filter['subscription.plan'] = params.plan;
    }
    if (params.search) {
      const term = params.search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { slug: { $regex: term, $options: 'i' } },
        { code: { $regex: term, $options: 'i' } },
        { 'customDomain.domain': { $regex: term, $options: 'i' } },
      ];
    }

    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;
    const sortField = params.sortBy || 'createdAt';
    const sortDirection = params.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      School.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit),
      School.countDocuments(filter),
    ]);

    // Populate dynamic student & user counts on retrieved items
    for (const item of items) {
      await this.refreshSchoolUsage(item.id);
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async createSchool(input: CreateSchoolInput, actor?: ActorContext): Promise<SchoolDocument> {
    const slug = input.slug ? slugify(input.slug) : slugify(input.name);

    const existingSlug = await School.findOne({ slug });
    if (existingSlug) {
      throw AppError.conflict(`School with slug '${slug}' already exists.`);
    }

    if (input.code) {
      const existingCode = await School.findOne({ code: input.code.toUpperCase() });
      if (existingCode) {
        throw AppError.conflict(`School with code '${input.code}' already exists.`);
      }
    }

    const planType = (input.plan || 'trial') as SubscriptionPlanType;
    const preset = SUBSCRIPTION_PLAN_PRESETS[planType] || SUBSCRIPTION_PLAN_PRESETS.trial;
    const expiryDate = new Date(Date.now() + preset.defaultDurationDays * 24 * 60 * 60 * 1000);

    const school = new School({
      name: input.name,
      slug,
      code: input.code ? input.code.toUpperCase() : undefined,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      address: input.address,
      settings: input.settings,
      status: 'active',
      branding: { ...DEFAULT_SCHOOL_BRANDING },
      subscription: {
        plan: planType,
        status: 'active',
        startDate: new Date(),
        expiryDate,
        gracePeriodDays: 14,
        maxStudents: preset.maxStudents,
        maxUsers: preset.maxUsers,
        maxStorageMB: preset.maxStorageMB,
        features: preset.features,
        autoRenew: false,
      },
    });

    await school.save();

    if (actor) {
      await auditService.record({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'school.created',
        targetSchoolId: school.id,
        targetSchoolName: school.name,
        details: { plan: planType, slug },
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
    }

    return school;
  }

  /**
   * Onboard a new school with initial school administrator account
   */
  async onboardSchool(input: OnboardSchoolInput, actor: ActorContext): Promise<{ school: SchoolDocument; adminUser: unknown }> {
    const slug = input.slug ? slugify(input.slug) : slugify(input.schoolName);

    // Verify slug uniqueness
    const existingSlug = await School.findOne({ slug });
    if (existingSlug) {
      throw AppError.conflict(`A school with slug '${slug}' already exists.`);
    }

    // Verify admin email uniqueness
    const existingUser = await User.findOne({ email: input.adminEmail.toLowerCase() });
    if (existingUser) {
      throw AppError.conflict(`User with email '${input.adminEmail}' is already registered.`);
    }

    const planType = input.plan || 'trial';
    const preset = SUBSCRIPTION_PLAN_PRESETS[planType] || SUBSCRIPTION_PLAN_PRESETS.trial;
    const maxStudents = input.maxStudents || preset.maxStudents;
    const expiryDate = new Date(Date.now() + preset.defaultDurationDays * 24 * 60 * 60 * 1000);

    // 1. Create School
    const school = new School({
      name: input.schoolName,
      slug,
      code: input.code ? input.code.toUpperCase() : undefined,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      status: 'active',
      branding: { ...DEFAULT_SCHOOL_BRANDING },
      subscription: {
        plan: planType,
        status: 'active',
        startDate: new Date(),
        expiryDate,
        gracePeriodDays: 14,
        maxStudents,
        maxUsers: preset.maxUsers,
        maxStorageMB: preset.maxStorageMB,
        features: preset.features,
        autoRenew: false,
        notes: input.notes || 'Onboarded via Super Admin portal',
      },
      usage: {
        studentCount: 0,
        userCount: 1,
        storageUsedMB: 0,
        lastActivityAt: new Date(),
      },
    });

    await school.save();

    // 2. Create School Admin User
    const passwordHash = await bcrypt.hash(input.adminPassword, 10);
    const adminUser = new User({
      name: input.adminName,
      email: input.adminEmail.toLowerCase(),
      passwordHash,
      role: 'school_admin',
      schoolId: school._id,
      isActive: true,
    });

    await adminUser.save();

    // 3. Record Audit Log
    await auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'school.onboarded',
      targetSchoolId: school.id,
      targetSchoolName: school.name,
      details: {
        plan: planType,
        maxStudents,
        adminEmail: input.adminEmail,
        slug,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return { school, adminUser };
  }

  /**
   * Update school white-label branding
   */
  async updateSchoolBranding(
    schoolId: string,
    input: UpdateSchoolBrandingInput,
    actor: ActorContext
  ): Promise<SchoolDocument> {
    const school = await School.findById(schoolId);
    if (!school) {
      throw AppError.notFound('School not found.');
    }

    const currentBranding = (school.branding || {}) as ISchoolBranding;
    school.branding = {
      ...currentBranding,
      ...input,
    };

    await school.save();

    await auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'school.branding_updated',
      targetSchoolId: school.id,
      targetSchoolName: school.name,
      details: { updatedFields: Object.keys(input) },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return school;
  }

  /**
   * Update subscription, license status, and limits
   */
  async updateSchoolSubscription(
    schoolId: string,
    input: UpdateSchoolSubscriptionInput,
    actor: ActorContext
  ): Promise<SchoolDocument> {
    const school = await School.findById(schoolId);
    if (!school) {
      throw AppError.notFound('School not found.');
    }

    school.subscription = {
      plan: input.plan,
      status: input.status || school.subscription?.status || 'active',
      startDate: school.subscription?.startDate || new Date(),
      expiryDate: new Date(input.expiryDate),
      gracePeriodDays: input.gracePeriodDays ?? 14,
      maxStudents: input.maxStudents,
      maxUsers: input.maxUsers,
      maxStorageMB: input.maxStorageMB,
      features: input.features,
      autoRenew: input.autoRenew ?? false,
      notes: input.notes ?? school.subscription?.notes,
    };

    await school.save();

    await auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'subscription.updated',
      targetSchoolId: school.id,
      targetSchoolName: school.name,
      details: {
        plan: input.plan,
        maxStudents: input.maxStudents,
        expiryDate: input.expiryDate,
        status: input.status,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return school;
  }

  /**
   * Register custom domain and issue verification challenge
   */
  async configureCustomDomain(
    schoolId: string,
    input: ConfigureCustomDomainInput,
    actor: ActorContext
  ): Promise<SchoolDocument> {
    const cleanDomain = input.domain.trim().toLowerCase();

    // Check if domain is already claimed by another school
    const existing = await School.findOne({
      _id: { $ne: schoolId },
      'customDomain.domain': cleanDomain,
    });

    if (existing) {
      throw AppError.conflict(`Domain '${cleanDomain}' is already connected to another school.`);
    }

    const school = await School.findById(schoolId);
    if (!school) {
      throw AppError.notFound('School not found.');
    }

    const token = dnsService.generateVerificationToken();
    const expectedValue = input.dnsRecordType === 'TXT' ? token : 'cname.smartschoolerp.com';

    school.customDomain = {
      domain: cleanDomain,
      status: 'pending',
      verificationToken: token,
      dnsRecordType: input.dnsRecordType || 'TXT',
      expectedValue,
      sslStatus: 'provisioning',
      errorMessage: undefined,
    };

    await school.save();

    await auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'domain.configured',
      targetSchoolId: school.id,
      targetSchoolName: school.name,
      details: {
        domain: cleanDomain,
        dnsRecordType: input.dnsRecordType,
        token,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return school;
  }

  /**
   * Performs actual DNS lookup verification for the custom domain
   */
  async verifyCustomDomain(schoolId: string, actor: ActorContext): Promise<{ school: SchoolDocument; result: unknown }> {
    const school = await School.findById(schoolId);
    if (!school || !school.customDomain?.domain) {
      throw AppError.badRequest('No custom domain configured for this school.');
    }

    const { domain, verificationToken, dnsRecordType } = school.customDomain;
    const dnsResult = await dnsService.verifyDomain(domain, verificationToken, dnsRecordType);

    school.customDomain.lastCheckedAt = new Date();

    if (dnsResult.verified) {
      school.customDomain.status = 'verified';
      school.customDomain.verifiedAt = new Date();
      school.customDomain.sslStatus = 'active';
      school.customDomain.errorMessage = undefined;
      // Also update top-level domain field for fast lookup
      school.domain = domain;
    } else {
      school.customDomain.status = 'failed';
      school.customDomain.sslStatus = 'failed';
      school.customDomain.errorMessage = dnsResult.errorMessage;
    }

    await school.save();

    await auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: dnsResult.verified ? 'domain.verified' : 'domain.verification_failed',
      targetSchoolId: school.id,
      targetSchoolName: school.name,
      details: {
        domain,
        verified: dnsResult.verified,
        errorMessage: dnsResult.errorMessage,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return { school, result: dnsResult };
  }

  /**
   * Safely disconnects and removes a custom domain
   */
  async removeCustomDomain(schoolId: string, actor: ActorContext): Promise<SchoolDocument> {
    const school = await School.findById(schoolId);
    if (!school) {
      throw AppError.notFound('School not found.');
    }

    const previousDomain = school.customDomain?.domain;

    school.customDomain = undefined;
    school.domain = undefined;
    await school.save();

    await auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'domain.removed',
      targetSchoolId: school.id,
      targetSchoolName: school.name,
      details: { previousDomain },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return school;
  }

  /**
   * Lifecycle status management (active, suspended, reactivated, archived)
   */
  async updateSchoolStatus(
    schoolId: string,
    newStatus: SchoolStatus,
    reason: string | undefined,
    actor: ActorContext
  ): Promise<SchoolDocument> {
    const school = await School.findById(schoolId);
    if (!school) {
      throw AppError.notFound('School not found.');
    }

    const prevStatus = school.status;
    school.status = newStatus;

    if (newStatus === 'suspended' && school.subscription) {
      school.subscription.status = 'suspended';
    } else if (newStatus === 'active' && school.subscription?.status === 'suspended') {
      school.subscription.status = 'active';
    }

    await school.save();

    await auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: `school.status_changed_${newStatus}`,
      targetSchoolId: school.id,
      targetSchoolName: school.name,
      details: { prevStatus, newStatus, reason },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return school;
  }

  /**
   * Refreshes usage stats (real database counts for students and users)
   */
  async refreshSchoolUsage(schoolId: string): Promise<void> {
    try {
      const [studentCount, userCount] = await Promise.all([
        Student.countDocuments({ schoolId }),
        User.countDocuments({ schoolId }),
      ]);

      await School.findByIdAndUpdate(schoolId, {
        'usage.studentCount': studentCount,
        'usage.userCount': userCount,
        'usage.lastActivityAt': new Date(),
      });
    } catch {
      // Non-fatal
    }
  }

  /**
   * Resolves a school safely by custom domain or slug without returning sensitive vendor secrets
   */
  async resolveByHostOrSlug(host?: string, slug?: string): Promise<SchoolDocument | null> {
    if (host) {
      const cleanHost = host.split(':')[0].toLowerCase();
      // Only match verified custom domains or verified domain property
      const byDomain = await School.findOne({
        $or: [{ 'customDomain.domain': cleanHost, 'customDomain.status': 'verified' }, { domain: cleanHost }],
      });
      if (byDomain) return byDomain;
    }

    if (slug) {
      return School.findOne({ slug: slug.toLowerCase() });
    }

    return null;
  }
}

export const schoolService = new SchoolService();

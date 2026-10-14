import { Request, Response, NextFunction } from 'express';
import { schoolService, ActorContext } from './school.service.js';
import { auditService } from '../audit/audit.service.js';
import { supportService } from '../support/support.service.js';
import { invoiceService } from '../invoices/invoice.service.js';
import { AppError } from '../../utils/appError.js';
import { SchoolStatus } from '@smart-school/shared-types';

function extractActor(req: Request): ActorContext {
  return {
    id: req.user?.id || 'unknown',
    email: req.user?.email || 'unknown',
    role: req.user?.role || 'unknown',
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
  };
}

export const schoolController = {
  /**
   * Resolves school branding and public metadata by Host header or slug
   */
  async resolvePublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const host = req.get('host') || (req.query.host as string);
      const slug = (req.query.slug as string) || req.params.slug;

      const school = await schoolService.resolveByHostOrSlug(host, slug);
      if (!school) {
        throw AppError.notFound('School not found.');
      }

      // Return public white-label branding and metadata only (no internal vendor data)
      res.json({
        success: true,
        data: {
          id: school.id,
          name: school.name,
          slug: school.slug,
          code: school.code,
          status: school.status,
          contactEmail: school.contactEmail,
          contactPhone: school.contactPhone,
          branding: school.branding,
          settings: school.settings,
          customDomain: school.customDomain?.status === 'verified' ? school.customDomain.domain : undefined,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getCurrentSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.tenantId) {
        throw AppError.forbidden('Tenant context not resolved.');
      }
      const school = await schoolService.getSchoolById(req.tenantId);
      if (!school) {
        throw AppError.notFound('School not found.');
      }
      res.json({ success: true, data: school });
    } catch (err) {
      next(err);
    }
  },

  async listSchools(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await schoolService.listSchools(req.query as never);
      if (req.query.page || req.query.limit || req.query.search || req.query.status || req.query.plan) {
        res.json({
          success: true,
          data: {
            items: result.items,
            pagination: {
              total: result.total,
              page: result.page,
              limit: result.limit,
              totalPages: result.totalPages,
            },
          },
        });
      } else {
        res.json({
          success: true,
          data: result.items,
        });
      }
    } catch (err) {
      next(err);
    }
  },

  async getSchoolById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await schoolService.getSchoolById(req.params.id);
      if (!school) {
        throw AppError.notFound('School not found.');
      }
      res.json({ success: true, data: school });
    } catch (err) {
      next(err);
    }
  },

  async createSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await schoolService.createSchool(req.body, extractActor(req));
      res.status(201).json({
        success: true,
        message: 'School created successfully.',
        data: school,
      });
    } catch (err) {
      next(err);
    }
  },

  async onboardSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await schoolService.onboardSchool(req.body, extractActor(req));
      res.status(201).json({
        success: true,
        message: 'School and initial administrator onboarded successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateBranding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetId = req.user?.role === 'super_admin' ? req.params.id : req.tenantId!;
      const school = await schoolService.updateSchoolBranding(targetId, req.body, extractActor(req));
      res.json({
        success: true,
        message: 'School branding updated successfully.',
        data: school,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await schoolService.updateSchoolSubscription(req.params.id, req.body, extractActor(req));
      res.json({
        success: true,
        message: 'Subscription plan and limits updated successfully.',
        data: school,
      });
    } catch (err) {
      next(err);
    }
  },

  async configureDomain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetId = req.user?.role === 'super_admin' ? req.params.id : req.tenantId!;
      const school = await schoolService.configureCustomDomain(targetId, req.body, extractActor(req));
      res.json({
        success: true,
        message: 'Custom domain registered. DNS verification challenge issued.',
        data: school,
      });
    } catch (err) {
      next(err);
    }
  },

  async verifyDomain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetId = req.user?.role === 'super_admin' ? req.params.id : req.tenantId!;
      const result = await schoolService.verifyCustomDomain(targetId, extractActor(req));
      res.json({
        success: true,
        message: (result.result as { verified: boolean }).verified
          ? 'Custom domain verified and activated successfully.'
          : 'DNS verification failed. Please check record configuration and propagation.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  async removeDomain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetId = req.user?.role === 'super_admin' ? req.params.id : req.tenantId!;
      const school = await schoolService.removeCustomDomain(targetId, extractActor(req));
      res.json({
        success: true,
        message: 'Custom domain removed successfully.',
        data: school,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, reason } = req.body;
      const school = await schoolService.updateSchoolStatus(req.params.id, status as SchoolStatus, reason, extractActor(req));
      res.json({
        success: true,
        message: `School status changed to ${status}.`,
        data: school,
      });
    } catch (err) {
      next(err);
    }
  },

  async listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.role === 'super_admin' ? (req.query.schoolId as string) : req.tenantId;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await auditService.listLogs({ schoolId, page, limit });
      res.json({
        success: true,
        data: {
          items: result.items,
          pagination: {
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit) || 1,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // Support Access Session Controllers
  async createSupportSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.params.id || req.body.schoolId;
      const school = await schoolService.getSchoolById(schoolId);
      if (!school) throw AppError.notFound('School not found.');

      const session = await supportService.createSupportSession({
        schoolId,
        schoolName: school.name,
        requestedBy: req.user!.id,
        authorizedBy: req.user!.id,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        reason: req.body.reason,
        ticketReference: req.body.ticketReference,
        durationHours: req.body.durationHours,
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'Authorized support session initiated.',
        data: session,
      });
    } catch (err) {
      next(err);
    }
  },

  async revokeSupportSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await supportService.revokeSupportSession(
        req.params.sessionId,
        req.user!.id,
        req.user!.email,
        req.user!.role
      );
      if (!session) throw AppError.notFound('Support session not found.');
      res.json({
        success: true,
        message: 'Support session revoked.',
        data: session,
      });
    } catch (err) {
      next(err);
    }
  },

  async listSupportSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await supportService.listSessions(req.params.id);
      res.json({ success: true, data: sessions });
    } catch (err) {
      next(err);
    }
  },

  // Invoice Controllers
  async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await schoolService.getSchoolById(req.params.id || req.body.schoolId);
      if (!school) throw AppError.notFound('School not found.');

      const invoice = await invoiceService.createInvoice(
        { ...req.body, schoolId: school.id },
        school.name,
        { id: req.user!.id, email: req.user!.email, role: req.user!.role }
      );

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully.',
        data: invoice,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateInvoiceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await invoiceService.updateInvoiceStatus(
        req.params.invoiceId,
        req.body,
        { id: req.user!.id, email: req.user!.email, role: req.user!.role }
      );
      res.json({
        success: true,
        message: 'Invoice status updated.',
        data: invoice,
      });
    } catch (err) {
      next(err);
    }
  },

  async listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.role === 'super_admin' ? req.params.id : req.tenantId;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await invoiceService.listInvoices({ schoolId, page, limit });
      res.json({
        success: true,
        data: {
          items: result.items,
          pagination: {
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit) || 1,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

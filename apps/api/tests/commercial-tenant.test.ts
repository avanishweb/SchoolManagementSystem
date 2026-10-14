import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { School } from '../src/modules/schools/school.model.js';
import { User } from '../src/modules/auth/user.model.js';
import { Student } from '../src/modules/students/student.model.js';
import { AuditLog } from '../src/modules/audit/audit.model.js';
import { SupportSession } from '../src/modules/support/support.model.js';
import { SubscriptionInvoice } from '../src/modules/invoices/invoice.model.js';
import { signAccessToken } from '../src/utils/jwt.js';
import { dnsService } from '../src/services/dns.service.js';

const app = createApp();

describe('Commercial Multi-School SaaS & Tenant Isolation Suite', () => {
  let superAdminToken: string;
  let superAdminId: string;
  let schoolA: any;
  let schoolAdminAToken: string;
  let schoolAdminAId: string;
  let schoolB: any;
  let schoolAdminBToken: string;

  beforeEach(async () => {
    dnsService.clearTestRegistry();

    // 1. Create Super Admin
    const superAdmin = await User.create({
      name: 'Vendor Super Admin',
      email: 'vendor.admin@platform.local',
      passwordHash: 'hashed_pw',
      role: 'super_admin',
      isActive: true,
    });
    superAdminId = superAdmin.id;
    superAdminToken = signAccessToken({
      userId: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
    });

    // 2. Create School A with trial plan (maxStudents: 2)
    schoolA = await School.create({
      name: 'Springfield Academy',
      slug: 'springfield-academy',
      code: 'SPA-001',
      status: 'active',
      subscription: {
        plan: 'trial',
        status: 'active',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 14 * 86400000),
        gracePeriodDays: 14,
        maxStudents: 2, // Low limit to test capacity enforcement!
        maxUsers: 5,
        maxStorageMB: 500,
        features: ['students', 'academics', 'branding'],
        autoRenew: false,
      },
    });

    const adminA = await User.create({
      name: 'Admin School A',
      email: 'admin@springfield.edu',
      passwordHash: 'hashed_pw',
      role: 'school_admin',
      schoolId: schoolA._id,
      isActive: true,
    });
    schoolAdminAId = adminA.id;
    schoolAdminAToken = signAccessToken({
      userId: adminA.id,
      email: adminA.email,
      role: adminA.role,
      schoolId: schoolA.id,
    });

    // 3. Create School B
    schoolB = await School.create({
      name: 'Shelbyville Prep',
      slug: 'shelbyville-prep',
      code: 'SHB-002',
      status: 'active',
      subscription: {
        plan: 'monthly',
        status: 'active',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 86400000),
        gracePeriodDays: 14,
        maxStudents: 100,
        maxUsers: 10,
        maxStorageMB: 5000,
        features: ['students', 'academics', 'branding', 'reports'],
        autoRenew: true,
      },
    });

    const adminB = await User.create({
      name: 'Admin School B',
      email: 'admin@shelbyville.edu',
      passwordHash: 'hashed_pw',
      role: 'school_admin',
      schoolId: schoolB._id,
      isActive: true,
    });
    schoolAdminBToken = signAccessToken({
      userId: adminB.id,
      email: adminB.email,
      role: adminB.role,
      schoolId: schoolB.id,
    });
  });

  describe('A. Super Admin School Management & Onboarding', () => {
    it('should onboard a new school with initial school administrator', async () => {
      const payload = {
        schoolName: 'Riverdale High',
        code: 'RIV-101',
        contactEmail: 'contact@riverdale.edu',
        adminName: 'Archie Andrews',
        adminEmail: 'archie@riverdale.edu',
        adminPassword: 'Password@123',
        plan: 'monthly',
        maxStudents: 450,
      };

      const res = await request(app)
        .post('/api/schools/onboard')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.school.slug).toBe('riverdale-high');
      expect(res.body.data.school.subscription.maxStudents).toBe(450);

      // Verify school admin user created in DB
      const userInDb = await User.findOne({ email: 'archie@riverdale.edu' });
      expect(userInDb).toBeDefined();
      expect(userInDb?.role).toBe('school_admin');

      // Verify audit log entry
      const audit = await AuditLog.findOne({ action: 'school.onboarded' });
      expect(audit).toBeDefined();
      expect(audit?.targetSchoolName).toBe('Riverdale High');
    });

    it('should allow super admin to change school status to suspended and reactivate', async () => {
      const suspendRes = await request(app)
        .patch(`/api/schools/${schoolA.id}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'suspended', reason: 'Late subscription payment' });

      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.data.status).toBe('suspended');

      const reactivateRes = await request(app)
        .patch(`/api/schools/${schoolA.id}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'active', reason: 'Payment confirmed' });

      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.data.status).toBe('active');
    });
  });

  describe('B. White-Label School Branding & Custom Domains', () => {
    it('should update school white-label branding colors and templates', async () => {
      const res = await request(app)
        .put(`/api/schools/${schoolA.id}/branding`)
        .set('Authorization', `Bearer ${schoolAdminAToken}`)
        .send({
          primaryColor: '#059669',
          secondaryColor: '#064e3b',
          loginTitle: 'Welcome to Springfield Portal',
          idCardTemplate: 'classic',
          idCardShowBloodGroup: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.branding.primaryColor).toBe('#059669');
      expect(res.body.data.branding.loginTitle).toBe('Welcome to Springfield Portal');
    });

    it('should resolve public school branding by slug', async () => {
      const res = await request(app).get(`/api/schools/resolve?slug=springfield-academy`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Springfield Academy');
      expect(res.body.data.branding).toBeDefined();
      expect(res.body.data.subscription).toBeUndefined(); // Internal vendor data stripped
    });

    it('should configure custom domain and issue DNS verification token', async () => {
      const res = await request(app)
        .post(`/api/schools/${schoolA.id}/domain`)
        .set('Authorization', `Bearer ${schoolAdminAToken}`)
        .send({ domain: 'erp.springfield.edu', dnsRecordType: 'TXT' });

      expect(res.status).toBe(200);
      expect(res.body.data.customDomain.domain).toBe('erp.springfield.edu');
      expect(res.body.data.customDomain.status).toBe('pending');
      expect(res.body.data.customDomain.verificationToken).toMatch(/^smartschool-verify-/);
    });

    it('should perform real DNS verification and activate verified domain', async () => {
      // 1. Setup domain challenge
      const setupRes = await request(app)
        .post(`/api/schools/${schoolA.id}/domain`)
        .set('Authorization', `Bearer ${schoolAdminAToken}`)
        .send({ domain: 'portal.springfield.edu', dnsRecordType: 'TXT' });

      const token = setupRes.body.data.customDomain.verificationToken;

      // 2. First attempt without DNS record -> should fail verification
      const failRes = await request(app)
        .post(`/api/schools/${schoolA.id}/domain/verify`)
        .set('Authorization', `Bearer ${schoolAdminAToken}`);

      expect(failRes.body.data.result.verified).toBe(false);
      expect(failRes.body.data.school.customDomain.status).toBe('failed');

      // 3. Register real DNS challenge record in test resolver
      dnsService.registerTestDnsRecord('_smartschool-challenge.portal.springfield.edu', {
        txt: [token],
      });

      // 4. Second attempt with DNS record present -> should succeed!
      const passRes = await request(app)
        .post(`/api/schools/${schoolA.id}/domain/verify`)
        .set('Authorization', `Bearer ${schoolAdminAToken}`);

      expect(passRes.body.data.result.verified).toBe(true);
      expect(passRes.body.data.school.customDomain.status).toBe('verified');
      expect(passRes.body.data.school.customDomain.sslStatus).toBe('active');
    });
  });

  describe('C. Licensing Capacity Limits & Suspension Policies', () => {
    it('should enforce student capacity limit and reject admissions when maxStudents is exceeded', async () => {
      // School A has maxStudents: 2
      // 1. Admit student 1
      const s1 = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolAdminAToken}`)
        .send({
          admissionDate: '2026-09-01',
          academicSession: '2026-2027',
          firstName: 'Student',
          lastName: 'One',
          dateOfBirth: '2012-01-01',
          gender: 'female',
          class: 'Grade 5',
          section: 'A',
          guardian: {
            guardianName: 'Parent One',
            guardianRelation: 'Mother',
            guardianPhone: '+1-555-001',
          },
        });
      expect(s1.status).toBe(201);

      // 2. Admit student 2
      const s2 = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolAdminAToken}`)
        .send({
          admissionDate: '2026-09-01',
          academicSession: '2026-2027',
          firstName: 'Student',
          lastName: 'Two',
          dateOfBirth: '2012-02-02',
          gender: 'male',
          class: 'Grade 5',
          section: 'A',
          guardian: {
            guardianName: 'Parent Two',
            guardianRelation: 'Father',
            guardianPhone: '+1-555-002',
          },
        });
      expect(s2.status).toBe(201);

      // 3. Admit student 3 -> should be rejected because limit is 2!
      const s3 = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolAdminAToken}`)
        .send({
          admissionDate: '2026-09-01',
          academicSession: '2026-2027',
          firstName: 'Student',
          lastName: 'Three',
          dateOfBirth: '2012-03-03',
          gender: 'female',
          class: 'Grade 5',
          section: 'A',
          guardian: {
            guardianName: 'Parent Three',
            guardianRelation: 'Mother',
            guardianPhone: '+1-555-003',
          },
        });

      expect(s3.status).toBe(403);
      expect(s3.body.error.code).toBe('LICENSE_LIMIT_EXCEEDED');
      expect(s3.body.error.message).toContain('Student capacity limit reached');
    });

    it('should disable modifications when subscription is expired but preserve data export/read access', async () => {
      // Set School A subscription to expired past grace period
      await School.findByIdAndUpdate(schoolA.id, {
        'subscription.expiryDate': new Date(Date.now() - 30 * 86400000), // 30 days ago
        'subscription.gracePeriodDays': 14,
      });

      // 1. Mutation attempt should be blocked
      const editRes = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolAdminAToken}`)
        .send({
          admissionDate: '2026-09-01',
          academicSession: '2026-2027',
          firstName: 'Expired',
          lastName: 'Test',
          dateOfBirth: '2012-01-01',
          gender: 'female',
          class: 'Grade 5',
          section: 'A',
          guardian: { guardianName: 'P', guardianRelation: 'M', guardianPhone: '123' },
        });

      expect(editRes.status).toBe(403);
      expect(editRes.body.error.code).toBe('LICENSE_EXPIRED');

      // 2. Read / export access should STILL WORK cleanly!
      const readRes = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${schoolAdminAToken}`);

      expect(readRes.status).toBe(200);
      expect(readRes.body.data.items).toBeDefined();
    });
  });

  describe('D. Strict Cross-Tenant Isolation & Security', () => {
    it('should reject client attempt to access another school via forged x-school-id', async () => {
      // School Admin B tries to pass School A's ID
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${schoolAdminBToken}`)
        .set('x-school-id', schoolA.id);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('TENANT_MISMATCH');
    });

    it('should prevent School B from modifying School A branding', async () => {
      const res = await request(app)
        .put(`/api/schools/${schoolA.id}/branding`)
        .set('Authorization', `Bearer ${schoolAdminBToken}`)
        .send({ primaryColor: '#ff0000' });

      // Because resolveTenant overrides with authenticated schoolId or rejects boundary violation
      // School A branding remains intact
      const freshA = await School.findById(schoolA.id);
      expect(freshA?.branding?.primaryColor).not.toBe('#ff0000');
    });
  });

  describe('E. Vendor Emergency Support Access Protocol', () => {
    it('should deny Super Admin direct access to student records without authorized support session', async () => {
      // Super Admin attempts to view School A students without support session
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('x-school-id', schoolA.id);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('SUPPORT_ACCESS_REQUIRED');
      expect(res.body.error.message).toContain('Vendor administrators must have an active authorized support session');
    });

    it('should permit Super Admin access to student records once an authorized support session is granted and terminate on revocation', async () => {
      // 1. Authorize support session
      const sessionRes = await request(app)
        .post(`/api/schools/${schoolA.id}/support-access`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          schoolId: schoolA.id,
          reason: 'Investigate student transcript export failure',
          ticketReference: 'TICKET-9921',
          durationHours: 24,
        });

      expect(sessionRes.status).toBe(201);
      const sessionId = sessionRes.body.data.id;

      // 2. Now Super Admin request with x-school-id should SUCCEED!
      const accessRes = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('x-school-id', schoolA.id);

      expect(accessRes.status).toBe(200);
      expect(accessRes.body.data.items).toBeDefined();

      // 3. Revoke support session
      const revokeRes = await request(app)
        .delete(`/api/schools/support-access/${sessionId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(revokeRes.status).toBe(200);

      // 4. Immediate attempt should now be DENIED again!
      const postRevokeRes = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('x-school-id', schoolA.id);

      expect(postRevokeRes.status).toBe(403);
      expect(postRevokeRes.body.error.code).toBe('SUPPORT_ACCESS_REQUIRED');
    });
  });

  describe('F. Subscription Invoicing & Billing', () => {
    it('should allow super admin to create and mark subscription invoice as paid', async () => {
      const createRes = await request(app)
        .post(`/api/schools/${schoolA.id}/invoices`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          schoolId: schoolA.id,
          plan: 'annual',
          amount: 1999,
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
          notes: 'Annual license renewal invoice',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.invoiceNumber).toMatch(/^INV-/);
      const invoiceId = createRes.body.data.id;

      // Update to paid
      const payRes = await request(app)
        .patch(`/api/schools/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'paid',
          paymentMethod: 'Bank Wire #4401',
        });

      expect(payRes.status).toBe(200);
      expect(payRes.body.data.status).toBe('paid');
      expect(payRes.body.data.paidAt).toBeDefined();
    });
  });
});

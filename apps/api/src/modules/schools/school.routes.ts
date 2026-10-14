import { Router } from 'express';
import { schoolController } from './school.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createSchoolSchema,
  onboardSchoolSchema,
  updateSchoolBrandingSchema,
  updateSchoolSubscriptionSchema,
  configureCustomDomainSchema,
  updateSchoolStatusSchema,
  createSupportAccessSchema,
  createInvoiceSchema,
  updateInvoiceStatusSchema,
} from '@smart-school/validation';

export const schoolRouter = Router();

// Public white-label resolution routes
schoolRouter.get('/resolve', schoolController.resolvePublic);
schoolRouter.get('/public/:slug', schoolController.resolvePublic);

// Authenticated current tenant route
schoolRouter.get('/current', authenticate, resolveTenant, schoolController.getCurrentSchool);

// Audit logs route
schoolRouter.get(
  '/audit-logs',
  authenticate,
  requireRole('super_admin', 'school_admin'),
  resolveTenant,
  schoolController.listAuditLogs
);

// Super-admin platform school management
schoolRouter.get('/', authenticate, requireRole('super_admin'), schoolController.listSchools);

schoolRouter.post(
  '/',
  authenticate,
  requireRole('super_admin'),
  validateRequest({ body: createSchoolSchema }),
  schoolController.createSchool
);

schoolRouter.post(
  '/onboard',
  authenticate,
  requireRole('super_admin'),
  validateRequest({ body: onboardSchoolSchema }),
  schoolController.onboardSchool
);

schoolRouter.get(
  '/:id',
  authenticate,
  requireRole('super_admin', 'school_admin'),
  schoolController.getSchoolById
);

// School white-label branding settings (Super admin or authorized School Admin)
schoolRouter.put(
  '/:id/branding',
  authenticate,
  requireRole('super_admin', 'school_admin'),
  resolveTenant,
  validateRequest({ body: updateSchoolBrandingSchema }),
  schoolController.updateBranding
);

// Subscription and plan configuration (Super Admin only)
schoolRouter.put(
  '/:id/subscription',
  authenticate,
  requireRole('super_admin'),
  validateRequest({ body: updateSchoolSubscriptionSchema }),
  schoolController.updateSubscription
);

// Custom Domain Management
schoolRouter.post(
  '/:id/domain',
  authenticate,
  requireRole('super_admin', 'school_admin'),
  resolveTenant,
  validateRequest({ body: configureCustomDomainSchema }),
  schoolController.configureDomain
);

schoolRouter.post(
  '/:id/domain/verify',
  authenticate,
  requireRole('super_admin', 'school_admin'),
  resolveTenant,
  schoolController.verifyDomain
);

schoolRouter.delete(
  '/:id/domain',
  authenticate,
  requireRole('super_admin', 'school_admin'),
  resolveTenant,
  schoolController.removeDomain
);

// Lifecycle status updates (Activate, Suspend, Reactivate, Archive)
schoolRouter.patch(
  '/:id/status',
  authenticate,
  requireRole('super_admin'),
  validateRequest({ body: updateSchoolStatusSchema }),
  schoolController.updateStatus
);

// Emergency Support Access
schoolRouter.post(
  '/:id/support-access',
  authenticate,
  requireRole('super_admin', 'school_admin'),
  validateRequest({ body: createSupportAccessSchema }),
  schoolController.createSupportSession
);

schoolRouter.delete(
  '/support-access/:sessionId',
  authenticate,
  requireRole('super_admin', 'school_admin'),
  schoolController.revokeSupportSession
);

schoolRouter.get(
  '/:id/support-sessions',
  authenticate,
  requireRole('super_admin', 'school_admin'),
  schoolController.listSupportSessions
);

// Invoices & Billing
schoolRouter.post(
  '/:id/invoices',
  authenticate,
  requireRole('super_admin'),
  validateRequest({ body: createInvoiceSchema }),
  schoolController.createInvoice
);

schoolRouter.patch(
  '/invoices/:invoiceId',
  authenticate,
  requireRole('super_admin'),
  validateRequest({ body: updateInvoiceStatusSchema }),
  schoolController.updateInvoiceStatus
);

schoolRouter.get(
  '/:id/invoices',
  authenticate,
  requireRole('super_admin', 'school_admin'),
  schoolController.listInvoices
);

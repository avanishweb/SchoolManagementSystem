import { Router } from 'express';
import { cmsController } from './cms.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { createCmsPageSchema, createCmsNoticeSchema } from '@smart-school/validation';

export const cmsRouter = Router();

// PUBLIC ENDPOINT: Anyone can access the published website and notices of any school by slug!
cmsRouter.get('/public/:schoolSlug', cmsController.getPublicSite);

// AUTHENTICATED & TENANT-RESOLVED MANAGEMENT ENDPOINTS
cmsRouter.use(authenticate, resolveTenant);

// Pages
cmsRouter.get(
  '/pages',
  requireRole('super_admin', 'school_admin', 'principal'),
  cmsController.listPages
);

cmsRouter.post(
  '/pages',
  requireRole('super_admin', 'school_admin', 'principal'),
  validateRequest({ body: createCmsPageSchema }),
  cmsController.createPage
);

cmsRouter.put(
  '/pages/:id',
  requireRole('super_admin', 'school_admin', 'principal'),
  cmsController.updatePage
);

// Notices
cmsRouter.get(
  '/notices',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal', 'parent', 'student'),
  cmsController.listNotices
);

cmsRouter.post(
  '/notices',
  requireRole('super_admin', 'school_admin', 'principal'),
  validateRequest({ body: createCmsNoticeSchema }),
  cmsController.createNotice
);

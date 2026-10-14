import { Router } from 'express';
import { admissionController } from './admission.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createAdmissionEnquirySchema,
  updateEnquiryStageSchema,
} from '@smart-school/validation';

export const admissionRouter = Router();

admissionRouter.use(authenticate, resolveTenant);

admissionRouter.get(
  '/enquiries',
  requireRole('super_admin', 'school_admin', 'staff', 'principal'),
  admissionController.list
);

admissionRouter.post(
  '/enquiries',
  requireRole('super_admin', 'school_admin', 'staff', 'principal'),
  validateRequest({ body: createAdmissionEnquirySchema }),
  admissionController.create
);

admissionRouter.patch(
  '/enquiries/:id/stage',
  requireRole('super_admin', 'school_admin', 'staff', 'principal'),
  validateRequest({ body: updateEnquiryStageSchema }),
  admissionController.updateStage
);

admissionRouter.post(
  '/enquiries/:id/convert',
  requireRole('super_admin', 'school_admin', 'staff'),
  admissionController.convertToStudent
);

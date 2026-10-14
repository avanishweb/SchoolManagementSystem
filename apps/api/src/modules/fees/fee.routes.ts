import { Router } from 'express';
import { feeController } from './fee.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createFeeHeadSchema,
  createFeeStructureSchema,
  recordFeePaymentSchema,
} from '@smart-school/validation';

export const feeRouter = Router();

feeRouter.use(authenticate, resolveTenant);

// Fee Heads
feeRouter.get(
  '/heads',
  requireRole('super_admin', 'school_admin', 'accountant', 'principal'),
  feeController.listHeads
);
feeRouter.post(
  '/heads',
  requireRole('super_admin', 'school_admin', 'accountant'),
  validateRequest({ body: createFeeHeadSchema }),
  feeController.createHead
);

// Fee Structures
feeRouter.get(
  '/structures',
  requireRole('super_admin', 'school_admin', 'accountant', 'principal'),
  feeController.listStructures
);
feeRouter.post(
  '/structures',
  requireRole('super_admin', 'school_admin', 'accountant'),
  validateRequest({ body: createFeeStructureSchema }),
  feeController.createStructure
);

// Student fee records
feeRouter.get(
  '/student/:studentId',
  requireRole('super_admin', 'school_admin', 'accountant', 'teacher', 'parent', 'student'),
  feeController.listStudentFees
);

// Fee Payments
feeRouter.get(
  '/payments',
  requireRole('super_admin', 'school_admin', 'accountant', 'principal', 'parent', 'student'),
  feeController.listPayments
);
feeRouter.post(
  '/payments',
  requireRole('super_admin', 'school_admin', 'accountant'),
  validateRequest({ body: recordFeePaymentSchema }),
  feeController.recordPayment
);

// Defaulters list
feeRouter.get(
  '/defaulters',
  requireRole('super_admin', 'school_admin', 'accountant', 'principal'),
  feeController.listDefaulters
);

// Void / Reversal
feeRouter.post(
  '/payments/:id/void',
  requireRole('super_admin', 'school_admin', 'accountant', 'principal'),
  feeController.voidPayment
);


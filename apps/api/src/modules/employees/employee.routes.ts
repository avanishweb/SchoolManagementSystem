import { Router } from 'express';
import { employeeController } from './employee.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { createEmployeeSchema, updateEmployeeSchema } from '@smart-school/validation';

export const employeeRouter = Router();

employeeRouter.use(authenticate, resolveTenant);

employeeRouter.get(
  '/',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal', 'accountant'),
  employeeController.list
);

employeeRouter.get(
  '/:id',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal', 'accountant'),
  employeeController.getById
);

employeeRouter.post(
  '/',
  requireRole('super_admin', 'school_admin', 'principal'),
  validateRequest({ body: createEmployeeSchema }),
  employeeController.create
);

employeeRouter.put(
  '/:id',
  requireRole('super_admin', 'school_admin', 'principal'),
  validateRequest({ body: updateEmployeeSchema }),
  employeeController.update
);

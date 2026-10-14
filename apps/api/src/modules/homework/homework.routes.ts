import { Router } from 'express';
import { homeworkController } from './homework.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { createHomeworkSchema, submitHomeworkSchema } from '@smart-school/validation';

export const homeworkRouter = Router();

homeworkRouter.use(authenticate, resolveTenant);

homeworkRouter.get(
  '/',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal', 'parent', 'student'),
  homeworkController.listHomework
);

homeworkRouter.post(
  '/',
  requireRole('super_admin', 'school_admin', 'teacher', 'principal'),
  validateRequest({ body: createHomeworkSchema }),
  homeworkController.createHomework
);

homeworkRouter.post(
  '/submit',
  requireRole('super_admin', 'school_admin', 'student', 'parent'),
  validateRequest({ body: submitHomeworkSchema }),
  homeworkController.submitHomework
);

homeworkRouter.get(
  '/:homeworkId/submissions',
  requireRole('super_admin', 'school_admin', 'teacher', 'principal'),
  homeworkController.listSubmissions
);

homeworkRouter.patch(
  '/submissions/:submissionId/grade',
  requireRole('super_admin', 'school_admin', 'teacher', 'principal'),
  homeworkController.gradeSubmission
);

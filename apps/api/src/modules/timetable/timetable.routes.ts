import { Router } from 'express';
import { timetableController } from './timetable.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { createTimetableSlotSchema } from '@smart-school/validation';

export const timetableRouter = Router();

timetableRouter.use(authenticate, resolveTenant);

timetableRouter.post(
  '/slots',
  requireRole('super_admin', 'school_admin', 'principal'),
  validateRequest({ body: createTimetableSlotSchema }),
  timetableController.createSlot
);

timetableRouter.post(
  '/check-conflict',
  requireRole('super_admin', 'school_admin', 'principal', 'teacher'),
  validateRequest({ body: createTimetableSlotSchema }),
  timetableController.checkConflict
);

timetableRouter.get(
  '/class',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal', 'parent', 'student'),
  timetableController.getClassTimetable
);

timetableRouter.get(
  '/teacher/:teacherId',
  requireRole('super_admin', 'school_admin', 'teacher', 'principal'),
  timetableController.getTeacherTimetable
);

timetableRouter.delete(
  '/slots/:id',
  requireRole('super_admin', 'school_admin', 'principal'),
  timetableController.deleteSlot
);

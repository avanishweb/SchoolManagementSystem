import { Router } from 'express';
import { attendanceController } from './attendance.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { bulkMarkAttendanceSchema } from '@smart-school/validation';

export const attendanceRouter = Router();

attendanceRouter.use(authenticate, resolveTenant);

attendanceRouter.post(
  '/bulk',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal'),
  validateRequest({ body: bulkMarkAttendanceSchema }),
  attendanceController.bulkMark
);

attendanceRouter.get(
  '/class',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal'),
  attendanceController.getClassAttendance
);

attendanceRouter.get(
  '/student/:studentId',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal', 'parent', 'student'),
  attendanceController.getStudentMonthly
);

attendanceRouter.post(
  '/broadcast-whatsapp',
  requireRole('super_admin', 'school_admin', 'teacher', 'principal'),
  attendanceController.broadcastWhatsApp
);


import { Router } from 'express';
import { examinationController } from './examination.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createExaminationSchema,
  createExamScheduleSchema,
  recordExamMarksSchema,
} from '@smart-school/validation';

export const examinationRouter = Router();

examinationRouter.use(authenticate, resolveTenant);

examinationRouter.get(
  '/',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal', 'parent', 'student'),
  examinationController.listExams
);

examinationRouter.post(
  '/',
  requireRole('super_admin', 'school_admin', 'principal'),
  validateRequest({ body: createExaminationSchema }),
  examinationController.createExam
);

examinationRouter.get(
  '/:examId/schedules',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal', 'parent', 'student'),
  examinationController.listSchedules
);

examinationRouter.post(
  '/schedules',
  requireRole('super_admin', 'school_admin', 'principal'),
  validateRequest({ body: createExamScheduleSchema }),
  examinationController.createSchedule
);

examinationRouter.post(
  '/marks',
  requireRole('super_admin', 'school_admin', 'teacher', 'principal'),
  validateRequest({ body: recordExamMarksSchema }),
  examinationController.recordMarks
);

examinationRouter.get(
  '/:examId/report-card/:studentId',
  requireRole('super_admin', 'school_admin', 'teacher', 'principal', 'parent', 'student'),
  examinationController.getReportCard
);

examinationRouter.patch(
  '/:examId/publish',
  requireRole('super_admin', 'school_admin', 'principal'),
  examinationController.publishResults
);

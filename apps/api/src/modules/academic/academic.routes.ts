import { Router } from 'express';
import { academicController } from './academic.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createAcademicSessionSchema,
  createClassroomSchema,
  createSectionSchema,
  createSubjectSchema,
} from '@smart-school/validation';

export const academicRouter = Router();

academicRouter.use(authenticate, resolveTenant);

// SESSIONS
academicRouter.get(
  '/sessions',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal'),
  academicController.listSessions
);
academicRouter.post(
  '/sessions',
  requireRole('super_admin', 'school_admin'),
  validateRequest({ body: createAcademicSessionSchema }),
  academicController.createSession
);
academicRouter.patch(
  '/sessions/:id/current',
  requireRole('super_admin', 'school_admin'),
  academicController.setCurrentSession
);

// CLASSROOMS
academicRouter.get(
  '/classes',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal'),
  academicController.listClassrooms
);
academicRouter.post(
  '/classes',
  requireRole('super_admin', 'school_admin'),
  validateRequest({ body: createClassroomSchema }),
  academicController.createClassroom
);

// SECTIONS
academicRouter.get(
  '/sections',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal'),
  academicController.listSections
);
academicRouter.post(
  '/sections',
  requireRole('super_admin', 'school_admin'),
  validateRequest({ body: createSectionSchema }),
  academicController.createSection
);

// SUBJECTS
academicRouter.get(
  '/subjects',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal'),
  academicController.listSubjects
);
academicRouter.post(
  '/subjects',
  requireRole('super_admin', 'school_admin'),
  validateRequest({ body: createSubjectSchema }),
  academicController.createSubject
);

// PROMOTION (WITH UNDO)
academicRouter.get(
  '/promotions',
  requireRole('super_admin', 'school_admin', 'principal'),
  academicController.listPromotionBatches
);
academicRouter.post(
  '/promotions',
  requireRole('super_admin', 'school_admin', 'principal'),
  academicController.promoteStudents
);
academicRouter.post(
  '/promotions/:batchId/undo',
  requireRole('super_admin', 'school_admin', 'principal'),
  academicController.undoPromotion
);

// DAILY DIARY
academicRouter.get(
  '/diary',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal', 'parent', 'student'),
  academicController.listDiary
);
academicRouter.post(
  '/diary',
  requireRole('super_admin', 'school_admin', 'teacher', 'principal'),
  academicController.createDiary
);
academicRouter.put(
  '/diary/:id',
  requireRole('super_admin', 'school_admin', 'teacher', 'principal'),
  academicController.updateDiary
);
academicRouter.delete(
  '/diary/:id',
  requireRole('super_admin', 'school_admin', 'teacher', 'principal'),
  academicController.deleteDiary
);

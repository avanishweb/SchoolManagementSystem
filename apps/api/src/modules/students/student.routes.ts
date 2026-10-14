import { Router } from 'express';
import { studentController } from './student.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { uploadPhoto, uploadDocument } from './student.upload.js';
import {
  createStudentSchema,
  updateStudentSchema,
  updateStudentStatusSchema,
  studentQuerySchema,
} from '@smart-school/validation';

export const studentRouter = Router();

// Static file serving for uploads (accessible by path)
studentRouter.get('/uploads/:type/:filename', studentController.serveUpload);

// Authenticated and Tenant-Resolved endpoints
studentRouter.use(authenticate, resolveTenant);

// Suggest next admission number
studentRouter.get(
  '/next-admission-number',
  requireRole('super_admin', 'school_admin', 'staff'),
  studentController.getNextAdmissionNumber
);

// Student directory listing (Teachers, staff, admins can view)
studentRouter.get(
  '/',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff'),
  validateRequest({ query: studentQuerySchema }),
  studentController.list
);

// Student profile details
studentRouter.get(
  '/:id',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff'),
  studentController.getById
);

// New admission creation
studentRouter.post(
  '/',
  requireRole('super_admin', 'school_admin', 'staff'),
  validateRequest({ body: createStudentSchema }),
  studentController.create
);

// Update student profile
studentRouter.put(
  '/:id',
  requireRole('super_admin', 'school_admin', 'staff'),
  validateRequest({ body: updateStudentSchema }),
  studentController.update
);

// Status update (Active/Inactive/Suspended/Graduated/Transferred)
studentRouter.patch(
  '/:id/status',
  requireRole('super_admin', 'school_admin', 'staff'),
  validateRequest({ body: updateStudentStatusSchema }),
  studentController.updateStatus
);

// Student photo upload
studentRouter.post(
  '/:id/photo',
  requireRole('super_admin', 'school_admin', 'staff'),
  uploadPhoto.single('photo'),
  studentController.uploadPhoto
);

// Student document upload
studentRouter.post(
  '/:id/documents',
  requireRole('super_admin', 'school_admin', 'staff'),
  uploadDocument.single('document'),
  studentController.uploadDocument
);

// Delete student document
studentRouter.delete(
  '/:id/documents/:docId',
  requireRole('super_admin', 'school_admin', 'staff'),
  studentController.deleteDocument
);

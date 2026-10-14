import { Router } from 'express';
import { notificationController } from './notification.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requireRole } from '../../middleware/rbac.js';

export const notificationRouter = Router();

notificationRouter.use(authenticate, resolveTenant);

notificationRouter.get(
  '/',
  requireRole('super_admin', 'school_admin', 'teacher', 'staff', 'principal'),
  notificationController.list
);

notificationRouter.post(
  '/',
  requireRole('super_admin', 'school_admin', 'principal'),
  notificationController.dispatch
);

notificationRouter.post(
  '/broadcast',
  requireRole('super_admin', 'school_admin', 'teacher', 'principal'),
  notificationController.broadcast
);


import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service.js';

export class NotificationController {
  async dispatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await notificationService.dispatchNotification(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await notificationService.listNotifications(req.tenantId!);
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }

  async broadcast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationService.broadcastNoticeToParents(req.tenantId!, req.body);
      res.json({
        success: true,
        message: `Dispatched WhatsApp notice broadcast to ${result.deliveredCount} parent contacts.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();

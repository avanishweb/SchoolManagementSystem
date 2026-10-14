import { Request, Response, NextFunction } from 'express';
import { timetableService } from './timetable.service.js';

export class TimetableController {
  async createSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slot = await timetableService.createSlot(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: slot });
    } catch (err) {
      next(err);
    }
  }

  async checkConflict(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await timetableService.checkConflict(req.tenantId!, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getClassTimetable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { class: className, section } = req.query as { class: string; section: string };
      const slots = await timetableService.listClassTimetable(req.tenantId!, className, section);
      res.json({ success: true, data: slots });
    } catch (err) {
      next(err);
    }
  }

  async getTeacherTimetable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slots = await timetableService.listTeacherTimetable(req.tenantId!, req.params.teacherId);
      res.json({ success: true, data: slots });
    } catch (err) {
      next(err);
    }
  }

  async deleteSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await timetableService.deleteSlot(req.tenantId!, req.params.id);
      res.json({ success: true, message: 'Timetable slot deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const timetableController = new TimetableController();

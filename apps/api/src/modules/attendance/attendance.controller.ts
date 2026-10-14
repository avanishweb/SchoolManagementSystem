import { Request, Response, NextFunction } from 'express';
import { attendanceService } from './attendance.service.js';

export class AttendanceController {
  async bulkMark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const markedBy = req.user?.email || 'Teacher';
      const results = await attendanceService.bulkMarkAttendance(req.tenantId!, markedBy, req.body);
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  }

  async getClassAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { class: className, section, date } = req.query as {
        class: string;
        section: string;
        date: string;
      };
      const records = await attendanceService.getClassAttendance(
        req.tenantId!,
        className,
        section,
        date
      );
      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }

  async getStudentMonthly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { year, month } = req.query as { year?: string; month?: string };
      const now = new Date();
      const targetYear = year ? parseInt(year, 10) : now.getFullYear();
      const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;

      const result = await attendanceService.getStudentMonthlyAttendance(
        req.tenantId!,
        req.params.studentId,
        targetYear,
        targetMonth
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async broadcastWhatsApp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { class: className, section, date } = req.body;
      const result = await attendanceService.sendBulkAttendanceWhatsAppAlerts(
        req.tenantId!,
        className,
        section,
        date
      );
      res.json({
        success: true,
        message: `Dispatched ${result.deliveredCount} WhatsApp absence alerts to parents.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const attendanceController = new AttendanceController();

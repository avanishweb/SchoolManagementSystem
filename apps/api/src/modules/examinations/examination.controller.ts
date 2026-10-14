import { Request, Response, NextFunction } from 'express';
import { examinationService } from './examination.service.js';

export class ExaminationController {
  async listExams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exams = await examinationService.listExams(req.tenantId!);
      res.json({ success: true, data: exams });
    } catch (err) {
      next(err);
    }
  }

  async createExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exam = await examinationService.createExam(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: exam });
    } catch (err) {
      next(err);
    }
  }

  async listSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schedules = await examinationService.listSchedules(req.tenantId!, req.params.examId);
      res.json({ success: true, data: schedules });
    } catch (err) {
      next(err);
    }
  }

  async createSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schedule = await examinationService.createSchedule(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: schedule });
    } catch (err) {
      next(err);
    }
  }

  async recordMarks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const marks = await examinationService.recordMarks(req.tenantId!, req.body);
      res.json({ success: true, data: marks });
    } catch (err) {
      next(err);
    }
  }

  async getReportCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await examinationService.getStudentReportCard(
        req.tenantId!,
        req.params.examId,
        req.params.studentId
      );
      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async publishResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exam = await examinationService.publishResults(req.tenantId!, req.params.examId);
      res.json({ success: true, data: exam });
    } catch (err) {
      next(err);
    }
  }
}

export const examinationController = new ExaminationController();

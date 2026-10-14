import { Request, Response, NextFunction } from 'express';
import { homeworkService } from './homework.service.js';

export class HomeworkController {
  async createHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = req.user?.id || 'teacher';
      const teacherName = req.user?.email || 'Teacher';
      const hw = await homeworkService.createHomework(req.tenantId!, teacherId, teacherName, req.body);
      res.status(201).json({ success: true, data: hw });
    } catch (err) {
      next(err);
    }
  }

  async listHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { class: className, section } = req.query as { class?: string; section?: string };
      const list = await homeworkService.listHomework(req.tenantId!, className, section);
      res.json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  }

  async submitHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.body.studentId || req.user?.studentId || req.user?.id;
      const submission = await homeworkService.submitHomework(req.tenantId!, studentId, req.body);
      res.status(201).json({ success: true, data: submission });
    } catch (err) {
      next(err);
    }
  }

  async listSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await homeworkService.listSubmissions(req.tenantId!, req.params.homeworkId);
      res.json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  }

  async gradeSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { marks, feedback } = req.body;
      const evaluatedBy = req.user?.email || 'Teacher';
      const submission = await homeworkService.gradeSubmission(
        req.tenantId!,
        req.params.submissionId,
        marks,
        feedback,
        evaluatedBy
      );
      res.json({ success: true, data: submission });
    } catch (err) {
      next(err);
    }
  }
}

export const homeworkController = new HomeworkController();

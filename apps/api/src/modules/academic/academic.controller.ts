import { Request, Response, NextFunction } from 'express';
import { academicService } from './academic.service.js';
import { promotionService } from './promotion.service.js';
import { dailyDiaryService } from './diary.service.js';

export class AcademicController {
  async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await academicService.listSessions(req.tenantId!);
      res.json({ success: true, data: sessions });
    } catch (err) {
      next(err);
    }
  }

  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await academicService.createSession(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  async setCurrentSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await academicService.setCurrentSession(req.tenantId!, req.params.id);
      res.json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  async listClassrooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classrooms = await academicService.listClassrooms(req.tenantId!);
      res.json({ success: true, data: classrooms });
    } catch (err) {
      next(err);
    }
  }

  async createClassroom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classroom = await academicService.createClassroom(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: classroom });
    } catch (err) {
      next(err);
    }
  }

  async listSections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sections = await academicService.listSections(req.tenantId!, req.query.classId as string);
      res.json({ success: true, data: sections });
    } catch (err) {
      next(err);
    }
  }

  async createSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const section = await academicService.createSection(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: section });
    } catch (err) {
      next(err);
    }
  }

  async listSubjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjects = await academicService.listSubjects(req.tenantId!);
      res.json({ success: true, data: subjects });
    } catch (err) {
      next(err);
    }
  }

  async createSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subject = await academicService.createSubject(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: subject });
    } catch (err) {
      next(err);
    }
  }

  // Academic Year Promotion (with Undo)
  async promoteStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?.id || 'admin';
      const actorName = req.user?.email || 'Administrator';
      const batch = await promotionService.promoteStudents(req.tenantId!, actorId, actorName, req.body);
      res.status(201).json({
        success: true,
        message: `Successfully promoted ${batch.promotedCount} students. Undo available.`,
        data: batch,
      });
    } catch (err) {
      next(err);
    }
  }

  async undoPromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?.id || 'admin';
      const actorName = req.user?.email || 'Administrator';
      const batch = await promotionService.undoPromotion(req.tenantId!, req.params.batchId, actorId, actorName);
      res.json({
        success: true,
        message: `Promotion batch ${batch.batchNumber} has been successfully undone and all students restored.`,
        data: batch,
      });
    } catch (err) {
      next(err);
    }
  }

  async listPromotionBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const batches = await promotionService.listBatches(req.tenantId!);
      res.json({ success: true, data: batches });
    } catch (err) {
      next(err);
    }
  }

  // Daily Diary
  async listDiary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { class: className, section, date } = req.query as {
        class?: string;
        section?: string;
        date?: string;
      };
      const entries = await dailyDiaryService.listEntries(req.tenantId!, className, section, date);
      res.json({ success: true, data: entries });
    } catch (err) {
      next(err);
    }
  }

  async createDiary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = req.user?.id || 'teacher';
      const teacherName = req.user?.email || 'Teacher';
      const entry = await dailyDiaryService.createEntry(req.tenantId!, teacherId, teacherName, req.body);
      res.status(201).json({ success: true, data: entry });
    } catch (err) {
      next(err);
    }
  }

  async updateDiary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entry = await dailyDiaryService.updateEntry(req.tenantId!, req.params.id, req.body);
      res.json({ success: true, data: entry });
    } catch (err) {
      next(err);
    }
  }

  async deleteDiary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await dailyDiaryService.deleteEntry(req.tenantId!, req.params.id);
      res.json({ success: true, message: 'Diary entry deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

export const academicController = new AcademicController();

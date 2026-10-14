import { Request, Response, NextFunction } from 'express';
import { admissionService } from './admission.service.js';

export class AdmissionController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { stage, class: className } = req.query as { stage?: string; class?: string };
      const enquiries = await admissionService.listEnquiries(req.tenantId!, stage, className);
      res.json({ success: true, data: enquiries });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enquiry = await admissionService.createEnquiry(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: enquiry });
    } catch (err) {
      next(err);
    }
  }

  async updateStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enquiry = await admissionService.updateStage(req.tenantId!, req.params.id, req.body);
      res.json({ success: true, data: enquiry });
    } catch (err) {
      next(err);
    }
  }

  async convertToStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { section, gender, dateOfBirth } = req.body;
      const result = await admissionService.convertToStudent(
        req.tenantId!,
        req.params.id,
        section,
        gender,
        dateOfBirth
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const admissionController = new AdmissionController();

import { Request, Response, NextFunction } from 'express';
import { cmsService } from './cms.service.js';

export class CmsController {
  // Public
  async getPublicSite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const site = await cmsService.getPublicSchoolSite(req.params.schoolSlug);
      res.json({ success: true, data: site });
    } catch (err) {
      next(err);
    }
  }

  // Admin pages
  async listPages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pages = await cmsService.listPages(req.tenantId!);
      res.json({ success: true, data: pages });
    } catch (err) {
      next(err);
    }
  }

  async createPage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = await cmsService.createPage(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: page });
    } catch (err) {
      next(err);
    }
  }

  async updatePage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = await cmsService.updatePage(req.tenantId!, req.params.id, req.body);
      res.json({ success: true, data: page });
    } catch (err) {
      next(err);
    }
  }

  // Admin notices
  async listNotices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notices = await cmsService.listNotices(req.tenantId!);
      res.json({ success: true, data: notices });
    } catch (err) {
      next(err);
    }
  }

  async createNotice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notice = await cmsService.createNotice(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: notice });
    } catch (err) {
      next(err);
    }
  }
}

export const cmsController = new CmsController();

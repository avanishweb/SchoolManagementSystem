import { Request, Response, NextFunction } from 'express';
import { accountingService } from './accounting.service.js';

export class AccountingController {
  async listAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accounts = await accountingService.listAccounts(req.tenantId!);
      res.json({ success: true, data: accounts });
    } catch (err) {
      next(err);
    }
  }

  async createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = await accountingService.createAccount(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: account });
    } catch (err) {
      next(err);
    }
  }

  async createJournalEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createdBy = req.user?.email || 'Accountant';
      const entry = await accountingService.createJournalEntry(req.tenantId!, createdBy, req.body);
      res.status(201).json({ success: true, data: entry });
    } catch (err) {
      next(err);
    }
  }

  async listJournalEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entries = await accountingService.listJournalEntries(req.tenantId!);
      res.json({ success: true, data: entries });
    } catch (err) {
      next(err);
    }
  }

  async getTrialBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tb = await accountingService.getTrialBalance(req.tenantId!);
      res.json({ success: true, data: tb });
    } catch (err) {
      next(err);
    }
  }
}

export const accountingController = new AccountingController();

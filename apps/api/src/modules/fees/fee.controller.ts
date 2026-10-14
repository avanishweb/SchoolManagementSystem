import { Request, Response, NextFunction } from 'express';
import { feeService } from './fee.service.js';
import { auditService } from '../audit/audit.service.js';

export class FeeController {
  // Heads
  async listHeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const heads = await feeService.listFeeHeads(req.tenantId!);
      res.json({ success: true, data: heads });
    } catch (err) {
      next(err);
    }
  }

  async createHead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const head = await feeService.createFeeHead(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: head });
    } catch (err) {
      next(err);
    }
  }

  // Structures
  async listStructures(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const structures = await feeService.listFeeStructures(req.tenantId!, req.query.class as string);
      res.json({ success: true, data: structures });
    } catch (err) {
      next(err);
    }
  }

  async createStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const structure = await feeService.createFeeStructure(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: structure });
    } catch (err) {
      next(err);
    }
  }

  // Student Fees
  async listStudentFees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fees = await feeService.listStudentFees(req.tenantId!, req.params.studentId);
      res.json({ success: true, data: fees });
    } catch (err) {
      next(err);
    }
  }

  // Payments
  async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cashierId = req.user?.id || 'cashier';
      const cashierName = req.user?.email || 'Cashier';
      const result = await feeService.recordPayment(req.tenantId!, cashierId, cashierName, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payments = await feeService.listPayments(req.tenantId!, req.query.studentId as string);
      res.json({ success: true, data: payments });
    } catch (err) {
      next(err);
    }
  }

  // Defaulters
  async listDefaulters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const defaulters = await feeService.listDefaulters(req.tenantId!, req.query.class as string);
      res.json({ success: true, data: defaulters });
    } catch (err) {
      next(err);
    }
  }

  // Void / Reversal
  async voidPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const voidedBy = req.user?.id || 'admin';
      const voidedByName = req.user?.email || 'Administrator';
      const reason = req.body?.reason || 'Administrative void / reversal';
      const result = await feeService.voidPayment(
        req.tenantId!,
        req.params.id,
        voidedBy,
        voidedByName,
        reason
      );

      await auditService.record({
        actorId: req.user?.id || 'admin',
        actorEmail: req.user?.email || 'admin@school.edu',
        actorRole: req.user?.role || 'school_admin',
        action: 'fee.payment_voided',
        targetSchoolId: req.tenantId,
        details: {
          paymentId: req.params.id,
          receiptNumber: result.payment.receiptNumber,
          amountReversed: result.payment.amount,
          studentName: result.payment.studentName,
          reason,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        message: 'Fee payment voided and student ledger reversed successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const feeController = new FeeController();

import { Router } from 'express';
import { accountingController } from './accounting.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { createAccountSchema, createJournalEntrySchema } from '@smart-school/validation';

export const accountingRouter = Router();

accountingRouter.use(authenticate, resolveTenant);

// Accounts
accountingRouter.get(
  '/accounts',
  requireRole('super_admin', 'school_admin', 'accountant', 'principal'),
  accountingController.listAccounts
);

accountingRouter.post(
  '/accounts',
  requireRole('super_admin', 'school_admin', 'accountant'),
  validateRequest({ body: createAccountSchema }),
  accountingController.createAccount
);

// Journal Entries
accountingRouter.get(
  '/journal-entries',
  requireRole('super_admin', 'school_admin', 'accountant', 'principal'),
  accountingController.listJournalEntries
);

accountingRouter.post(
  '/journal-entries',
  requireRole('super_admin', 'school_admin', 'accountant'),
  validateRequest({ body: createJournalEntrySchema }),
  accountingController.createJournalEntry
);

// Trial Balance
accountingRouter.get(
  '/trial-balance',
  requireRole('super_admin', 'school_admin', 'accountant', 'principal'),
  accountingController.getTrialBalance
);

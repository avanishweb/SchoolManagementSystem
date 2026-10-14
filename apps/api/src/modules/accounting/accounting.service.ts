import { Types } from 'mongoose';
import {
  Account,
  AccountDocument,
  JournalEntry,
  JournalEntryDocument,
} from './accounting.model.js';
import { CreateAccountInput, CreateJournalEntryInput } from '@smart-school/validation';
import { AppError } from '../../utils/appError.js';

export class AccountingService {
  async seedDefaultAccounts(schoolId: string): Promise<AccountDocument[]> {
    const defaults = [
      { code: '1010', name: 'Cash in Hand', type: 'asset', balance: 0 },
      { code: '1020', name: 'Main Campus Bank Account', type: 'asset', balance: 0 },
      { code: '2010', name: 'Accounts Payable', type: 'liability', balance: 0 },
      { code: '3010', name: 'School Operating Fund', type: 'equity', balance: 0 },
      { code: '4010', name: 'Tuition Fee Income', type: 'income', balance: 0 },
      { code: '4020', name: 'Admission & Exam Fee Income', type: 'income', balance: 0 },
      { code: '5010', name: 'Faculty & Staff Salaries', type: 'expense', balance: 0 },
      { code: '5020', name: 'Campus Utilities & Maintenance', type: 'expense', balance: 0 },
    ];

    const results: AccountDocument[] = [];
    for (const d of defaults) {
      const acc = await Account.findOneAndUpdate(
        { schoolId: new Types.ObjectId(schoolId), code: d.code },
        { ...d, schoolId: new Types.ObjectId(schoolId) },
        { upsert: true, new: true }
      );
      results.push(acc);
    }
    return results;
  }

  async listAccounts(schoolId: string): Promise<any[]> {
    let accounts: any[] = await Account.find({ schoolId: new Types.ObjectId(schoolId) }).sort({ code: 1 });
    if (accounts.length === 0) {
      accounts = await this.seedDefaultAccounts(schoolId);
    }
    return accounts;
  }

  async createAccount(schoolId: string, input: CreateAccountInput): Promise<AccountDocument> {
    const existing = await Account.findOne({
      schoolId: new Types.ObjectId(schoolId),
      code: input.code.trim().toUpperCase(),
    });

    if (existing) {
      throw AppError.conflict(`Account code '${input.code}' already exists.`);
    }

    const account = new Account({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
      code: input.code.trim().toUpperCase(),
    });

    await account.save();
    return account;
  }

  async generateEntryNumber(schoolId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await JournalEntry.countDocuments({ schoolId: new Types.ObjectId(schoolId) });
    return `JRN-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async createJournalEntry(
    schoolId: string,
    createdBy: string,
    input: CreateJournalEntryInput
  ): Promise<JournalEntryDocument> {
    // 1. Double-Entry Integrity Check: Sum of Debits MUST equal Sum of Credits!
    const totalDebit = input.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = input.lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw AppError.badRequest(
        `Unbalanced journal entry: Total debits ($${totalDebit.toFixed(2)}) must equal total credits ($${totalCredit.toFixed(2)}).`
      );
    }

    const entryNumber = await this.generateEntryNumber(schoolId);

    const entry = new JournalEntry({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
      entryNumber,
      date: new Date(input.date),
      createdBy,
    });

    await entry.save();

    // 2. Update account balances according to nature
    for (const line of input.lines) {
      const acc = await Account.findOne({
        _id: new Types.ObjectId(line.accountId),
        schoolId: new Types.ObjectId(schoolId),
      });
      if (!acc) continue;
      const isDebitNature = acc.type === 'asset' || acc.type === 'expense';
      const change = isDebitNature ? (line.debit || 0) - (line.credit || 0) : (line.credit || 0) - (line.debit || 0);
      acc.balance += change;
      await acc.save();
    }

    return entry;
  }

  async listJournalEntries(schoolId: string): Promise<JournalEntryDocument[]> {
    return JournalEntry.find({ schoolId: new Types.ObjectId(schoolId) }).sort({ date: -1 }).limit(100);
  }

  async getTrialBalance(schoolId: string) {
    const accounts = await this.listAccounts(schoolId);
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = accounts.map((acc) => {
      const isDebitNature = acc.type === 'asset' || acc.type === 'expense';
      const debit = isDebitNature ? Math.max(0, acc.balance) : (acc.balance < 0 ? -acc.balance : 0);
      const credit = !isDebitNature ? Math.max(0, acc.balance) : (acc.balance < 0 ? -acc.balance : 0);

      totalDebit += debit;
      totalCredit += credit;

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit,
        credit,
      };
    });

    return {
      rows,
      totals: {
        totalDebit,
        totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      },
    };
  }
}

export const accountingService = new AccountingService();

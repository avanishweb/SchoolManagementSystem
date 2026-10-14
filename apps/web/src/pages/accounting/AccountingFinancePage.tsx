import React, { useState, useEffect } from 'react';
import { erpService } from '../../services/erpService.js';
import { IAccount, IJournalEntry } from '@smart-school/shared-types';
import {
  Landmark,
  Plus,
  CheckCircle,
  FileText,
  DollarSign,
  PieChart,
  Scale,
  Printer,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];

export const AccountingFinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'journals' | 'trialBalance'>('accounts');

  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [journalEntries, setJournalEntries] = useState<IJournalEntry[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  // Forms
  const [accountForm, setAccountForm] = useState({
    code: '',
    name: '',
    type: 'ASSET' as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE',
  });

  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    lines: [
      { accountId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', debit: 0, credit: 0, description: '' },
    ],
  });

  useEffect(() => {
    loadAccountingData();
  }, []);

  const loadAccountingData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [accRes, jRes, tbRes] = await Promise.all([
        erpService.getAccounts(),
        erpService.getJournalEntries(),
        erpService.getTrialBalance(),
      ]);
      setAccounts(accRes.data || []);
      setJournalEntries(jRes.data || []);
      setTrialBalance(tbRes.data || null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load accounting data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await erpService.createAccount(accountForm);
      setSuccessMsg(`Account ${accountForm.name} added to chart of accounts.`);
      setIsAccountModalOpen(false);
      setAccountForm({ code: '', name: '', type: 'ASSET' });
      loadAccountingData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create account');
    }
  };

  const handleJournalLineChange = (index: number, field: string, value: any) => {
    const updated = [...journalForm.lines];
    updated[index] = { ...updated[index], [field]: value };
    setJournalForm({ ...journalForm, lines: updated });
  };

  const addJournalLine = () => {
    setJournalForm({
      ...journalForm,
      lines: [...journalForm.lines, { accountId: '', debit: 0, credit: 0, description: '' }],
    });
  };

  const removeJournalLine = (index: number) => {
    if (journalForm.lines.length <= 2) return;
    const updated = journalForm.lines.filter((_, i) => i !== index);
    setJournalForm({ ...journalForm, lines: updated });
  };

  const totalDebits = journalForm.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredits = journalForm.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

  const handleCreateJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert('Total Debits must exactly equal Total Credits for double-entry integrity.');
      return;
    }
    try {
      await erpService.createJournalEntry({
        date: journalForm.date,
        description: journalForm.description,
        reference: journalForm.reference,
        lines: journalForm.lines.map((l) => ({
          accountId: l.accountId,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description,
        })),
      });
      setSuccessMsg('Balanced journal entry posted to general ledger.');
      setIsJournalModalOpen(false);
      setJournalForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        lines: [
          { accountId: '', debit: 0, credit: 0, description: '' },
          { accountId: '', debit: 0, credit: 0, description: '' },
        ],
      });
      loadAccountingData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to post journal entry');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
            <Landmark className="w-4 h-4" />
            <span>Financial Accounting & Double-Entry Ledger</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Accounting & General Ledger</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Strict double-entry bookkeeping, chart of accounts, audited vouchers, and automated trial balance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (accounts.length > 0) {
                setJournalForm((prev) => ({
                  ...prev,
                  lines: [
                    { accountId: accounts[0]._id || '', debit: 0, credit: 0, description: '' },
                    { accountId: accounts[1]?._id || accounts[0]._id || '', debit: 0, credit: 0, description: '' },
                  ],
                }));
              }
              setIsJournalModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-md shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            <span>New Journal Voucher</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'accounts'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Chart of Accounts ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('journals')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'journals'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Journal Entries ({journalEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trialBalance')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'trialBalance'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Trial Balance Report</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: CHART OF ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ledger Account</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">Code</th>
                  <th className="p-4">Account Name</th>
                  <th className="p-4">Classification</th>
                  <th className="p-4 text-right">Current Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {accounts.map((acc) => (
                  <tr key={acc._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold text-slate-700">{acc.code}</td>
                    <td className="p-4 font-semibold text-slate-900">{acc.name}</td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          acc.type === 'ASSET'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : acc.type === 'LIABILITY'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : acc.type === 'INCOME'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : acc.type === 'EXPENSE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {acc.type}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      ₹{(acc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: JOURNAL ENTRIES */}
      {activeTab === 'journals' && (
        <div className="space-y-4">
          {journalEntries.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">No Journal Entries Yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Post your first balanced journal voucher to initiate transactions in the general ledger.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {journalEntries.map((j) => (
                <div key={j._id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {j.entryNumber || 'JV-001'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{j.description}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Date: {new Date(j.date).toLocaleDateString()} {j.reference && `• Ref: ${j.reference}`}
                      </p>
                    </div>

                    <div className="text-right font-mono font-bold text-sm text-indigo-700">
                      Total: ₹{(j.totalAmount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100 pb-1">
                          <th className="py-1">Account</th>
                          <th className="py-1 text-right">Debit (₹)</th>
                          <th className="py-1 text-right">Credit (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-mono">
                        {j.lines.map((line, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 font-sans font-medium text-slate-700">
                              {line.accountName || line.accountId}
                            </td>
                            <td className="py-1.5 text-right text-emerald-700">
                              {line.debit > 0 ? `₹${line.debit.toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td className="py-1.5 text-right text-blue-700">
                              {line.credit > 0 ? `₹${line.credit.toLocaleString('en-IN')}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRIAL BALANCE */}
      {activeTab === 'trialBalance' && trialBalance && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Trial Balance Statement</h3>
              <p className="text-xs text-slate-500">
                As of {new Date().toLocaleDateString()} • Verified Double-Entry Ledger
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  trialBalance.isBalanced
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{trialBalance.isBalanced ? 'Balanced (Debits = Credits)' : 'Imbalanced'}</span>
              </span>

              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <th className="p-3">Code</th>
                  <th className="p-3">Account Title</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Debit (₹)</th>
                  <th className="p-3 text-right">Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-xs">
                {trialBalance.accounts?.map((acc: any) => (
                  <tr key={acc.code} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-600 font-bold">{acc.code}</td>
                    <td className="p-3 font-sans font-medium text-slate-900">{acc.name}</td>
                    <td className="p-3 font-sans text-slate-500">{acc.type}</td>
                    <td className="p-3 text-right font-bold text-slate-800">
                      {acc.debit > 0 ? `₹${acc.debit.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-800">
                      {acc.credit > 0 ? `₹${acc.credit.toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-900 bg-slate-50 font-mono font-bold text-sm">
                <tr>
                  <td colSpan={3} className="p-3 text-slate-900 font-sans">
                    TOTALS
                  </td>
                  <td className="p-3 text-right text-slate-900">
                    ₹{(trialBalance.totalDebits || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right text-slate-900">
                    ₹{(trialBalance.totalCredits || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Add Ledger Account</h3>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Code
                </label>
                <input
                  type="text"
                  value={accountForm.code}
                  onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })}
                  placeholder="e.g. 1005, 4002"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  placeholder="e.g. Sports Equipment Expense"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Type
                </label>
                <select
                  value={accountForm.type}
                  onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Double-Entry Journal Modal */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">New Double-Entry Journal Voucher</h3>
                <p className="text-xs text-slate-500">Every debit entry must have an equal credit entry</p>
              </div>
              <button
                onClick={() => setIsJournalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJournalEntry} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Voucher Date</label>
                  <input
                    type="date"
                    value={journalForm.date}
                    onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Narration</label>
                  <input
                    type="text"
                    value={journalForm.description}
                    onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                    placeholder="e.g. Purchase of lab glassware via HDFC Bank"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Journal Line Items */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Voucher Lines (Debits & Credits)
                  </label>
                  <button
                    type="button"
                    onClick={addJournalLine}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    + Add Row
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {journalForm.lines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="col-span-5">
                        <select
                          value={line.accountId}
                          onChange={(e) => handleJournalLineChange(idx, 'accountId', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="">Select Account...</option>
                          {accounts.map((a) => (
                            <option key={a._id} value={a._id}>
                              {a.code} - {a.name} ({a.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Debit (₹)"
                          value={line.debit || ''}
                          onChange={(e) => handleJournalLineChange(idx, 'debit', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono text-right focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Credit (₹)"
                          value={line.credit || ''}
                          onChange={(e) => handleJournalLineChange(idx, 'credit', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono text-right focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        {journalForm.lines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeJournalLine(idx)}
                            className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time Balance Validator Bar */}
              <div
                className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                  isBalanced
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div>
                  <strong>Total Debits:</strong> ₹{totalDebits.toLocaleString('en-IN')} |{' '}
                  <strong>Total Credits:</strong> ₹{totalCredits.toLocaleString('en-IN')}
                </div>
                <div className="font-sans font-bold flex items-center gap-1">
                  {isBalanced ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Balanced</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Difference: ₹{Math.abs(totalDebits - totalCredits).toLocaleString('en-IN')}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsJournalModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-40"
                >
                  Post Journal Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

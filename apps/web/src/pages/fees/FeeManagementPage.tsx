import React, { useState, useEffect } from 'react';
import { erpService } from '../../services/erpService.js';
import { printService } from '../../services/printService.js';
import { IFeeHead, IFeeStructure, IStudentFeeRecord, IFeePayment } from '@smart-school/shared-types';
import { Receipt, DollarSign, Plus, Search, CheckCircle, AlertTriangle, Printer, RotateCcw, ShieldAlert, Zap } from 'lucide-react';

export const FeeManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dues' | 'structures' | 'defaulters' | 'payments'>('dues');
  const [feeHeads, setFeeHeads] = useState<IFeeHead[]>([]);
  const [feeStructures, setFeeStructures] = useState<IFeeStructure[]>([]);
  const [defaulters, setDefaulters] = useState<IStudentFeeRecord[]>([]);
  const [payments, setPayments] = useState<IFeePayment[]>([]);
  const [loading, setLoading] = useState(false);

  // New Fee Structure Modal
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [structClass, setStructClass] = useState('Grade 10');
  const [structHeadId, setStructHeadId] = useState('');
  const [structAmount, setStructAmount] = useState(25000);
  const [structDueDate, setStructDueDate] = useState('2026-11-30');
  const [structFreq, setStructFreq] = useState<'monthly' | 'quarterly' | 'annually' | 'one_time'>('annually');

  // Collect Payment Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IStudentFeeRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque'>('upi');
  const [transRef, setTransRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Receipt Modal
  const [receiptData, setReceiptData] = useState<IFeePayment | null>(null);

  // Void / Reversal Modal State
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [paymentToVoid, setPaymentToVoid] = useState<IFeePayment | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  const fetchFeeData = async () => {
    try {
      setLoading(true);
      const [hRes, sRes, dRes, pRes] = await Promise.all([
        erpService.getFeeHeads(),
        erpService.getFeeStructures(),
        erpService.getFeeDefaulters(),
        erpService.getFeePayments(),
      ]);
      setFeeHeads(hRes.data || []);
      setFeeStructures(sRes.data || []);
      setDefaulters(dRes.data || []);
      setPayments(pRes.data || []);

      if (hRes.data && hRes.data.length > 0) {
        setStructHeadId(hRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeData();
  }, []);

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await erpService.createFeeStructure({
        academicSession: '2026-2027',
        class: structClass,
        feeHeadId: structHeadId,
        amount: structAmount,
        dueDate: structDueDate,
        frequency: structFreq,
      });
      setShowStructureModal(false);
      fetchFeeData();
    } catch (err: any) {
      alert(err.message || 'Failed to create fee structure');
    }
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      const res = await erpService.recordFeePayment({
        studentId: selectedRecord.studentId,
        feeRecordId: selectedRecord.id,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        transactionReference: transRef,
        notes: payNotes,
      });

      setShowPayModal(false);
      setReceiptData(res.data?.payment || null);
      fetchFeeData();
    } catch (err: any) {
      alert(err.message || 'Payment collection failed');
    }
  };

  const handleVoidPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentToVoid) return;
    try {
      setVoiding(true);
      await erpService.voidFeePayment(paymentToVoid.id, voidReason);
      setShowVoidModal(false);
      setPaymentToVoid(null);
      setVoidReason('');
      fetchFeeData();
      alert(`Payment receipt #${paymentToVoid.receiptNumber} successfully voided and student balance restored.`);
    } catch (err: any) {
      alert(err.message || 'Failed to void fee payment');
    } finally {
      setVoiding(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-indigo-600" />
            Fee Management & Accounts Counter
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure fee heads, collect student dues, generate official receipts, and monitor defaulters.
          </p>
        </div>

        <button
          onClick={() => setShowStructureModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Fee Structure
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('dues')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'dues'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Outstanding Dues & Defaulters ({defaulters.length})
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'structures'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Fee Structures ({feeStructures.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'payments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Recent Collections ({payments.length})
        </button>
      </div>

      {/* TAB 1: OUTSTANDING DUES */}
      {activeTab === 'dues' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {defaulters.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No outstanding fee balances. All students are in good standing!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Fee Head</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Amount Due</th>
                    <th className="px-6 py-3">Paid</th>
                    <th className="px-6 py-3">Balance</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {defaulters.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{item.studentName}</div>
                        <div className="text-xs text-slate-500">
                          {item.class}-{item.section} • {item.admissionNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{item.feeHeadName}</td>
                      <td className="px-6 py-4 text-xs text-rose-600 font-semibold">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">₹{item.amountDue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-emerald-600 font-semibold">₹{item.amountPaid.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-rose-600">₹{item.balance.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedRecord(item);
                            setPayAmount(item.balance);
                            setShowPayModal(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition border border-indigo-200"
                        >
                          Collect Fee
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FEE STRUCTURES */}
      {activeTab === 'structures' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {feeStructures.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No fee structures configured yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-3">Fee Head</th>
                    <th className="px-6 py-3">Class</th>
                    <th className="px-6 py-3">Frequency</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeStructures.map((fs) => (
                    <tr key={fs.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">{fs.feeHeadName}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{fs.class}</td>
                      <td className="px-6 py-4 capitalize text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                          {fs.frequency}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(fs.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">₹{fs.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENTS LIST */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {payments.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No payment receipts issued yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-3">Receipt No</th>
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Fee Head</th>
                    <th className="px-6 py-3">Method</th>
                    <th className="px-6 py-3">Paid Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => {
                    const isVoided = p.status === 'voided' || p.status === 'cancelled';
                    return (
                      <tr key={p.id} className={`transition ${isVoided ? 'bg-rose-50/40 text-slate-400' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600">
                          {p.receiptNumber}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {p.studentName}
                          {isVoided && p.voidReason && (
                            <div className="text-[11px] text-rose-600 font-normal italic">
                              Reason: {p.voidReason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">{p.feeHeadName}</td>
                        <td className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">{new Date(p.paidAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          {isVoided ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              <ShieldAlert className="w-3 h-3" /> Voided
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" /> Settled
                            </span>
                          )}
                        </td>
                        <td className={`px-6 py-4 font-bold ${isVoided ? 'line-through text-slate-400' : 'text-emerald-600'}`}>
                          ₹{p.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setReceiptData(p)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Print Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {!isVoided && (
                              <button
                                onClick={() => {
                                  setPaymentToVoid(p);
                                  setShowVoidModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Void / Reverse Receipt"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* COLLECT PAYMENT MODAL */}
      {showPayModal && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              Collect Fee Payment
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>
                <span className="text-slate-400">Student: </span>
                <span className="font-semibold text-slate-800">{selectedRecord.studentName}</span>
              </div>
              <div>
                <span className="text-slate-400">Fee Head: </span>
                <span className="font-semibold text-slate-800">{selectedRecord.feeHeadName}</span>
              </div>
              <div>
                <span className="text-slate-400">Total Outstanding Balance: </span>
                <span className="font-bold text-rose-600">₹{selectedRecord.balance.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleCollectPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Amount (INR)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedRecord.balance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e: any) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="cash">Cash Counter</option>
                  <option value="card">Debit / Credit Card</option>
                  <option value="bank_transfer">Net Banking / NEFT</option>
                  <option value="cheque">Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Transaction / UTR Reference ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/123456789 or Cheque #8811"
                  value={transRef}
                  onChange={(e) => setTransRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
                >
                  Confirm & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT VIEW MODAL */}
      {receiptData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl space-y-6 border border-slate-200">
            {/* School Header */}
            <div className="text-center pb-4 border-b border-slate-200">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">TENORA365 ACADEMY</h2>
              <div className="text-xs text-slate-500 mt-1">Official Student Fee Receipt</div>
              <div className="text-xs font-mono font-bold text-indigo-600 mt-1">
                Receipt #{receiptData.receiptNumber}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-slate-400">Student Name:</div>
                <div className="font-bold text-slate-800 text-sm">{receiptData.studentName}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400">Date Issued:</div>
                <div className="font-semibold text-slate-700">
                  {new Date(receiptData.paidAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Admission No:</div>
                <div className="font-mono text-slate-700">{receiptData.admissionNumber || 'N/A'}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400">Payment Mode:</div>
                <div className="font-bold uppercase text-slate-800">{receiptData.paymentMethod}</div>
              </div>
            </div>

            {/* Receipt Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 flex justify-between">
                <span>Fee Item</span>
                <span>Amount Paid</span>
              </div>
              <div className="px-4 py-3 text-sm flex justify-between font-semibold text-slate-800">
                <span>{receiptData.feeHeadName}</span>
                <span className="text-emerald-600 font-bold">₹{receiptData.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-xs text-slate-400">
              <div>
                Cashier: <span className="text-slate-600 font-medium">{receiptData.cashierName || 'Counter 1'}</span>
              </div>
              <div className="text-right border-t border-slate-400 pt-1 w-36">
                Authorized Signatory
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReceiptData(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => printService.printReceiptOrCard({ silent: true, title: `Receipt_${receiptData.receiptNumber}` })}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                title="Direct POS thermal print without system dialog"
              >
                <Zap className="w-4 h-4" /> Silent Print (POS)
              </button>
              <button
                onClick={() => printService.printReceiptOrCard({ silent: false, title: `Receipt_${receiptData.receiptNumber}` })}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Standard Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE FEE STRUCTURE MODAL */}
      {showStructureModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Fee Structure</h3>
            <form onSubmit={handleCreateStructure} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fee Head</label>
                <select
                  required
                  value={structHeadId}
                  onChange={(e) => setStructHeadId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {feeHeads.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
                <select
                  value={structClass}
                  onChange={(e) => setStructClass(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 6">Grade 6</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (INR)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={structAmount}
                  onChange={(e) => setStructAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={structDueDate}
                  onChange={(e) => setStructDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Billing Frequency</label>
                <select
                  value={structFreq}
                  onChange={(e: any) => setStructFreq(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                  <option value="one_time">One Time</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowStructureModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
                >
                  Save & Allocate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOID PAYMENT MODAL */}
      {showVoidModal && paymentToVoid && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Void / Reverse Payment</h3>
                <p className="text-xs text-slate-500">Receipt #{paymentToVoid.receiptNumber}</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200/80 text-xs text-rose-900 space-y-1.5">
              <p className="font-semibold">⚠️ Irreversible Ledger Reversal Notice:</p>
              <p>
                Voiding this receipt will deduct <span className="font-bold">₹{paymentToVoid.amount.toLocaleString()}</span> from paid collections, reinstate the outstanding dues on student <span className="font-bold">{paymentToVoid.studentName}</span>'s account, and log an immutable entry into the compliance audit trail.
              </p>
            </div>

            <form onSubmit={handleVoidPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Audit Reason for Reversal <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Cheque bounced / Entry recorded under wrong student / Cashier double-entry"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowVoidModal(false);
                    setPaymentToVoid(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={voiding || !voidReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  {voiding ? 'Reversing...' : 'Confirm Void & Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

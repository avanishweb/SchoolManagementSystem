import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/studentService.js';
import { erpService } from '../../services/erpService.js';
import { IStudent } from '@smart-school/shared-types';
import { STANDARD_CLASSES, STANDARD_SECTIONS } from '@smart-school/shared-utils';
import {
  GraduationCap,
  ArrowRight,
  RotateCcw,
  History,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Filter,
  CheckSquare,
  Square,
  ShieldCheck,
  ChevronRight,
  Calendar,
} from 'lucide-react';

export const PromotionPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<'promote' | 'history'>('promote');

  // Source selections
  const [fromSession, setFromSession] = useState(`${currentYear - 1}-${currentYear}`);
  const [fromClass, setFromClass] = useState('Grade 9');
  const [fromSection, setFromSection] = useState('A');

  // Target selections
  const [toSession, setToSession] = useState(`${currentYear}-${currentYear + 1}`);
  const [toClass, setToClass] = useState('Grade 10');
  const [toSection, setToSection] = useState('A');

  // Students list and promotion mapping
  const [students, setStudents] = useState<IStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Record<string, boolean>>({});
  const [studentActions, setStudentActions] = useState<Record<string, 'promote' | 'retain' | 'graduate'>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Batches history
  const [batches, setBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [undoBatchId, setUndoBatchId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'promote') {
      loadStudents();
    } else {
      loadBatches();
    }
  }, [activeTab, fromClass, fromSection, fromSession]);

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getStudents({
        class: fromClass,
        section: fromSection,
        status: 'active',
        limit: 100,
      });
      const list = res.items || [];
      setStudents(list);

      // Default all to selected and promote
      const initialSelected: Record<string, boolean> = {};
      const initialActions: Record<string, 'promote' | 'retain' | 'graduate'> = {};
      list.forEach((s: IStudent) => {
        initialSelected[s.id] = true;
        initialActions[s.id] = 'promote';
      });
      setSelectedStudentIds(initialSelected);
      setStudentActions(initialActions);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch student roll');
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await erpService.getPromotionBatches();
      setBatches(res.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleToggleSelectAll = () => {
    const allSelected = students.every((s) => selectedStudentIds[s.id]);
    const updated: Record<string, boolean> = {};
    students.forEach((s) => {
      updated[s.id] = !allSelected;
    });
    setSelectedStudentIds(updated);
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const studentsToProcess = students.filter((s) => selectedStudentIds[s.id]);
    if (studentsToProcess.length === 0) {
      setError('Please select at least one student to promote or retain.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        fromSession,
        fromClass,
        fromSection,
        toSession,
        toClass,
        toSection,
        students: studentsToProcess.map((s, index) => ({
          studentId: s.id,
          action: studentActions[s.id] || 'promote',
          nextRollNumber: String(index + 1).padStart(2, '0'),
        })),
      };

      await erpService.promoteStudents(payload);
      setSuccessMsg(`Successfully processed academic promotion for ${studentsToProcess.length} students! Snapshot created with 1-click Undo safety.`);
      loadStudents();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Promotion failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndoPromotion = async (batchId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await erpService.undoPromotion(batchId);
      setSuccessMsg('Academic promotion successfully undone! All students restored to prior classes.');
      setUndoBatchId(null);
      loadBatches();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to undo promotion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
            <GraduationCap className="w-5 h-5" />
            <span>Academic Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Year Promotion</h1>
          <p className="text-sm text-slate-500 mt-1">
            Seamlessly roll forward student cohorts into the new academic session with full snapshot-backed Undo protection.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('promote')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'promote'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Batch Promotion</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Promotion History & Undo</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {activeTab === 'promote' && (
        <div className="space-y-6">
          {/* Source and Target Configuration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Source Cohort */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-4 pb-3 border-b border-slate-100">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Source Cohort (Current Class)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Session</label>
                  <input
                    type="text"
                    value={fromSession}
                    onChange={(e) => setFromSession(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Class</label>
                  <select
                    value={fromClass}
                    onChange={(e) => setFromClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {STANDARD_CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Section</label>
                  <select
                    value={fromSection}
                    onChange={(e) => setFromSection(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {STANDARD_SECTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Target Cohort */}
            <div className="bg-white p-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white shadow-sm">
              <div className="flex items-center gap-2 text-indigo-950 font-bold text-base mb-4 pb-3 border-b border-indigo-100">
                <ArrowRight className="w-5 h-5 text-emerald-600" />
                <span>Target Cohort (Promoted To)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Next Session</label>
                  <input
                    type="text"
                    value={toSession}
                    onChange={(e) => setToSession(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Next Class</label>
                  <select
                    value={toClass}
                    onChange={(e) => setToClass(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {STANDARD_CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Next Section</label>
                  <select
                    value={toSection}
                    onChange={(e) => setToSection(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {STANDARD_SECTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Student Selection Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider hover:text-indigo-600 transition-colors"
                >
                  {students.every((s) => selectedStudentIds[s.id]) && students.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                  <span>Select All ({students.length})</span>
                </button>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs font-medium text-slate-500">
                  {students.filter((s) => selectedStudentIds[s.id]).length} of {students.length} Selected
                </span>
              </div>

              <button
                type="button"
                onClick={handlePromoteSubmit}
                disabled={submitting || loading || students.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>{submitting ? 'Processing Promotion...' : 'Execute Batch Promotion'}</span>
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm font-medium">Loading students in {fromClass} - {fromSection}...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-700">No active students found</p>
                <p className="text-sm text-slate-400 mt-1">There are no active students in {fromClass} - {fromSection} for {fromSession}.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">Select</th>
                      <th className="py-3 px-4">Adm #</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Roll</th>
                      <th className="py-3 px-4">Current Cohort</th>
                      <th className="py-3 px-4">Promotion Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => {
                      const isSelected = !!selectedStudentIds[student.id];
                      return (
                        <tr
                          key={student.id}
                          className={`hover:bg-slate-50/60 transition-colors ${
                            isSelected ? 'bg-indigo-50/30' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) =>
                                setSelectedStudentIds((prev) => ({
                                  ...prev,
                                  [student.id]: e.target.checked,
                                }))
                              }
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700">
                            {student.admissionNumber}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {student.firstName} {student.lastName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                            {student.rollNumber || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 text-xs">
                            <span className="font-medium text-slate-700">{student.class} - {student.section}</span>
                            <span className="text-slate-400 block">{student.academicSession}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={studentActions[student.id] || 'promote'}
                              onChange={(e) =>
                                setStudentActions((prev) => ({
                                  ...prev,
                                  [student.id]: e.target.value as any,
                                }))
                              }
                              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="promote">✅ Promote to {toClass}</option>
                              <option value="retain">🔁 Retain (Repeat {fromClass})</option>
                              <option value="graduate">🎓 Graduate / Pass Out</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Promotion Audit Batches</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every promotion run is snapshot-preserved. Click "Undo Promotion" to safely revert any accidental promotion.
              </p>
            </div>
            <button
              onClick={loadBatches}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh History</span>
            </button>
          </div>

          {loadingBatches ? (
            <div className="p-12 text-center text-slate-500">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm font-medium">Loading promotion audit logs...</p>
            </div>
          ) : batches.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-700">No promotion batches recorded</p>
              <p className="text-sm text-slate-400 mt-1">Batch runs will appear here with full one-click Undo capability.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Batch ID</th>
                    <th className="py-3 px-4">Executed Date</th>
                    <th className="py-3 px-4">From Cohort</th>
                    <th className="py-3 px-4">To Cohort</th>
                    <th className="py-3 px-4">Students</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Undo Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((batch) => {
                    const isReverted = batch.status === 'reverted';
                    return (
                      <tr key={batch.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600 font-bold">
                          {batch.id?.substring(0, 8)}...
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {new Date(batch.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
                          {batch.fromClass} - {batch.fromSection} ({batch.fromSession})
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-indigo-700">
                          {batch.toClass} - {batch.toSection} ({batch.toSession})
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold text-slate-700">
                          {batch.studentCount || batch.studentsSnapshot?.length || 0} Students
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {isReverted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                              Reverted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Active (Promoted)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {!isReverted && (
                            <button
                              type="button"
                              onClick={() => setUndoBatchId(batch.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Undo Promotion</span>
                            </button>
                          )}
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

      {/* Undo Confirmation Modal */}
      {undoBatchId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Revert Academic Promotion?</h3>
            <p className="text-sm text-slate-600 mb-6">
              This will restore all students in this promotion run back to their exact original class, section, session, roll number, and status snapshot.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUndoBatchId(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleUndoPromotion(undoBatchId)}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors"
              >
                {submitting ? 'Reverting...' : 'Confirm Undo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

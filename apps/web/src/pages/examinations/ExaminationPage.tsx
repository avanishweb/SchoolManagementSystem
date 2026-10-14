import React, { useState, useEffect } from 'react';
import { erpService } from '../../services/erpService.js';
import { studentService } from '../../services/studentService.js';
import { IExamination, IStudent } from '@smart-school/shared-types';
import { Award, Plus, FileText, CheckCircle, Printer, BookOpen } from 'lucide-react';

export const ExaminationPage: React.FC = () => {
  const [exams, setExams] = useState<IExamination[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  // Marks Entry State
  const [markClass, setMarkClass] = useState('Grade 10');
  const [markSection, setMarkSection] = useState('A');
  const [markSubject, setMarkSubject] = useState('Mathematics');
  const [students, setStudents] = useState<IStudent[]>([]);
  const [marksSheet, setMarksSheet] = useState<Record<string, { theory: number; practical: number; absent: boolean }>>({});
  const [savingMarks, setSavingMarks] = useState(false);

  // Report Card State
  const [reportCardModal, setReportCardModal] = useState<any | null>(null);

  // New Exam Modal
  const [showExamModal, setShowExamModal] = useState(false);
  const [examName, setExamName] = useState('');
  const [examSession, setExamSession] = useState('2026-2027');
  const [startDate, setStartDate] = useState('2026-09-15');
  const [endDate, setEndDate] = useState('2026-09-30');

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await erpService.getExams();
      setExams(res.data || []);
      if (res.data && res.data.length > 0 && !selectedExamId) {
        setSelectedExamId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await studentService.getStudents({
        class: markClass,
        section: markSection,
        status: 'active',
        limit: 100,
      });
      const list = res.items || [];
      setStudents(list);

      const initial: Record<string, { theory: number; practical: number; absent: boolean }> = {};
      for (const st of list) {
        initial[st.id] = { theory: 60, practical: 15, absent: false };
      }
      setMarksSheet(initial);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchStudents();
    }
  }, [selectedExamId, markClass, markSection, markSubject]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await erpService.createExam({
        name: examName,
        academicSession: examSession,
        startDate,
        endDate,
        classes: ['Grade 10', 'Grade 9', 'Grade 8'],
      });
      setShowExamModal(false);
      setExamName('');
      fetchExams();
    } catch (err: any) {
      alert(err.message || 'Failed to create exam');
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedExamId) return;
    try {
      setSavingMarks(true);
      const marksPayload = students.map((st) => ({
        studentId: st.id,
        theoryMarks: marksSheet[st.id]?.theory || 0,
        practicalMarks: marksSheet[st.id]?.practical || 0,
        isAbsent: marksSheet[st.id]?.absent || false,
      }));

      await erpService.recordExamMarks({
        examId: selectedExamId,
        class: markClass,
        section: markSection,
        subject: markSubject,
        maxMarks: 100,
        marks: marksPayload,
      });

      alert('Marks sheet recorded and grades computed successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to record marks');
    } finally {
      setSavingMarks(false);
    }
  };

  const handleViewReportCard = async (studentId: string) => {
    if (!selectedExamId) return;
    try {
      const res = await erpService.getReportCard(selectedExamId, studentId);
      setReportCardModal(res.data);
    } catch (err: any) {
      alert(err.message || 'No marks found for report card yet. Please record marks first.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" />
            Examination & Report Card Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Schedule terms, enter subject marks, auto-compute grading scales, and generate report cards.
          </p>
        </div>

        <button
          onClick={() => setShowExamModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Examination
        </button>
      </div>

      {/* Exam Selection Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase">Active Exam:</span>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.academicSession})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={markClass}
            onChange={(e) => setMarkClass(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold"
          >
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 8">Grade 8</option>
          </select>
          <select
            value={markSection}
            onChange={(e) => setMarkSection(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold"
          >
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>
          <select
            value={markSubject}
            onChange={(e) => setMarkSubject(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold"
          >
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="Social Science">Social Science</option>
          </select>
          <button
            onClick={handleSaveMarks}
            disabled={savingMarks || students.length === 0}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            {savingMarks ? 'Saving...' : 'Save Marks Sheet'}
          </button>
        </div>
      </div>

      {/* Marks Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading exam records...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No students found in {markClass}-{markSection}. Please select an active class.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Roll & Student</th>
                  <th className="px-6 py-3">Theory (Max 80)</th>
                  <th className="px-6 py-3">Practical (Max 20)</th>
                  <th className="px-6 py-3">Total (100)</th>
                  <th className="px-6 py-3">Grade Preview</th>
                  <th className="px-6 py-3 text-center">Report Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const entry = marksSheet[st.id] || { theory: 0, practical: 0, absent: false };
                  const total = entry.absent ? 0 : entry.theory + entry.practical;
                  const grade =
                    entry.absent
                      ? 'AB'
                      : total >= 90
                      ? 'A+'
                      : total >= 80
                      ? 'A'
                      : total >= 70
                      ? 'B'
                      : total >= 60
                      ? 'C'
                      : total >= 33
                      ? 'D'
                      : 'F';

                  return (
                    <tr key={st.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{st.fullName || `${st.firstName} ${st.lastName}`}</div>
                        <div className="text-xs text-slate-400 font-mono">{st.admissionNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          max="80"
                          value={entry.theory}
                          disabled={entry.absent}
                          onChange={(e) =>
                            setMarksSheet((prev) => ({
                              ...prev,
                              [st.id]: {
                                ...prev[st.id],
                                theory: Math.min(80, Math.max(0, Number(e.target.value))),
                              },
                            }))
                          }
                          className="w-20 px-2 py-1 text-sm border border-slate-300 rounded-lg text-center font-bold"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={entry.practical}
                          disabled={entry.absent}
                          onChange={(e) =>
                            setMarksSheet((prev) => ({
                              ...prev,
                              [st.id]: {
                                ...prev[st.id],
                                practical: Math.min(20, Math.max(0, Number(e.target.value))),
                              },
                            }))
                          }
                          className="w-20 px-2 py-1 text-sm border border-slate-300 rounded-lg text-center font-bold"
                        />
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{entry.absent ? 'Absent' : total}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-black ${
                            grade === 'A+' || grade === 'A'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : grade === 'B' || grade === 'C'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewReportCard(st.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition border border-slate-200"
                        >
                          <FileText className="w-3.5 h-3.5" /> Progress Card
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REPORT CARD PREVIEW MODAL */}
      {reportCardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 border border-slate-200">
            {/* Header */}
            <div className="text-center pb-4 border-b border-slate-200">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">TENORA365 MODEL ACADEMY</h2>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">
                Annual Student Academic Progress Card
              </div>
              <div className="text-xs font-bold text-indigo-600 mt-1">
                {reportCardModal.exam?.name} • Session {reportCardModal.exam?.academicSession}
              </div>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400">Student: </span>
                <span className="font-bold text-slate-900">{reportCardModal.student?.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Admission No: </span>
                <span className="font-mono text-slate-700">{reportCardModal.student?.admissionNumber}</span>
              </div>
              <div>
                <span className="text-slate-400">Class & Section: </span>
                <span className="font-bold text-slate-900">
                  {reportCardModal.student?.class} - {reportCardModal.student?.section}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Overall Result: </span>
                <span
                  className={`font-black uppercase ${
                    reportCardModal.summary?.resultStatus === 'Passed' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {reportCardModal.summary?.resultStatus}
                </span>
              </div>
            </div>

            {/* Subject Marks Table */}
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 font-bold text-slate-600">
                <tr>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Theory</th>
                  <th className="p-3">Practical</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportCardModal.marks?.map((m: any) => (
                  <tr key={m.id}>
                    <td className="p-3 font-semibold text-slate-800">{m.subject}</td>
                    <td className="p-3">{m.theoryMarks}</td>
                    <td className="p-3">{m.practicalMarks}</td>
                    <td className="p-3 font-bold">{m.totalMarks} / {m.maxMarks}</td>
                    <td className="p-3 font-black text-indigo-600">{m.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary Highlights */}
            <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-200 text-sm">
              <div>
                <span className="text-slate-600 font-medium">Grand Total: </span>
                <span className="font-bold text-slate-900">
                  {reportCardModal.summary?.totalScored} / {reportCardModal.summary?.totalPossible}
                </span>
              </div>
              <div>
                <span className="text-slate-600 font-medium">Percentage: </span>
                <span className="font-black text-indigo-700">{reportCardModal.summary?.percentage}%</span>
              </div>
              <div>
                <span className="text-slate-600 font-medium">Final Grade: </span>
                <span className="font-black text-emerald-700 text-base">{reportCardModal.summary?.overallGrade}</span>
              </div>
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-xs text-slate-400">
              <div className="border-t border-slate-400 pt-1 w-36 text-center">Class Teacher</div>
              <div className="border-t border-slate-400 pt-1 w-36 text-center">Principal</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReportCardModal(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Progress Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE EXAM MODAL */}
      {showExamModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Schedule Examination</h3>
            <form onSubmit={handleCreateExam} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Examination"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Session</label>
                <input
                  type="text"
                  required
                  value={examSession}
                  onChange={(e) => setExamSession(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
                >
                  Create Examination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

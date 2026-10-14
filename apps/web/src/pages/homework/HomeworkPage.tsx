import React, { useState, useEffect } from 'react';
import { erpService } from '../../services/erpService.js';
import { IHomework, IHomeworkSubmission } from '@smart-school/shared-types';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  Send,
  Award,
  AlertCircle,
  FileText,
  User,
  Search,
} from 'lucide-react';

export const HomeworkPage: React.FC = () => {
  const [homeworkList, setHomeworkList] = useState<IHomework[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('Class 10');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);

  // Active items for modals
  const [activeHomework, setActiveHomework] = useState<IHomework | null>(null);
  const [submissions, setSubmissions] = useState<IHomeworkSubmission[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<IHomeworkSubmission | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    title: '',
    subject: 'Mathematics',
    class: 'Class 10',
    section: 'A',
    description: '',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    maxMarks: 20,
  });

  const [submitForm, setSubmitForm] = useState({
    studentId: '',
    studentName: 'Aarav Patel',
    submissionContent: '',
    attachmentUrl: '',
  });

  const [gradeForm, setGradeForm] = useState({
    marks: 18,
    feedback: 'Good analytical breakdown and correct calculations.',
  });

  useEffect(() => {
    loadHomework();
  }, [selectedClass, selectedSection]);

  const loadHomework = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await erpService.getHomework(selectedClass, selectedSection);
      setHomeworkList(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch homework assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await erpService.createHomework({
        ...createForm,
        assignedDate: new Date().toISOString(),
      });
      setSuccessMsg('Homework assignment assigned to class successfully.');
      setIsCreateModalOpen(false);
      setCreateForm({
        title: '',
        subject: 'Mathematics',
        class: selectedClass,
        section: selectedSection,
        description: '',
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        maxMarks: 20,
      });
      loadHomework();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create homework');
    }
  };

  const handleOpenSubmissions = async (hw: IHomework) => {
    setActiveHomework(hw);
    try {
      const res = await erpService.getHomeworkSubmissions(hw._id || '');
      setSubmissions(res.data || []);
      setIsGradingModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load submissions');
    }
  };

  const handleOpenSubmit = (hw: IHomework) => {
    setActiveHomework(hw);
    setSubmitForm({
      studentId: '',
      studentName: 'Aarav Patel',
      submissionContent: '',
      attachmentUrl: '',
    });
    setIsSubmitModalOpen(true);
  };

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHomework) return;
    try {
      await erpService.submitHomework({
        homeworkId: activeHomework._id,
        studentName: submitForm.studentName,
        submissionContent: submitForm.submissionContent,
        attachments: submitForm.attachmentUrl ? [submitForm.attachmentUrl] : [],
      });
      setSuccessMsg('Assignment submission recorded successfully.');
      setIsSubmitModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit assignment');
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;
    try {
      await erpService.gradeSubmission(
        activeSubmission._id || '',
        gradeForm.marks,
        gradeForm.feedback
      );
      setSuccessMsg('Graded submission successfully.');
      setActiveSubmission(null);
      if (activeHomework) {
        const res = await erpService.getHomeworkSubmissions(activeHomework._id || '');
        setSubmissions(res.data || []);
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to grade submission');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>Digital Learning & Homework Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Homework & Assignments</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Assign curriculum tasks, collect digital submissions, track late turn-ins, and publish teacher evaluations.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-md shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Class & Section Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Filter Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Class 10">Class 10</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 7">Class 7</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong>{homeworkList.length} assignments</strong>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Homework Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Clock className="w-8 h-8 mx-auto animate-spin text-indigo-500 mb-2" />
          <span>Loading assignments...</span>
        </div>
      ) : homeworkList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Assignments Yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            There are currently no homework tasks posted for {selectedClass} Section {selectedSection}.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
          >
            Create First Assignment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {homeworkList.map((hw) => {
            const isDuePassed = new Date(hw.dueDate).getTime() < Date.now();
            return (
              <div
                key={hw._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {hw.subject}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isDuePassed
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isDuePassed ? 'Closed' : 'Active'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug">{hw.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {hw.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Due: {new Date(hw.dueDate).toLocaleDateString()}
                    </span>
                    <span className="font-semibold text-slate-700">
                      Max: {hw.maxMarks || 20} Marks
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleOpenSubmissions(hw)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Submissions</span>
                    </button>
                    <button
                      onClick={() => handleOpenSubmit(hw)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Turn In</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Assignment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Create New Homework Task</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHomework} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Chapter 4 Quadratic Equations Problem Set"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={createForm.subject}
                    onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={createForm.maxMarks}
                    onChange={(e) => setCreateForm({ ...createForm, maxMarks: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
                  <input
                    type="text"
                    value={createForm.class}
                    onChange={(e) => setCreateForm({ ...createForm, class: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={createForm.section}
                    onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instructions & Question Details
                </label>
                <textarea
                  rows={4}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Provide detailed instructions or references for exercises..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Turn In Modal */}
      {isSubmitModalOpen && activeHomework && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Submit Assignment</h3>
                <p className="text-xs text-slate-500">{activeHomework.title}</p>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitHomework} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Name</label>
                <input
                  type="text"
                  value={submitForm.studentName}
                  onChange={(e) => setSubmitForm({ ...submitForm, studentName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submission Answers / Response
                </label>
                <textarea
                  rows={4}
                  value={submitForm.submissionContent}
                  onChange={(e) => setSubmitForm({ ...submitForm, submissionContent: e.target.value })}
                  placeholder="Type your answers or working steps here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attachment Link (Optional)
                </label>
                <input
                  type="text"
                  value={submitForm.attachmentUrl}
                  onChange={(e) => setSubmitForm({ ...submitForm, attachmentUrl: e.target.value })}
                  placeholder="https://drive.google.com/... or /uploads/solution.pdf"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
                >
                  Turn In Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Submissions & Grading Drawer/Modal */}
      {isGradingModalOpen && activeHomework && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">
                  Submissions: {activeHomework.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Max Marks: {activeHomework.maxMarks || 20} • Total Turned In: {submissions.length}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsGradingModalOpen(false);
                  setActiveSubmission(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {activeSubmission ? (
                // Evaluation form for single submission
                <form onSubmit={handleGradeSubmission} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{activeSubmission.studentName}</h4>
                      <p className="text-xs text-slate-500">
                        Turned in on {new Date(activeSubmission.submittedAt || Date.now()).toLocaleString()}
                        {activeSubmission.isLate && <span className="ml-2 text-rose-600 font-semibold">(LATE)</span>}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSubmission(null)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      ← Back to All Submissions
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap">
                    {activeSubmission.submissionContent}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Marks Awarded (Max {activeHomework.maxMarks || 20})
                      </label>
                      <input
                        type="number"
                        max={activeHomework.maxMarks || 20}
                        min={0}
                        value={gradeForm.marks}
                        onChange={(e) => setGradeForm({ ...gradeForm, marks: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Teacher Feedback
                      </label>
                      <input
                        type="text"
                        value={gradeForm.feedback}
                        onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveSubmission(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Save Evaluation
                    </button>
                  </div>
                </form>
              ) : submissions.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No students have turned in this assignment yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div
                      key={sub._id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{sub.studentName}</span>
                          {sub.isLate && (
                            <span className="text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded">
                              LATE
                            </span>
                          )}
                          {sub.status === 'GRADED' && (
                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded">
                              GRADED: {sub.marksObtained}/{activeHomework.maxMarks}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Submitted: {new Date(sub.submittedAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setActiveSubmission(sub);
                          setGradeForm({
                            marks: sub.marksObtained || 15,
                            feedback: sub.teacherFeedback || 'Well done.',
                          });
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold"
                      >
                        {sub.status === 'GRADED' ? 'Edit Grade' : 'Grade'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

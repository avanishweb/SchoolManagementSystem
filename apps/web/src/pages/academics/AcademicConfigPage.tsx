import React, { useState, useEffect } from 'react';
import { erpService } from '../../services/erpService.js';
import { IAcademicSession, IClassroom, ISubject } from '@smart-school/shared-types';
import { BookOpen, Calendar, Plus, CheckCircle, Award } from 'lucide-react';

export const AcademicConfigPage: React.FC = () => {
  const [sessions, setSessions] = useState<IAcademicSession[]>([]);
  const [classes, setClasses] = useState<IClassroom[]>([]);
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [loading, setLoading] = useState(true);

  // New Class Form State
  const [showClassModal, setShowClassModal] = useState(false);
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [classSections, setClassSections] = useState('A, B');

  // New Subject Form State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectType, setSubjectType] = useState<'theory' | 'practical' | 'both'>('theory');

  // New Session Form State
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [startDate, setStartDate] = useState('2026-04-01');
  const [endDate, setEndDate] = useState('2027-03-31');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, cRes, subRes] = await Promise.all([
        erpService.getSessions(),
        erpService.getClasses(),
        erpService.getSubjects(),
      ]);
      setSessions(sRes.data || []);
      setClasses(cRes.data || []);
      setSubjects(subRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sections = classSections.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
      await erpService.createClass({
        name: className,
        code: classCode,
        sections,
      });
      setShowClassModal(false);
      setClassName('');
      setClassCode('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create class');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await erpService.createSubject({
        name: subjectName,
        code: subjectCode,
        type: subjectType,
        passMarks: 33,
        maxMarks: 100,
      });
      setShowSubjectModal(false);
      setSubjectName('');
      setSubjectCode('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create subject');
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await erpService.createSession({
        name: sessionName,
        startDate,
        endDate,
        isCurrent: true,
      });
      setShowSessionModal(false);
      setSessionName('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create session');
    }
  };

  const handleSetCurrentSession = async (id: string) => {
    try {
      await erpService.setCurrentSession(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update current session');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            Academic Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure academic sessions, class sections, and course curriculum.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading academic records...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SESSIONS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Academic Sessions
              </h2>
              <button
                onClick={() => setShowSessionModal(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="space-y-2">
              {sessions.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">No academic sessions added yet.</div>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{s.name}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    {s.isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetCurrentSession(s.id)}
                        className="text-xs text-slate-500 hover:text-indigo-600 font-medium underline"
                      >
                        Set Active
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CLASSES & SECTIONS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Classes & Sections
              </h2>
              <button
                onClick={() => setShowClassModal(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Class
              </button>
            </div>

            <div className="space-y-2">
              {classes.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">No classrooms configured yet.</div>
              ) : (
                classes.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{c.name}</div>
                      <div className="text-xs text-slate-500">Code: {c.code}</div>
                    </div>
                    <div className="flex gap-1">
                      {(c.sections || []).map((sec) => (
                        <span
                          key={sec}
                          className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md border border-slate-200"
                        >
                          Sec {sec}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SUBJECTS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Subjects Curriculum
              </h2>
              <button
                onClick={() => setShowSubjectModal(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Subject
              </button>
            </div>

            <div className="space-y-2">
              {subjects.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">No subjects configured yet.</div>
              ) : (
                subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{sub.name}</div>
                      <div className="text-xs text-slate-500">{sub.code} • Max {sub.maxMarks} pts</div>
                    </div>
                    <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {sub.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {showClassModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Classroom</h3>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 10"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. G10"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sections (comma separated)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A, B, C"
                  value={classSections}
                  onChange={(e) => setClassSections(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SUBJECT MODAL */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MATH-101"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Evaluation Type</label>
                <select
                  value={subjectType}
                  onChange={(e: any) => setSubjectType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="theory">Theory Only</option>
                  <option value="practical">Practical Only</option>
                  <option value="both">Theory + Practical</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SESSION MODAL */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Academic Session</h3>
            <form onSubmit={handleCreateSession} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Session Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-2027"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
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
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

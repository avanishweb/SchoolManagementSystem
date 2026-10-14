import React, { useState, useEffect } from 'react';
import { erpService } from '../../services/erpService.js';
import { STANDARD_CLASSES, STANDARD_SECTIONS } from '@smart-school/shared-utils';
import {
  BookOpen,
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Share2,
  Trash2,
  Edit2,
  AlertCircle,
  FileText,
  User,
  GraduationCap,
  MessageCircle,
} from 'lucide-react';

const STANDARD_SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Social Studies',
  'Hindi',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Art & Craft',
  'Physical Education',
];

export const DailyDiaryPage: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedClass, setSelectedClass] = useState('Grade 10');
  const [selectedSection, setSelectedSection] = useState('A');

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: 'Mathematics',
    topicCovered: '',
    homework: '',
    teacherRemarks: '',
    signedOff: true,
  });

  useEffect(() => {
    loadDiaryEntries();
  }, [selectedDate, selectedClass, selectedSection]);

  const loadDiaryEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await erpService.getDailyDiary(selectedClass, selectedSection, selectedDate);
      setEntries(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load diary entries');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingEntryId(null);
    setFormData({
      subject: 'Mathematics',
      topicCovered: '',
      homework: '',
      teacherRemarks: '',
      signedOff: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry: any) => {
    setEditingEntryId(entry.id);
    setFormData({
      subject: entry.subject,
      topicCovered: entry.topicCovered || '',
      homework: entry.homework || '',
      teacherRemarks: entry.teacherRemarks || '',
      signedOff: !!entry.signedOff,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingEntryId) {
        await erpService.updateDailyDiary(editingEntryId, {
          ...formData,
          date: selectedDate,
          class: selectedClass,
          section: selectedSection,
        });
        setSuccessMsg('Diary entry updated successfully!');
      } else {
        await erpService.createDailyDiary({
          ...formData,
          date: selectedDate,
          class: selectedClass,
          section: selectedSection,
        });
        setSuccessMsg('New daily diary record added!');
      }
      setIsModalOpen(false);
      loadDiaryEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save diary entry');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this diary entry?')) return;
    try {
      await erpService.deleteDailyDiary(id);
      setSuccessMsg('Diary entry removed.');
      loadDiaryEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete');
    }
  };

  const generateWhatsAppShare = () => {
    const text = `*📅 DAILY DIARY REPORT - ${selectedClass} (${selectedSection})*\n` +
      `Date: ${selectedDate}\n\n` +
      entries.map((e, idx) =>
        `*${idx + 1}. ${e.subject}*\n` +
        `• Topic: ${e.topicCovered || 'N/A'}\n` +
        `• Homework: ${e.homework || 'None'}\n` +
        (e.teacherRemarks ? `• Note: ${e.teacherRemarks}\n` : '')
      ).join('\n') +
      `\n_Sent via Smart School ERP Parent Connect_`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
            <BookOpen className="w-5 h-5" />
            <span>Digital Classroom</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Diary & Homework Log</h1>
          <p className="text-sm text-slate-500 mt-1">
            Publish lesson topics covered, homework assigned, and teacher remarks with 1-click WhatsApp parent broadcast.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {entries.length > 0 && (
            <button
              onClick={generateWhatsAppShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share to Parents (WhatsApp)</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Diary Entry</span>
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

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Diary Date</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Target Class</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {STANDARD_CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Section</span>
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {STANDARD_SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Diary Entries List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Fetching daily diary records...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Diary Entries for {selectedDate}</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Subject teachers have not recorded lesson coverage or homework tasks for {selectedClass} ({selectedSection}) today.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Subject Entry</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      {entry.subject?.substring(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{entry.subject}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>By {entry.teacherName || 'Subject Teacher'}</span>
                        {entry.signedOff && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Signed off
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(entry)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Edit Entry"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2 text-sm">
                  {/* Topic Covered */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Topic Covered in Class
                    </span>
                    <p className="text-slate-800 font-medium">{entry.topicCovered || 'Not specified'}</p>
                  </div>

                  {/* Homework Assigned */}
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                      Homework / Home Task
                    </span>
                    <p className="text-amber-950 font-medium">{entry.homework || 'No homework assigned'}</p>
                  </div>

                  {/* Teacher Remarks */}
                  {entry.teacherRemarks && (
                    <div className="text-xs text-slate-500 italic px-1">
                      <span className="font-semibold text-slate-600">Note: </span>
                      "{entry.teacherRemarks}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>{editingEntryId ? 'Edit Daily Diary Entry' : 'New Daily Diary Entry'}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {STANDARD_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Lesson Topic Covered <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4: Quadratic Equations - Ex 4.2"
                  value={formData.topicCovered}
                  onChange={(e) => setFormData({ ...formData, topicCovered: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Homework Assigned</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Solve questions 1 to 6 in practice notebook"
                  value={formData.homework}
                  onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Teacher Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Unit test on this topic on Friday"
                  value={formData.teacherRemarks}
                  onChange={(e) => setFormData({ ...formData, teacherRemarks: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="signOff"
                  checked={formData.signedOff}
                  onChange={(e) => setFormData({ ...formData, signedOff: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="signOff" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Mark as Teacher Signed Off / Approved
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors"
                >
                  {editingEntryId ? 'Update Entry' : 'Save Diary Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

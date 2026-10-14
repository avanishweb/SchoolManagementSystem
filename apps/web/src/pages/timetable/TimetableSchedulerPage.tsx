import React, { useState, useEffect } from 'react';
import { erpService } from '../../services/erpService.js';
import { ITimetableSlot, IClassroom, ISection, DayOfWeek } from '@smart-school/shared-types';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  Printer,
  Sparkles,
  BookOpen,
  User,
  MapPin,
  CheckCircle,
} from 'lucide-react';

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export const TimetableSchedulerPage: React.FC = () => {
  const [classes, setClasses] = useState<IClassroom[]>([]);
  const [sections, setSections] = useState<ISection[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('Class 10');
  const [selectedSection, setSelectedSection] = useState<string>('A');

  const [timetable, setTimetable] = useState<ITimetableSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal & Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [formData, setFormData] = useState<{
    dayOfWeek: DayOfWeek;
    periodNumber: number;
    startTime: string;
    endTime: string;
    subject: string;
    teacherName: string;
    roomNumber: string;
  }>({
    dayOfWeek: 'Monday',
    periodNumber: 1,
    startTime: '09:00',
    endTime: '09:45',
    subject: 'Mathematics',
    teacherName: 'Sunita Sharma',
    roomNumber: 'Room 101',
  });

  useEffect(() => {
    fetchAcademicData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      loadTimetable();
    }
  }, [selectedClass, selectedSection]);

  const fetchAcademicData = async () => {
    try {
      const [classRes, secRes] = await Promise.all([
        erpService.getClasses(),
        erpService.getSections(),
      ]);
      if (classRes.data && classRes.data.length > 0) {
        setClasses(classRes.data);
        setSelectedClass(classRes.data[0].name);
      }
      if (secRes.data && secRes.data.length > 0) {
        setSections(secRes.data);
        setSelectedSection(secRes.data[0].name);
      }
    } catch (err: any) {
      console.warn('Academic classes fetch warning:', err);
    }
  };

  const loadTimetable = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await erpService.getTimetable(selectedClass, selectedSection);
      setTimetable(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load timetable for selected class.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictWarning(null);
    setFormSubmitting(true);
    try {
      // Pre-check conflict check via API
      const payload = {
        class: selectedClass,
        section: selectedSection,
        dayOfWeek: formData.dayOfWeek,
        periodNumber: Number(formData.periodNumber),
        startTime: formData.startTime,
        endTime: formData.endTime,
        subject: formData.subject,
        teacherName: formData.teacherName,
        roomNumber: formData.roomNumber,
      };

      const conflictCheck = await erpService.checkTimetableConflict(payload);
      if (conflictCheck.data?.conflict) {
        setConflictWarning(conflictCheck.data.reason || 'Collision detected for this timeslot or teacher.');
        setFormSubmitting(false);
        return;
      }

      await erpService.createTimetableSlot(payload);
      setSuccessMsg('Timetable period successfully scheduled without conflict.');
      setIsAddModalOpen(false);
      loadTimetable();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setConflictWarning(err.response?.data?.message || 'Failed to create slot due to scheduling constraints.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this timetable slot?')) return;
    try {
      await erpService.deleteTimetableSlot(id);
      setSuccessMsg('Period slot removed.');
      loadTimetable();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete slot');
    }
  };

  const getSlot = (day: string, period: number) => {
    return timetable.find((s) => s.dayOfWeek.toLowerCase() === day.toLowerCase() && s.periodNumber === period);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
            <Calendar className="w-4 h-4" />
            <span>Academic Planning & Timetable Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Class Schedules & Periods</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Collision-free timetable generator enforcing teacher and classroom capacity constraints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-medium text-sm transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Schedule</span>
          </button>
          <button
            onClick={() => {
              setConflictWarning(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-md shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Period</span>
          </button>
        </div>
      </div>

      {/* Class & Section Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {classes.length > 0 ? (
                classes.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 8">Class 8</option>
                </>
              )}
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
              {sections.length > 0 ? (
                sections.map((s) => (
                  <option key={s.name} value={s.name}>
                    Section {s.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Active schedule: <strong className="text-slate-800">{timetable.length} periods</strong> configured</span>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Weekly Timetable Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="p-3.5 border-r border-slate-200 text-center w-28">Day / Period</th>
                {PERIODS.map((p) => (
                  <th key={p} className="p-3.5 border-r border-slate-200 text-center min-w-[130px]">
                    Period {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {DAYS_OF_WEEK.map((day) => (
                <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3.5 border-r border-slate-200 font-bold text-slate-800 bg-slate-50/80 text-center">
                    {day}
                  </td>
                  {PERIODS.map((period) => {
                    const slot = getSlot(day, period);
                    return (
                      <td key={period} className="p-2 border-r border-slate-200 align-top">
                        {slot ? (
                          <div className="bg-indigo-50/90 border border-indigo-200/80 rounded-xl p-2.5 shadow-xs relative group transition-all hover:shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-indigo-950 flex items-center gap-1 truncate">
                                <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                {slot.subject}
                              </span>
                              <button
                                onClick={() => handleDeleteSlot(slot._id || '')}
                                className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-all"
                                title="Delete Slot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-1 truncate">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{slot.teacherName}</span>
                            </div>

                            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-indigo-100 text-[10px] text-slate-500 font-mono">
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {slot.startTime}
                              </span>
                              <span className="flex items-center gap-0.5 font-sans font-medium text-indigo-700">
                                <MapPin className="w-2.5 h-2.5" /> {slot.roomNumber || 'Room 1'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-20 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors p-2 text-center">
                            <span className="text-[11px] text-slate-400 font-medium">Free</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Slot Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Schedule Period Slot</h3>
                <p className="text-xs text-slate-500">
                  {selectedClass} - Section {selectedSection}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="p-6 space-y-4">
              {conflictWarning && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Collision Conflict:</strong>
                    <span>{conflictWarning}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value as DayOfWeek })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Period Number</label>
                  <select
                    value={formData.periodNumber}
                    onChange={(e) => setFormData({ ...formData, periodNumber: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    {PERIODS.map((p) => (
                      <option key={p} value={p}>
                        Period {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Mathematics, Science"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher In-Charge</label>
                  <input
                    type="text"
                    value={formData.teacherName}
                    onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                    placeholder="e.g. Sunita Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="e.g. Lab 2, Room 102"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {formSubmitting ? 'Checking Conflict...' : 'Schedule Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

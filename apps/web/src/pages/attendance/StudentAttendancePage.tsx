import React, { useState, useEffect } from 'react';
import { erpService } from '../../services/erpService.js';
import { studentService } from '../../services/studentService.js';
import { IStudent } from '@smart-school/shared-types';
import { CalendarCheck, Users, Check, X, Clock, AlertCircle, MessageSquare, Send } from 'lucide-react';

export const StudentAttendancePage: React.FC = () => {
  const [classes, setClasses] = useState<string[]>(['Grade 10', 'Grade 9', 'Grade 8', 'Grade 7', 'Grade 6']);
  const [selectedClass, setSelectedClass] = useState('Grade 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [students, setStudents] = useState<IStudent[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string; remarks: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bulk WhatsApp Alert State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsAppAlertResult, setWhatsAppAlertResult] = useState<any | null>(null);

  // Load students for selected class & section
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setStatusMessage(null);
      const res = await studentService.getStudents({
        class: selectedClass,
        section: selectedSection,
        status: 'active',
        limit: 100,
      });

      const list = res.items || [];
      setStudents(list);

      // Check if attendance is already recorded for this date
      const existingRes = await erpService.getClassAttendance(selectedClass, selectedSection, selectedDate);
      const existingMap: Record<string, { status: string; remarks: string }> = {};

      if (existingRes.data && existingRes.data.length > 0) {
        for (const item of existingRes.data) {
          existingMap[item.studentId] = {
            status: item.status,
            remarks: item.remarks || '',
          };
        }
      } else {
        // Default everyone to 'present'
        for (const st of list) {
          existingMap[st.id] = { status: 'present', remarks: '' };
        }
      }

      setAttendanceMap(existingMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedSection, selectedDate]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const markAll = (status: string) => {
    const updated: Record<string, { status: string; remarks: string }> = {};
    for (const st of students) {
      updated[st.id] = {
        status,
        remarks: attendanceMap[st.id]?.remarks || '',
      };
    }
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      setStatusMessage(null);

      const records = students.map((st) => ({
        studentId: st.id,
        status: attendanceMap[st.id]?.status || 'present',
        remarks: attendanceMap[st.id]?.remarks || '',
      }));

      await erpService.bulkMarkAttendance({
        class: selectedClass,
        section: selectedSection,
        date: selectedDate,
        records,
      });

      setStatusMessage({
        type: 'success',
        text: `Attendance saved successfully for ${selectedClass}-${selectedSection} (${records.length} students).`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save attendance',
      });
    } finally {
      setSaving(false);
    }
  };

  // Summary counts
  const presentCount = Object.values(attendanceMap).filter((v) => v.status === 'present').length;
  const absentCount = Object.values(attendanceMap).filter((v) => v.status === 'absent').length;
  const lateCount = Object.values(attendanceMap).filter((v) => v.status === 'late').length;
  const leaveCount = Object.values(attendanceMap).filter((v) => v.status === 'approved_leave').length;

  const handleSendBulkWhatsAppAlerts = async () => {
    try {
      setSendingWhatsApp(true);
      const res = await erpService.sendBulkAttendanceWhatsAppAlerts(selectedClass, selectedSection, selectedDate);
      setWhatsAppAlertResult(res.data);
      setStatusMessage({
        type: 'success',
        text: `Successfully dispatched ${res.data?.deliveredCount || 0} personalized WhatsApp attendance alerts to parent mobile phones.`,
      });
      setShowWhatsAppModal(false);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to dispatch WhatsApp alerts',
      });
    } finally {
      setSendingWhatsApp(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-indigo-600" />
            Daily Student Attendance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mark daily roll call, review absent defaulters, and notify parents.
          </p>
        </div>

        {/* Quick Save & WhatsApp Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWhatsAppModal(true)}
            disabled={absentCount + lateCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-sm transition"
            title="Dispatch instant WhatsApp alerts to parents of absent/late students"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Bulk WhatsApp Alerts ({absentCount + lateCount})</span>
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-sm transition"
          >
            <Check className="w-4 h-4" />
            {saving ? 'Saving...' : 'Submit Attendance'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {statusMessage.text}
        </div>
      )}

      {/* Control Panel: Filters & Bulk Toggles */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Attendance Summary Badges & Quick Bulk Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Present: {presentCount}
            </span>
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Absent: {absentCount}
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Late: {lateCount}
            </span>
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Leave: {leaveCount}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => markAll('present')}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
            >
              Mark All Present
            </button>
            <button
              onClick={() => markAll('absent')}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 transition"
            >
              Mark All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading student roster...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No active students found in {selectedClass}-{selectedSection}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Roll & Name</th>
                  <th className="px-6 py-3">Admission No</th>
                  <th className="px-6 py-3 text-center">Attendance Status</th>
                  <th className="px-6 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const currentStatus = attendanceMap[st.id]?.status || 'present';
                  return (
                    <tr key={st.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{st.fullName || `${st.firstName} ${st.lastName}`}</div>
                        <div className="text-xs text-slate-400">Roll No: {st.rollNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-medium">
                        {st.admissionNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.id, 'present')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <Check className="w-3 h-3" /> P
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.id, 'absent')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            <X className="w-3 h-3" /> A
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.id, 'late')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              currentStatus === 'late'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            <Clock className="w-3 h-3" /> L
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.id, 'approved_leave')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              currentStatus === 'approved_leave'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                            }`}
                          >
                            Leave
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          placeholder="Optional note..."
                          value={attendanceMap[st.id]?.remarks || ''}
                          onChange={(e) =>
                            setAttendanceMap((prev) => ({
                              ...prev,
                              [st.id]: {
                                ...prev[st.id],
                                remarks: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BULK WHATSAPP PREVIEW & CONFIRMATION MODAL */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Broadcast WhatsApp Attendance Alerts</h3>
                <p className="text-xs text-slate-500">
                  Target: {selectedClass} - Section {selectedSection} ({new Date(selectedDate).toLocaleDateString()})
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Identified Defaulters:</span>
                <span className="font-bold text-rose-600">{absentCount} Absent, {lateCount} Late</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Target Channel:</span>
                <span className="font-semibold text-emerald-700">Official WhatsApp Gateway</span>
              </div>
            </div>

            {/* Template Preview */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Personalized Message Preview</label>
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/70 text-xs text-slate-800 font-mono space-y-2">
                <div className="font-bold text-emerald-900">🔔 Smart School ERP — Attendance Alert</div>
                <p>
                  Dear Parent/Guardian,<br /><br />
                  Your ward <strong>[Student Name]</strong> (Class: {selectedClass}-{selectedSection}) has been marked <strong>ABSENT / LATE</strong> today ({new Date(selectedDate).toLocaleDateString()}).<br /><br />
                  If this was unexpected, please contact the class teacher or school administration promptly.
                </p>
                <div className="text-[10px] text-slate-400 text-right">— Springfield Academy</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendBulkWhatsAppAlerts}
                disabled={sendingWhatsApp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Send className="w-4 h-4" />
                {sendingWhatsApp ? 'Dispatching...' : `Send to ${absentCount + lateCount} Parents`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

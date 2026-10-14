import React, { useState, useEffect } from 'react';
import { erpService } from '../../services/erpService.js';
import { IAdmissionEnquiry } from '@smart-school/shared-types';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  ArrowRight,
  Filter,
  GraduationCap,
  Sparkles,
  Award,
  ChevronRight,
  Plus,
} from 'lucide-react';

const STAGES = [
  { id: 'INQUIRY', label: 'New Inquiries', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'COUNSELING', label: 'Counseling', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'CAMPUS_VISIT', label: 'Campus Visit', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'APPLICATION_SUBMITTED', label: 'Applied', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'APPROVED', label: 'Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'ENROLLED', label: 'Enrolled (SIS)', color: 'bg-teal-50 text-teal-700 border-teal-200' },
];

export const AdmissionsCrmPage: React.FC = () => {
  const [enquiries, setEnquiries] = useState<IAdmissionEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter state
  const [activeStageFilter, setActiveStageFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<IAdmissionEnquiry | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    studentName: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    targetClass: 'Class 10',
    leadSource: 'Walk-in',
    notes: '',
  });

  const [convertForm, setConvertForm] = useState({
    section: 'A',
    gender: 'male' as 'male' | 'female' | 'other',
    dateOfBirth: '2010-05-15',
  });

  useEffect(() => {
    loadEnquiries();
  }, [activeStageFilter, classFilter]);

  const loadEnquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const stageParam = activeStageFilter === 'ALL' ? undefined : activeStageFilter;
      const res = await erpService.getEnquiries(stageParam, classFilter || undefined);
      setEnquiries(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load admission inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await erpService.createEnquiry(formData);
      setSuccessMsg('New admission lead recorded in CRM pipeline.');
      setIsAddModalOpen(false);
      setFormData({
        studentName: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        targetClass: 'Class 10',
        leadSource: 'Walk-in',
        notes: '',
      });
      loadEnquiries();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record inquiry');
    }
  };

  const handleStageChange = async (enquiryId: string, newStage: string) => {
    try {
      await erpService.updateEnquiryStage(enquiryId, newStage, `Moved stage to ${newStage}`);
      setSuccessMsg(`Lead stage updated to ${newStage}`);
      loadEnquiries();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update stage');
    }
  };

  const handleConvertStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    try {
      const res = await erpService.convertEnquiryToStudent(
        selectedEnquiry._id || '',
        convertForm.section,
        convertForm.gender,
        convertForm.dateOfBirth
      );
      setSuccessMsg(`Student officially admitted! SIS Admission No: ${res.data?.admissionNumber || 'Assigned'}`);
      setIsConvertModalOpen(false);
      setSelectedEnquiry(null);
      loadEnquiries();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to convert lead into enrolled student');
    }
  };

  // Funnel counts
  const totalCount = enquiries.length;
  const enrolledCount = enquiries.filter((e) => e.stage === 'ENROLLED').length;
  const inPipelineCount = enquiries.filter((e) => e.stage !== 'ENROLLED' && e.stage !== 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
            <Users className="w-4 h-4" />
            <span>Admissions & Enrollment CRM</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Admission Leads & Conversion</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage student inquiries from initial contact to verified enrollment in the Student Information System.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-md shadow-indigo-100"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Lead</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Total Leads</div>
            <div className="text-xl font-bold text-slate-900">{totalCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">In Pipeline</div>
            <div className="text-xl font-bold text-slate-900">{inPipelineCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Successfully Enrolled</div>
            <div className="text-xl font-bold text-slate-900">{enrolledCount}</div>
          </div>
        </div>
      </div>

      {/* Stage Filters / Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => setActiveStageFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeStageFilter === 'ALL'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Stages ({enquiries.length})
        </button>
        {STAGES.map((s) => {
          const count = enquiries.filter((e) => e.stage === s.id).length;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStageFilter(s.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeStageFilter === s.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{s.label}</span>
              <span className="opacity-75 text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Enquiries List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Clock className="w-8 h-8 mx-auto animate-spin text-indigo-500 mb-2" />
          <span>Loading admission pipeline...</span>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Inquiries Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            No admission inquiries found for the selected stage filter.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
          >
            Create Admission Lead
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {enquiries.map((enq) => {
            const currentStageObj = STAGES.find((s) => s.id === enq.stage) || STAGES[0];
            return (
              <div
                key={enq._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {enq.targetClass}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${currentStageObj.color}`}
                    >
                      {currentStageObj.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{enq.studentName}</h3>
                  <div className="text-xs text-slate-600 mt-1 font-medium">
                    Guardian: {enq.parentName}
                  </div>

                  <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{enq.parentPhone}</span>
                    </div>
                    {enq.parentEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{enq.parentEmail}</span>
                      </div>
                    )}
                    {enq.notes && (
                      <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100">
                        "{enq.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Move Stage:</span>
                    <select
                      value={enq.stage}
                      onChange={(e) => handleStageChange(enq._id || '', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded text-xs font-semibold px-2 py-1 focus:ring-1 focus:ring-indigo-500"
                    >
                      {STAGES.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {enq.stage !== 'ENROLLED' ? (
                    <button
                      onClick={() => {
                        setSelectedEnquiry(enq);
                        setIsConvertModalOpen(true);
                      }}
                      className="w-full mt-2 py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-teal-200"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>Convert & Enroll as Student</span>
                    </button>
                  ) : (
                    <div className="w-full mt-2 py-1.5 text-center bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Enrolled in SIS ({enq.convertedStudentId ? 'Active' : 'Completed'})</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Inquiry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Record New Admission Lead</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEnquiry} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Applicant Student Name
                </label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="e.g. Diya Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent / Guardian Name
                </label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    placeholder="parent@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Class
                  </label>
                  <select
                    value={formData.targetClass}
                    onChange={(e) => setFormData({ ...formData, targetClass: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Class 10">Class 10</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 6">Class 6</option>
                    <option value="Class 1">Class 1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lead Source
                  </label>
                  <select
                    value={formData.leadSource}
                    onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Walk-in">Walk-in Inquiry</option>
                    <option value="Website">School Website</option>
                    <option value="Referral">Parent Referral</option>
                    <option value="Advertisement">Social Media / Ad</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Counseling Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Record discussions, previous schooling, and specific requests..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
                >
                  Record Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Active Student Modal */}
      {isConvertModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-teal-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-teal-950">Official Student Enrollment</h3>
                <p className="text-xs text-teal-700">Admitting {selectedEnquiry.studentName}</p>
              </div>
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConvertStudent} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div><strong>Class:</strong> {selectedEnquiry.targetClass}</div>
                <div><strong>Parent:</strong> {selectedEnquiry.parentName} ({selectedEnquiry.parentPhone})</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Section
                  </label>
                  <select
                    value={convertForm.section}
                    onChange={(e) => setConvertForm({ ...convertForm, section: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={convertForm.gender}
                    onChange={(e) => setConvertForm({ ...convertForm, gender: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={convertForm.dateOfBirth}
                  onChange={(e) => setConvertForm({ ...convertForm, dateOfBirth: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-sm"
                >
                  Complete Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

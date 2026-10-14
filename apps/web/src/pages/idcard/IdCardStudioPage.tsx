import React, { useState, useEffect } from 'react';
import { erpService } from '../../services/erpService.js';
import { studentService } from '../../services/studentService.js';
import { printService } from '../../services/printService.js';
import { IStudent, IEmployee, IdCardTemplate } from '@smart-school/shared-types';
import {
  CreditCard,
  Printer,
  Zap,
  Users,
  Briefcase,
  QrCode,
  ShieldCheck,
  Check,
  Palette,
  Eye,
  Sparkles,
} from 'lucide-react';

export const IdCardStudioPage: React.FC = () => {
  const [cardType, setCardType] = useState<'student' | 'staff'>('student');
  const [template, setTemplate] = useState<IdCardTemplate>('modern');
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [showBloodGroup, setShowBloodGroup] = useState(true);
  const [showEmergencyContact, setShowEmergencyContact] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showPrincipalSign, setShowPrincipalSign] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');

  // Filter & Data States
  const [classes] = useState(['Grade 10', 'Grade 9', 'Grade 8', 'Grade 7', 'Grade 6']);
  const [selectedClass, setSelectedClass] = useState('Grade 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [students, setStudents] = useState<IStudent[]>([]);
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cardType === 'student') {
      loadStudents();
    } else {
      loadEmployees();
    }
  }, [cardType, selectedClass, selectedSection]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await studentService.getStudents({
        class: selectedClass,
        section: selectedSection,
        status: 'active',
        limit: 50,
      });
      const list = res.items || [];
      setStudents(list);
      setSelectedIds(list.map((s) => s.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res = await erpService.getEmployees();
      const list = res.data || [];
      setEmployees(list);
      setSelectedIds(list.map((e) => e.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(cardType === 'student' ? students.map((s) => s.id) : employees.map((e) => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrint = (silent: boolean) => {
    printService.printReceiptOrCard({ silent, title: `ID_Cards_${cardType}_${Date.now()}` });
  };

  const activeStudent = students.find((s) => s.id === selectedIds[0]) || students[0];
  const activeEmployee = employees.find((e) => e.id === selectedIds[0]) || employees[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            ID Card Studio & Badge Press
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Design, preview, and batch-print official CR80/PVC student and staff identification cards.
          </p>
        </div>

        {/* Print Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handlePrint(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
            title="Silent print directly to connected PVC/Card printer"
          >
            <Zap className="w-4 h-4" /> Silent Print (PVC)
          </button>
          <button
            onClick={() => handlePrint(false)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
          >
            <Printer className="w-4 h-4" /> Batch Print Cards ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control & Configuration Panel */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card Category Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              1. Select Card Category & Class
            </h2>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCardType('student')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                  cardType === 'student'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" /> Student Badges
              </button>
              <button
                type="button"
                onClick={() => setCardType('staff')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                  cardType === 'staff'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-4 h-4" /> Staff / Faculty Badges
              </button>
            </div>

            {cardType === 'student' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c} value={c}>{c}</option>
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
              </div>
            )}
          </div>

          {/* Design & Template Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-600" />
              2. Design Template & Security Features
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Template Style</label>
              <div className="grid grid-cols-2 gap-2">
                {(['modern', 'classic', 'minimal', 'executive'] as IdCardTemplate[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTemplate(t)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase border transition text-left ${
                      template === t
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Orientation</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('vertical')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    orientation === 'vertical'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Vertical (54 × 86 mm)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('horizontal')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    orientation === 'horizontal'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Horizontal (86 × 54 mm)
                </button>
              </div>
            </div>

            {/* Field Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Badging Elements</label>
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBloodGroup}
                  onChange={(e) => setShowBloodGroup(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Include Medical / Blood Group Pill
              </label>
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showEmergencyContact}
                  onChange={(e) => setShowEmergencyContact(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Include Emergency / Guardian Contact
              </label>
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBarcode}
                  onChange={(e) => setShowBarcode(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Include High-Density Verification QR/Barcode
              </label>
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrincipalSign}
                  onChange={(e) => setShowPrincipalSign(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Principal Authorized Signatory Stamp
              </label>
            </div>
          </div>

          {/* Recipient Multi-Select List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase">
                Recipients to Print ({selectedIds.length})
              </span>
              <button
                type="button"
                onClick={() => handleSelectAll(selectedIds.length === 0)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                {selectedIds.length === 0 ? 'Select All' : 'Deselect All'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-100 text-xs">
              {(cardType === 'student' ? students : employees).map((item: any) => (
                <label
                  key={item.id}
                  className="flex items-center justify-between pt-1.5 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => handleToggleId(item.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-800">
                      {item.fullName || `${item.firstName} ${item.lastName}`}
                    </span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {item.admissionNumber || item.employeeId}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Live Interactive Preview */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-900 rounded-3xl p-8 border border-slate-800 relative overflow-hidden">
          {/* Subtle glow background */}
          <div className="absolute w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between w-full max-w-sm mb-6 z-10">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-400" /> Live Card Proof
            </div>
            <div className="flex bg-slate-800 rounded-xl p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setPreviewSide('front')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  previewSide === 'front' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Front Side
              </button>
              <button
                type="button"
                onClick={() => setPreviewSide('back')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  previewSide === 'back' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Back Side
              </button>
            </div>
          </div>

          {/* PHYSICAL ID CARD CONTAINER (CR80 standard) */}
          <div
            id="printable-id-card"
            className={`shadow-2xl rounded-2xl overflow-hidden border border-slate-700/80 bg-white text-slate-900 transition-all z-10 ${
              orientation === 'vertical' ? 'w-64 h-96' : 'w-96 h-60'
            }`}
          >
            {previewSide === 'front' ? (
              /* CARD FRONT */
              <div className="h-full flex flex-col justify-between relative bg-gradient-to-b from-indigo-700 via-indigo-600 to-indigo-900 text-white p-4">
                {/* Header */}
                <div className="text-center pb-2 border-b border-indigo-400/40">
                  <div className="text-xs font-black tracking-wider uppercase">Springfield Academy</div>
                  <div className="text-[9px] text-indigo-200">Affiliated to CBSE • Institutional ID</div>
                </div>

                {/* Photo & Name */}
                <div className="flex flex-col items-center my-auto">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/80 overflow-hidden shadow-md flex items-center justify-center font-bold text-2xl text-white">
                    {cardType === 'student'
                      ? activeStudent?.fullName?.charAt(0) || 'S'
                      : activeEmployee?.firstName?.charAt(0) || 'T'}
                  </div>

                  <div className="mt-2 text-center">
                    <div className="font-bold text-sm tracking-tight">
                      {cardType === 'student'
                        ? activeStudent?.fullName || 'John Doe'
                        : `${activeEmployee?.firstName || 'Eleanor'} ${activeEmployee?.lastName || 'Vance'}`}
                    </div>
                    <div className="text-[10px] text-indigo-200 font-mono">
                      {cardType === 'student'
                        ? `Adm: ${activeStudent?.admissionNumber || 'ADM-2026-0001'}`
                        : `Emp ID: ${activeEmployee?.employeeId || 'EMP-001'}`}
                    </div>
                    {cardType === 'student' ? (
                      <div className="text-[11px] font-semibold text-amber-300 mt-0.5">
                        {activeStudent?.class || 'Grade 10'} - {activeStudent?.section || 'A'}
                      </div>
                    ) : (
                      <div className="text-[11px] font-semibold text-amber-300 mt-0.5">
                        {activeEmployee?.designation || 'Senior Faculty'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Badges / Metadata */}
                <div className="flex items-center justify-between text-[10px] bg-indigo-950/40 rounded-xl p-2 border border-indigo-400/20">
                  {showBloodGroup && (
                    <div>
                      <span className="text-indigo-300 block text-[9px]">Blood</span>
                      <span className="font-bold text-rose-300">
                        {cardType === 'student' ? activeStudent?.bloodGroup || 'O+' : 'A+'}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-indigo-300 block text-[9px]">Session</span>
                    <span className="font-bold text-white">2026-27</span>
                  </div>
                  <div>
                    <span className="text-indigo-300 block text-[9px]">Valid Thru</span>
                    <span className="font-bold text-emerald-300">Mar 2027</span>
                  </div>
                </div>
              </div>
            ) : (
              /* CARD BACK */
              <div className="h-full flex flex-col justify-between bg-slate-50 text-slate-800 p-4 text-[10px] space-y-2">
                <div className="text-center font-bold text-xs text-indigo-900 border-b border-slate-200 pb-1">
                  Institutional Instructions
                </div>

                <div className="space-y-1 text-slate-600 text-[9px]">
                  <p>1. This card must be carried at all times on campus.</p>
                  <p>2. If lost, report immediately to administrative office.</p>
                  {showEmergencyContact && (
                    <div className="pt-1 font-semibold text-slate-800">
                      Emergency Contact: +91 98765-43210
                    </div>
                  )}
                </div>

                {showBarcode && (
                  <div className="text-center pt-2">
                    <div className="h-8 bg-slate-200 border border-slate-300 rounded flex items-center justify-center font-mono text-[9px] tracking-widest text-slate-600">
                      ||| | | |||| || | || |||| |
                    </div>
                    <div className="font-mono text-[8px] text-slate-400 mt-0.5">
                      {cardType === 'student' ? activeStudent?.admissionNumber : activeEmployee?.employeeId}
                    </div>
                  </div>
                )}

                {showPrincipalSign && (
                  <div className="flex justify-between items-end pt-2 border-t border-slate-200">
                    <div className="text-[8px] text-slate-400">Card Issued by ERP</div>
                    <div className="text-center border-t border-slate-400 pt-0.5 w-24 text-[8px] font-bold text-slate-700">
                      Principal Signature
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 mt-4 text-center z-10">
            Standard ISO/IEC 7810 CR80 Card Size (3.370 × 2.125 inches) • Thermal PVC Compatible
          </div>
        </div>
      </div>
    </div>
  );
};

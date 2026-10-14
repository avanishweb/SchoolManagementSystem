import React, { useState, useEffect } from 'react';
import { erpService } from '../../services/erpService.js';
import { STANDARD_CLASSES, STANDARD_SECTIONS } from '@smart-school/shared-utils';
import {
  MessageSquare,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sparkles,
  FileText,
  Clock,
  Calendar,
  Share2,
  ShieldCheck,
  Building,
} from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    id: 'general',
    name: 'General School Circular',
    title: 'Important Circular from Springfield Academy',
    message: 'Dear Parents, please be informed that the school will be holding its Annual Science Exhibition this Friday. All students are requested to be in formal uniform with their project kits. Thank you!',
  },
  {
    id: 'holiday',
    name: 'Urgent Holiday / Weather Notice',
    title: 'School Closure Notice',
    message: 'Dear Parents, as per official government advisory, Springfield Academy will remain closed tomorrow due to heavy rain forecast. Online study material will be updated in the Daily Diary. Stay safe!',
  },
  {
    id: 'fee_reminder',
    name: 'Term Fee Due Reminder',
    title: 'Fee Payment Reminder',
    message: 'Dear Parent, this is a gentle reminder that the academic fee installment for the current term is due on or before the 15th. Kindly ignore if already paid. For online receipt, check the ERP portal.',
  },
  {
    id: 'ptm',
    name: 'Parent-Teacher Meeting (PTM)',
    title: 'PTM Schedule Announcement',
    message: 'Dear Parents, Parent-Teacher Meeting (PTM) for Term 1 academic assessment is scheduled for this Saturday from 9:00 AM to 1:00 PM. We request your presence to discuss your ward\'s academic progress.',
  },
  {
    id: 'exam',
    name: 'Examination Timetable Notice',
    title: 'Mid-Term Examination Date Sheet',
    message: 'Dear Parents, Mid-Term Examination starts next Monday. Please review the detailed date-sheet and syllabus attached on the school portal. Best wishes to all students!',
  },
];

export const WhatsAppBroadcastPage: React.FC = () => {
  const [targetAudience, setTargetAudience] = useState<'all' | 'class' | 'defaulters'>('all');
  const [selectedClass, setSelectedClass] = useState('Grade 10');
  const [selectedSection, setSelectedSection] = useState('A');

  const [title, setTitle] = useState(PRESET_TEMPLATES[0].title);
  const [message, setMessage] = useState(PRESET_TEMPLATES[0].message);

  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadBroadcastHistory();
  }, []);

  const loadBroadcastHistory = async () => {
    try {
      const res = await erpService.getNotifications();
      setBroadcasts(res.data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleApplyTemplate = (tmplId: string) => {
    const tmpl = PRESET_TEMPLATES.find((t) => t.id === tmplId);
    if (tmpl) {
      setTitle(tmpl.title);
      setMessage(tmpl.message);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Message body cannot be empty.');
      return;
    }

    setSending(true);
    setError(null);
    try {
      const payload = {
        title,
        message,
        targetAudience,
        targetClass: targetAudience === 'class' ? selectedClass : undefined,
        targetSection: targetAudience === 'class' ? selectedSection : undefined,
        channels: ['whatsapp', 'in_app'],
      };

      const res = await erpService.broadcastNoticeToParents(payload);
      setSuccessMsg(`WhatsApp Notice successfully broadcasted to ${res.data?.recipientsCount || 0} parent mobile numbers!`);
      loadBroadcastHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to dispatch broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleOpenWhatsAppWeb = () => {
    const fullText = `*📢 ${title.toUpperCase()}*\n\n${message}\n\n_— Springfield Academy ERP_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold mb-1">
            <MessageSquare className="w-5 h-5" />
            <span>Parent Communication Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">WhatsApp Notice Broadcast</h1>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch official school circulars, urgent announcements, and fee notices directly to parent WhatsApp numbers in bulk.
          </p>
        </div>

        <button
          onClick={handleOpenWhatsAppWeb}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Open WhatsApp Web Direct</span>
        </button>
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

      {/* Main Grid: Form + Live Phone Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Composer Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Compose WhatsApp Notice</span>
          </h2>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            {/* Quick Template Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                Fast Template Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl.id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  targetAudience === 'all'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="audience"
                  value="all"
                  checked={targetAudience === 'all'}
                  onChange={() => setTargetAudience('all')}
                  className="text-emerald-600"
                />
                <span>All Parents</span>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  targetAudience === 'class'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="audience"
                  value="class"
                  checked={targetAudience === 'class'}
                  onChange={() => setTargetAudience('class')}
                  className="text-emerald-600"
                />
                <span>Class / Section</span>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  targetAudience === 'defaulters'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="audience"
                  value="defaulters"
                  checked={targetAudience === 'defaulters'}
                  onChange={() => setTargetAudience('defaulters')}
                  className="text-emerald-600"
                />
                <span>Fee Defaulters</span>
              </label>
            </div>

            {/* Class & Section selectors when target is class */}
            {targetAudience === 'class' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    {STANDARD_CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Section</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    {STANDARD_SECTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Notice Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Notice Title / Subject
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Sports Meet 2026 Announcement"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Notice Message Body */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                WhatsApp Message Content
              </label>
              <textarea
                rows={6}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                * Markdown asterisks *bold* and _italics_ are supported on WhatsApp.
              </p>
            </div>

            {/* Dispatch Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={sending}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Broadcasting via WhatsApp Gateway...' : 'Send WhatsApp Broadcast Now'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Phone Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-start">
          <div className="w-full max-w-[340px] bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800">
            {/* Phone Speaker & Camera Notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2" />

            {/* WhatsApp App Screen */}
            <div className="bg-[#efeae2] rounded-[24px] overflow-hidden flex flex-col h-[480px]">
              {/* WhatsApp App Bar */}
              <div className="bg-[#075e54] text-white p-3 flex items-center gap-2 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs">
                  SA
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">Springfield Academy</div>
                  <div className="text-[10px] text-emerald-200">Official ERP Broadcast</div>
                </div>
              </div>

              {/* Chat Message Bubble Canvas */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2">
                <div className="bg-[#dcf8c6] text-slate-900 p-3 rounded-xl rounded-tr-none shadow-sm text-xs space-y-2 max-w-[90%] ml-auto border border-emerald-100">
                  <div className="font-bold text-emerald-950 border-b border-emerald-200/60 pb-1">
                    📢 {title || 'Notice Title'}
                  </div>
                  <p className="text-[11px] leading-relaxed whitespace-pre-wrap">
                    {message || 'Type message in composer to see live preview...'}
                  </p>
                  <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-800 pt-1">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>✓✓</span>
                  </div>
                </div>
              </div>

              {/* Footer WhatsApp input bar dummy */}
              <div className="bg-white p-2 border-t border-slate-200 flex items-center text-xs text-slate-400">
                <span className="truncate">Replies disabled for broadcast channel</span>
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium mt-3">Live Parent Mobile WhatsApp Preview</span>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Broadcast Audit & Delivery Log</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Archive of all dispatched announcements with delivery statistics.
            </p>
          </div>
          <button
            onClick={loadBroadcastHistory}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
          >
            Refresh Logs
          </button>
        </div>

        {broadcasts.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">No previous WhatsApp broadcasts recorded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Channels</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {broadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 text-xs">
                      {b.title}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700 capitalize">
                      {b.targetAudience} {b.targetClass ? `(${b.targetClass})` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        WhatsApp + SMS
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

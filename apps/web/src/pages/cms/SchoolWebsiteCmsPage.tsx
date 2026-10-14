import React, { useState, useEffect } from 'react';
import { erpService } from '../../services/erpService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ICmsPage, ICmsNotice } from '@smart-school/shared-types';
import {
  Globe,
  FileText,
  Bell,
  Eye,
  Plus,
  Edit,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Building,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

export const SchoolWebsiteCmsPage: React.FC = () => {
  const { school } = useAuth();
  const [activeTab, setActiveTab] = useState<'pages' | 'notices' | 'preview'>('pages');

  const [pages, setPages] = useState<ICmsPage[]>([]);
  const [notices, setNotices] = useState<ICmsNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Page Modal & Form
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageForm, setPageForm] = useState({
    title: '',
    slug: '',
    content: '',
    isPublished: true,
    metaTitle: '',
    metaDescription: '',
  });

  // Notice Modal & Form
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    priority: 'MEDIUM',
    category: 'ACADEMIC',
    isActive: true,
  });

  // Preview data
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    loadCmsData();
  }, []);

  const loadCmsData = async () => {
    setLoading(true);
    try {
      const [pRes, nRes] = await Promise.all([
        erpService.getCmsPages(),
        erpService.getCmsNotices(),
      ]);
      setPages(pRes.data || []);
      setNotices(nRes.data || []);

      if (school?.slug) {
        try {
          const pubRes = await erpService.getPublicSite(school.slug);
          setPreviewData(pubRes.data);
        } catch {
          // fallback preview data
        }
      }
    } catch (err: any) {
      console.warn('CMS data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPageId) {
        await erpService.updateCmsPage(editingPageId, pageForm);
        setSuccessMsg('Web page updated successfully.');
      } else {
        await erpService.createCmsPage(pageForm);
        setSuccessMsg('New custom web page published to school portal.');
      }
      setIsPageModalOpen(false);
      setEditingPageId(null);
      loadCmsData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save page');
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await erpService.createCmsNotice(noticeForm);
      setSuccessMsg('Notice posted on school public board.');
      setIsNoticeModalOpen(false);
      setNoticeForm({
        title: '',
        content: '',
        priority: 'MEDIUM',
        category: 'ACADEMIC',
        isActive: true,
      });
      loadCmsData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to post notice');
    }
  };

  const handleOpenEditPage = (page: ICmsPage) => {
    setEditingPageId(page._id || null);
    setPageForm({
      title: page.title,
      slug: page.slug,
      content: page.content,
      isPublished: page.isPublished,
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
    });
    setIsPageModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
            <Globe className="w-4 h-4" />
            <span>White-Label School Website & CMS</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">School Website Builder</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your school's public website, custom pages, notices, and branded subdomain.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'pages' ? (
            <button
              onClick={() => {
                setEditingPageId(null);
                setPageForm({
                  title: '',
                  slug: '',
                  content: '',
                  isPublished: true,
                  metaTitle: '',
                  metaDescription: '',
                });
                setIsPageModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-md shadow-indigo-100"
            >
              <Plus className="w-4 h-4" />
              <span>Create Web Page</span>
            </button>
          ) : activeTab === 'notices' ? (
            <button
              onClick={() => setIsNoticeModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-md shadow-indigo-100"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Notice</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pages')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'pages'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Website Pages ({pages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'notices'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notice Board ({notices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'preview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Live Site Preview</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: WEBSITE PAGES */}
      {activeTab === 'pages' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="p-4">Page Title</th>
                <th className="p-4">URL Route</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {pages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    No CMS pages configured yet.
                  </td>
                </tr>
              ) : (
                pages.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{p.title}</td>
                    <td className="p-4 font-mono text-xs text-indigo-600">/{p.slug}</td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          p.isPublished
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenEditPage(p)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                      >
                        Edit Page
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: NOTICE BOARD */}
      {activeTab === 'notices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notices.map((n) => (
            <div
              key={n._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {n.category}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      n.priority === 'HIGH'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {n.priority}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{n.title}</h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3">{n.content}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Posted: {new Date(n.publishedAt || Date.now()).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: LIVE PUBLIC WEBSITE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl">
          <div className="bg-slate-900 text-slate-300 px-4 py-2 rounded-t-xl text-xs flex items-center justify-between font-mono">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              https://{school?.slug || 'school'}.tenora365.com
            </span>
            <span className="text-slate-500">Public Live Preview</span>
          </div>

          <div className="bg-white rounded-b-xl overflow-hidden min-h-[500px] text-slate-800">
            {/* Top School Bar */}
            <header className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-700 flex items-center justify-center font-bold text-white text-lg">
                  {school?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{school?.name || 'Sunrise International School'}</h2>
                  <p className="text-xs text-indigo-200">Affiliated to CBSE, New Delhi</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
                <span className="hover:text-indigo-200 cursor-pointer">Home</span>
                <span className="hover:text-indigo-200 cursor-pointer">About</span>
                <span className="hover:text-indigo-200 cursor-pointer">Academics</span>
                <span className="hover:text-indigo-200 cursor-pointer">Admissions</span>
                <span className="hover:text-indigo-200 cursor-pointer">Contact</span>
              </div>
            </header>

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white px-8 py-14 text-center">
              <h1 className="text-3xl font-extrabold max-w-2xl mx-auto">
                Inspiring Academic Excellence & Holistic Growth
              </h1>
              <p className="text-indigo-200 text-sm mt-3 max-w-xl mx-auto">
                Welcome to our vibrant learning community where students develop character, intellect, and leadership.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs">
                  Apply for Admission
                </button>
                <button className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs">
                  Virtual Campus Tour
                </button>
              </div>
            </div>

            {/* Notices ticker */}
            {notices.length > 0 && (
              <div className="bg-amber-50 border-y border-amber-200 px-6 py-2.5 flex items-center gap-3 text-xs text-amber-900">
                <span className="font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px]">
                  LATEST NOTICE
                </span>
                <span className="truncate">{notices[0].title} — {notices[0].content}</span>
              </div>
            )}

            {/* Highlights Grid */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                <h4 className="font-bold text-slate-900">Smart Classrooms</h4>
                <p className="text-xs text-slate-600 mt-2">
                  Interactive boards, air-conditioned lecture halls, and audiovisual labs for immersive learning.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                <h4 className="font-bold text-slate-900">STEM & Robotics Labs</h4>
                <p className="text-xs text-slate-600 mt-2">
                  Hands-on science experiments, mathematics labs, and cutting-edge computer facilities.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                <h4 className="font-bold text-slate-900">Sports & Athletics</h4>
                <p className="text-xs text-slate-600 mt-2">
                  Olympic-grade running track, basketball courts, and football grounds with trained coaches.
                </p>
              </div>
            </div>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 p-6 text-center text-xs border-t border-slate-800">
              <p>© {new Date().getFullYear()} {school?.name || 'School ERP'}. Powered by TENORA365 Commercial Platform.</p>
            </footer>
          </div>
        </div>
      )}

      {/* Create/Edit Page Modal */}
      {isPageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">
                {editingPageId ? 'Edit Web Page' : 'Create Web Page'}
              </h3>
              <button
                onClick={() => setIsPageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePage} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Page Title</label>
                  <input
                    type="text"
                    value={pageForm.title}
                    onChange={(e) =>
                      setPageForm({
                        ...pageForm,
                        title: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      })
                    }
                    placeholder="e.g. Science Laboratory"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={pageForm.slug}
                    onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Page Content</label>
                <textarea
                  rows={5}
                  value={pageForm.content}
                  onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                  placeholder="Enter HTML or markdown page description..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Meta Title (SEO)</label>
                  <input
                    type="text"
                    value={pageForm.metaTitle}
                    onChange={(e) => setPageForm({ ...pageForm, metaTitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Publish Status</label>
                  <select
                    value={pageForm.isPublished ? 'true' : 'false'}
                    onChange={(e) => setPageForm({ ...pageForm, isPublished: e.target.value === 'true' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="true">Published (Live)</option>
                    <option value="false">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPageModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
                >
                  Save Web Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Notice Modal */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Publish Notice on Public Board</h3>
              <button
                onClick={() => setIsNoticeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  placeholder="e.g. Annual Sports Day 2026 Schedule"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={noticeForm.category}
                    onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACADEMIC">Academic</option>
                    <option value="SPORTS">Sports & Activities</option>
                    <option value="HOLIDAY">Holidays & Closures</option>
                    <option value="EXAM">Examinations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={noticeForm.priority}
                    onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High / Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Circular Content</label>
                <textarea
                  rows={4}
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  placeholder="Provide circular text and guidelines for students and parents..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNoticeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

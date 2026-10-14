import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Building,
  Shield,
  Laptop,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, school } = useAuth();

  const metrics = [
    {
      title: 'Enrolled Students',
      value: '1,248',
      change: '+4.2% from last term',
      icon: Users,
      color: 'bg-indigo-500',
    },
    {
      title: 'Active Faculty & Staff',
      value: '84',
      change: '100% attendance rate',
      icon: GraduationCap,
      color: 'bg-emerald-500',
    },
    {
      title: 'Class Sections',
      value: '42',
      change: 'Across Grades 1-12',
      icon: BookOpen,
      color: 'bg-sky-500',
    },
    {
      title: 'Daily Attendance',
      value: '96.8%',
      change: 'Target: >95.0%',
      icon: CalendarCheck,
      color: 'bg-amber-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Session Active
            </span>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Updated just now
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Administrator'}!
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Overview and administrative operations for{' '}
            <strong className="text-slate-700 font-semibold">{school?.name || 'Academic Platform'}</strong>.
          </p>
        </div>

        {/* Tenant Details Pill */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant Scope</div>
            <div className="text-sm font-bold text-slate-800">{school?.name || 'Platform Wide'}</div>
            <div className="text-xs text-indigo-600 font-mono">slug: {school?.slug || 'global'}</div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.title}
              className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {metric.title}
                </span>
                <div className={`w-8 h-8 rounded-lg ${metric.color} text-white flex items-center justify-center shadow-sm`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{metric.value}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">{metric.change}</div>
            </div>
          );
        })}
      </div>

      {/* Architectural Foundation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Foundation Status */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">System Foundation Architecture</h2>
              <p className="text-xs text-slate-500">Implemented core enterprise features & verification status</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Phase 1 Initial Foundation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200/60 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 font-semibold text-sm text-slate-800 mb-1.5">
                <Shield className="w-4 h-4 text-indigo-600" />
                Multi-Tenant Isolation
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tenant boundary resolved exclusively on the server from authenticated cryptographic JWT tokens. Client-supplied tenant IDs are strictly verified against assigned school permissions.
              </p>
            </div>

            <div className="border border-slate-200/60 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 font-semibold text-sm text-slate-800 mb-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                Role-Based Authorization (RBAC)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hierarchical role enforcement for super_admin, school_admin, teacher, and staff. Passwords secured with bcrypt; sensitive hashes excluded by default.
              </p>
            </div>

            <div className="border border-slate-200/60 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 font-semibold text-sm text-slate-800 mb-1.5">
                <Laptop className="w-4 h-4 text-sky-600" />
                Electron Desktop Shell
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Secure desktop configuration with contextIsolation enabled, nodeIntegration disabled, and restricted IPC bridge for native packaging.
              </p>
            </div>

            <div className="border border-slate-200/60 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 font-semibold text-sm text-slate-800 mb-1.5">
                <Building className="w-4 h-4 text-amber-600" />
                Branding & Custom Domains
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Modular multi-school data schema with slug resolution, preparatory indexes, and separated client API services ready for custom school domains.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Operations Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Quick Actions</h2>
            <p className="text-xs text-slate-500 mb-4">Common administrative workflows</p>

            <div className="space-y-2">
              <Link
                to="/students/admission"
                className="w-full text-left p-3 rounded-xl border border-slate-200/80 hover:bg-indigo-50/50 hover:border-indigo-200 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-colors"
              >
                <span>Enroll New Student</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
              </Link>

              <button
                disabled
                className="w-full text-left p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors disabled:opacity-60"
              >
                <span>Record Daily Attendance</span>
                <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Phase 2</span>
              </button>

              <button
                disabled
                className="w-full text-left p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors disabled:opacity-60"
              >
                <span>Publish Announcement</span>
                <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Phase 2</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Current Platform Role:</span>
              <span className="font-semibold text-slate-800">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

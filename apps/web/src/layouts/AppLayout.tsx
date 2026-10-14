import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  Settings,
  LogOut,
  Building,
  Menu,
  X,
  ShieldCheck,
  Shield,
  Palette,
  CheckSquare,
  IndianRupee,
  FileSpreadsheet,
  Clock,
  BookMarked,
  UserPlus,
  Globe,
  Landmark,
  CreditCard,
  TrendingUp,
  MessageSquare,
  HardDrive,
  Zap,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, school, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userRole = user?.role || 'staff';

  // Role-filtered navigation definition
  const allNavItems: Array<{
    to: string;
    label: string;
    icon: any;
    roles: string[];
    badge?: string;
  }> = [
    {
      to: '/super-admin',
      label: 'Vendor Console',
      icon: Shield,
      roles: ['super_admin'],
      badge: 'Master',
    },
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'school_admin', 'teacher', 'staff', 'accountant', 'principal', 'student', 'parent'],
    },
    {
      to: '/students',
      label: 'Students (SIS)',
      icon: Users,
      roles: ['super_admin', 'school_admin', 'principal', 'teacher', 'staff'],
    },
    {
      to: '/admissions',
      label: 'Admissions CRM',
      icon: UserPlus,
      roles: ['super_admin', 'school_admin', 'principal', 'staff'],
      badge: 'Leads',
    },
    {
      to: '/academics',
      label: 'Academics & Curricula',
      icon: BookOpen,
      roles: ['super_admin', 'school_admin', 'principal', 'teacher'],
    },
    {
      to: '/academics/promotion',
      label: 'Year Promotion',
      icon: TrendingUp,
      roles: ['super_admin', 'school_admin', 'principal'],
      badge: 'Undo',
    },
    {
      to: '/faculty',
      label: 'Staff Management',
      icon: GraduationCap,
      roles: ['super_admin', 'school_admin', 'principal'],
    },
    {
      to: '/attendance',
      label: 'Attendance & Alerts',
      icon: CheckSquare,
      roles: ['super_admin', 'school_admin', 'principal', 'teacher', 'staff'],
      badge: 'WhatsApp',
    },
    {
      to: '/daily-diary',
      label: 'Daily Diary & HW',
      icon: BookMarked,
      roles: ['super_admin', 'school_admin', 'principal', 'teacher', 'student', 'parent', 'staff'],
    },
    {
      to: '/timetable',
      label: 'Timetable Scheduler',
      icon: Clock,
      roles: ['super_admin', 'school_admin', 'principal', 'teacher', 'student', 'parent'],
    },
    {
      to: '/homework',
      label: 'Homework & LMS',
      icon: BookOpen,
      roles: ['super_admin', 'school_admin', 'principal', 'teacher', 'student', 'parent'],
    },
    {
      to: '/examinations',
      label: 'Examinations & Grades',
      icon: FileSpreadsheet,
      roles: ['super_admin', 'school_admin', 'principal', 'teacher'],
    },
    {
      to: '/fees',
      label: 'Fee Collection',
      icon: IndianRupee,
      roles: ['super_admin', 'school_admin', 'principal', 'accountant'],
      badge: 'Audit',
    },
    {
      to: '/id-cards',
      label: 'ID Card Studio',
      icon: CreditCard,
      roles: ['super_admin', 'school_admin', 'principal', 'staff'],
      badge: 'Print',
    },
    {
      to: '/whatsapp-broadcast',
      label: 'WhatsApp Broadcast',
      icon: MessageSquare,
      roles: ['super_admin', 'school_admin', 'principal', 'teacher'],
    },
    {
      to: '/accounting',
      label: 'Accounting & Ledger',
      icon: Landmark,
      roles: ['super_admin', 'school_admin', 'principal', 'accountant'],
    },
    {
      to: '/website-cms',
      label: 'School Website CMS',
      icon: Globe,
      roles: ['super_admin', 'school_admin'],
    },
    {
      to: '/settings/branding',
      label: 'School Branding',
      icon: Palette,
      roles: ['super_admin', 'school_admin'],
    },
  ];

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  const roleBadgeColors: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
    school_admin: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    principal: 'bg-blue-100 text-blue-800 border-blue-200',
    teacher: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    accountant: 'bg-amber-100 text-amber-800 border-amber-200',
    staff: 'bg-slate-100 text-slate-800 border-slate-200',
    student: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    parent: 'bg-pink-100 text-pink-800 border-pink-200',
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden bg-indigo-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-indigo-300" />
          <span className="font-bold text-lg">Smart School ERP</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-indigo-800 focus:outline-none"
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static flex flex-col justify-between h-screen sticky top-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-0 -translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Logo & Brand */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white tracking-tight leading-tight">Smart School</div>
              <div className="text-xs text-indigo-400 font-medium">Enterprise ERP</div>
            </div>
          </div>

          {/* School Tenant Card */}
          <div className="p-4 mx-3 my-4 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              Active School
            </div>
            <div className="text-sm font-semibold text-white truncate">
              {school ? school.name : user?.role === 'super_admin' ? 'Platform Wide' : 'Standard Tenant'}
            </div>
            {school?.slug && (
              <div className="text-xs text-indigo-300 font-mono mt-0.5">
                @{school.slug}
              </div>
            )}
          </div>

          {/* 100% Offline Mode Indicator */}
          <div className="px-3.5 py-2.5 mx-3 mb-4 bg-emerald-950/60 rounded-xl border border-emerald-500/40 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                <HardDrive className="w-3 h-3 text-emerald-400" />
                <span>100% Offline Engine</span>
              </div>
              <div className="text-[10px] text-emerald-400/80 truncate">No Internet Needed • Local Safe</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-bold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                roleBadgeColors[user?.role || 'staff']
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              {user?.role?.replace('_', ' ')}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors p-1"
              title="Sign out of system"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar with Offline Status Banner */}
        <header className="bg-white border-b border-slate-200 px-6 py-2.5 hidden sm:flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {school?.name || 'Springfield Academy'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ⚡ 100% Offline Local Engine — Zero Internet Dependency
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>Local Database Active</span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

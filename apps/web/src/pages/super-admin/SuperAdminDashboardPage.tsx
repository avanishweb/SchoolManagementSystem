import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ISchool, SchoolStatus, SubscriptionPlanType } from '@smart-school/shared-types';
import { schoolService, SchoolListResponse } from '../../services/schoolService.js';
import { SchoolOnboardingModal } from './SchoolOnboardingModal.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import {
  Building2,
  Users,
  Shield,
  CreditCard,
  Globe,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Clock,
  Layers,
} from 'lucide-react';

export const SuperAdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<SchoolListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<SchoolStatus | ''>('');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType | ''>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await schoolService.listSchools({
        page: currentPage,
        limit: 10,
        search: search.trim() || undefined,
        status: (selectedStatus as SchoolStatus) || undefined,
        plan: (selectedPlan as SubscriptionPlanType) || undefined,
      });
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, selectedStatus, selectedPlan]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSchools();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('');
    setSelectedPlan('');
    setCurrentPage(1);
  };

  // Compute platform aggregate summary numbers
  const totalSchools = data?.pagination.total || 0;
  const activeSchools = data?.items.filter((s) => s.status === 'active').length || 0;
  const totalStudents = data?.items.reduce((acc, s) => acc + (s.usage?.studentCount || 0), 0) || 0;
  const pendingDomains = data?.items.filter((s) => s.customDomain?.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      {/* Platform Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Vendor Operations Portal
            </span>
            <span className="text-xs text-slate-500 font-medium">Platform Super Administrator</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Schools & Licensing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage multi-school customer accounts, custom domains, subscription entitlements, and system audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/super-admin/audit-logs"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Clock className="w-4 h-4 text-slate-500" />
            Audit Logs
          </Link>
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Onboard New School
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Managed Schools</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalSchools}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {activeSchools} currently active tenants
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Platform Students</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStudents}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Across all school databases</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Annual / Paid Plans</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {data?.items.filter((s) => s.subscription?.plan === 'annual' || s.subscription?.plan === 'monthly').length || 0}
          </div>
          <div className="text-[11px] text-purple-600 font-medium mt-1">Commercial customer subscriptions</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Custom Domains</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {data?.items.filter((s) => s.customDomain?.status === 'verified').length || 0}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            {pendingDomains > 0 ? `${pendingDomains} pending DNS verification` : 'All verified domains online'}
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schools by name, code, slug, or domain..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as SchoolStatus);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
              <option value="archived">Archived</option>
            </select>

            {/* Plan Filter */}
            <select
              value={selectedPlan}
              onChange={(e) => {
                setSelectedPlan(e.target.value as SubscriptionPlanType);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Plans</option>
              <option value="trial">14-Day Trial</option>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
              <option value="lifetime">Lifetime</option>
            </select>

            {(search || selectedStatus || selectedPlan) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" label="Loading customer schools..." />
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600 text-xs">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            {error}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Schools Found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">No customer schools match your current filter settings.</p>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Onboard First School
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">School & Code</th>
                  <th className="py-3 px-4">Slug / Domain</th>
                  <th className="py-3 px-4">Subscription Plan</th>
                  <th className="py-3 px-4">Capacity Usage</th>
                  <th className="py-3 px-4">License Status</th>
                  <th className="py-3 px-4">School Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {data.items.map((school) => {
                  const studentCount = school.usage?.studentCount || 0;
                  const maxStudents = school.subscription?.maxStudents || 100;
                  const usagePct = Math.min(Math.round((studentCount / maxStudents) * 100), 100);

                  return (
                    <tr key={school.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm"
                            style={{ backgroundColor: school.branding?.primaryColor || '#4f46e5' }}
                          >
                            {school.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {school.name}
                              {school.code && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                  {school.code}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{school.contactEmail || 'No contact email'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div>/{school.slug}</div>
                        {school.customDomain?.domain && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                school.customDomain.status === 'verified'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              <Globe className="w-2.5 h-2.5" />
                              {school.customDomain.domain} ({school.customDomain.status})
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {school.subscription?.plan || 'trial'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between text-[11px] font-medium text-slate-600">
                            <span>{studentCount} students</span>
                            <span>max {maxStudents}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                usagePct > 90 ? 'bg-rose-500' : usagePct > 70 ? 'bg-amber-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            school.subscription?.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {school.subscription?.status || 'active'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            school.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : school.status === 'suspended'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {school.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/super-admin/schools/${school.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-xs font-semibold border border-slate-200/80 transition-colors"
                        >
                          Manage Console
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SchoolOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={fetchSchools}
      />
    </div>
  );
};

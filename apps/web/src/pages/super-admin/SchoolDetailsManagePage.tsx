import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ISchool,
  SchoolStatus,
  SubscriptionPlanType,
  ISubscriptionInvoice,
  IVendorAuditLog,
  ISupportAccessSession,
} from '@smart-school/shared-types';
import { schoolService } from '../../services/schoolService.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import {
  Building2,
  Shield,
  Globe,
  Palette,
  CreditCard,
  KeyRound,
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Plus,
  ExternalLink,
  Lock,
} from 'lucide-react';

export const SchoolDetailsManagePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [school, setSchool] = useState<ISchool | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'subscription' | 'domain' | 'branding' | 'billing' | 'support' | 'audit'>(
    'subscription'
  );

  // Sub-states
  const [invoices, setInvoices] = useState<ISubscriptionInvoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<IVendorAuditLog[]>([]);
  const [supportSessions, setSupportSessions] = useState<ISupportAccessSession[]>([]);

  // Action states
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form states for Domain
  const [domainInput, setDomainInput] = useState<string>('');
  const [dnsType, setDnsType] = useState<'TXT' | 'CNAME'>('TXT');

  // Form states for Support Session
  const [supportReason, setSupportReason] = useState<string>('');
  const [supportTicket, setSupportTicket] = useState<string>('');
  const [supportHours, setSupportHours] = useState<number>(24);

  // Form states for Invoice
  const [invoiceAmount, setInvoiceAmount] = useState<number>(1200);
  const [invoicePlan, setInvoicePlan] = useState<SubscriptionPlanType>('annual');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);

  const fetchSchoolData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await schoolService.getSchoolById(id);
      setSchool(res);
      setDomainInput(res.customDomain?.domain || '');
      setDnsType(res.customDomain?.dnsRecordType || 'TXT');

      // Load related data
      const [invRes, auditRes, supRes] = await Promise.all([
        schoolService.listInvoices(id),
        schoolService.listAuditLogs({ schoolId: id, limit: 25 }),
        schoolService.listSupportSessions(id),
      ]);
      setInvoices(invRes.items);
      setAuditLogs(auditRes.items);
      setSupportSessions(supRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load school details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSchoolData();
  }, [fetchSchoolData]);

  const handleStatusChange = async (newStatus: SchoolStatus) => {
    if (!id || !school) return;
    try {
      setActionLoading(true);
      await schoolService.updateStatus(id, newStatus, `Vendor admin changed status to ${newStatus}`);
      setActionMessage(`School status changed to ${newStatus}.`);
      fetchSchoolData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Status update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfigureDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !domainInput.trim()) return;
    try {
      setActionLoading(true);
      await schoolService.configureDomain(id, { domain: domainInput.trim(), dnsRecordType: dnsType });
      setActionMessage('Custom domain configured. Verification challenge issued.');
      fetchSchoolData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register domain.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      const res = await schoolService.verifyDomain(id);
      if (res.result.verified) {
        setActionMessage('Domain DNS verified successfully! SSL certificate is active.');
      } else {
        setError(`DNS verification check failed: ${res.result.errorMessage || 'Record not found'}`);
      }
      fetchSchoolData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!id || !confirm('Are you sure you want to disconnect this custom domain?')) return;
    try {
      setActionLoading(true);
      await schoolService.removeDomain(id);
      setActionMessage('Custom domain removed.');
      fetchSchoolData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove domain.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSupportSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !supportReason.trim() || !supportTicket.trim()) return;
    try {
      setActionLoading(true);
      await schoolService.createSupportSession(id, {
        schoolId: id,
        reason: supportReason.trim(),
        ticketReference: supportTicket.trim(),
        durationHours: supportHours,
      });
      setActionMessage('Vendor support access session granted and logged in audit trail.');
      setSupportReason('');
      setSupportTicket('');
      fetchSchoolData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to grant support access.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeSupport = async (sessionId: string) => {
    try {
      setActionLoading(true);
      await schoolService.revokeSupportSession(sessionId);
      setActionMessage('Support access session revoked.');
      fetchSchoolData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke session.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setActionLoading(true);
      await schoolService.createInvoice(id, {
        schoolId: id,
        plan: invoicePlan,
        amount: invoiceAmount,
        currency: 'USD',
        billingCycle: 'Annual',
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        notes: `Subscription billing for ${school?.name}`,
      });
      setIsInvoiceModalOpen(false);
      setActionMessage('Invoice generated.');
      fetchSchoolData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" label="Loading school management console..." />
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Failed to Load School</h2>
        <p className="text-xs text-slate-500">{error || 'School record not found.'}</p>
        <Link
          to="/super-admin"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Schools
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/super-admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Managed Schools
        </Link>

        {actionMessage && (
          <div className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle className="w-3.5 h-3.5" />
            {actionMessage}
          </div>
        )}
      </div>

      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md"
            style={{ backgroundColor: school.branding?.primaryColor || '#4f46e5' }}
          >
            {school.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{school.name}</h1>
              {school.code && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {school.code}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>Slug: <strong>/{school.slug}</strong></span>
              <span>•</span>
              <span>Plan: <strong className="uppercase">{school.subscription?.plan}</strong></span>
              <span>•</span>
              <span>Students: <strong>{school.usage?.studentCount || 0} / {school.subscription?.maxStudents || 100}</strong></span>
            </div>
          </div>
        </div>

        {/* Status Dropdown & Actions */}
        <div className="flex items-center gap-3">
          <select
            value={school.status}
            onChange={(e) => handleStatusChange(e.target.value as SchoolStatus)}
            disabled={actionLoading}
            className={`text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              school.status === 'active'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : school.status === 'suspended'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <option value="active">Active Tenant</option>
            <option value="suspended">Suspended Tenant</option>
            <option value="pending">Pending Onboarding</option>
            <option value="archived">Archived School</option>
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('subscription')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'subscription'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          Subscription & Licensing
        </button>

        <button
          onClick={() => setActiveTab('domain')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'domain'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          Custom Domain
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'branding'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          White-Label Branding
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'billing'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Billing & Invoices
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'support'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Vendor Support Access
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Audit Trail
        </button>
      </div>

      {/* Tab 1: Subscription & Licensing */}
      {activeTab === 'subscription' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">License Entitlements & Capacity</h3>
              <p className="text-xs text-slate-500">
                Configure student caps, staff limits, plan expiry, and enabled modular features.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-500">Plan Tier</span>
              <div className="text-base font-bold text-slate-900 capitalize mt-1">
                {school.subscription?.plan}
              </div>
              <span className="text-[11px] text-slate-400">
                Status: {school.subscription?.status}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-500">Student Capacity Limit</span>
              <div className="text-base font-bold text-indigo-600 mt-1">
                {school.usage?.studentCount || 0} / {school.subscription?.maxStudents} students
              </div>
              <span className="text-[11px] text-slate-400">Admissions blocked when cap reached</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-500">License Expiration</span>
              <div className="text-base font-bold text-slate-900 mt-1">
                {school.subscription?.expiryDate
                  ? new Date(school.subscription.expiryDate).toLocaleDateString()
                  : 'Never'}
              </div>
              <span className="text-[11px] text-slate-400">
                Grace period: {school.subscription?.gracePeriodDays || 14} days
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Enabled Features</h4>
            <div className="flex flex-wrap gap-2">
              {school.subscription?.features?.map((f) => (
                <span
                  key={f}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Custom Domain */}
      {activeTab === 'domain' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900">Custom Domain Connection & DNS Verification</h3>
            <p className="text-xs text-slate-500">
              Connect a custom school domain such as <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">erp.schoolname.com</code> with automated DNS challenge checks.
            </p>
          </div>

          {school.customDomain?.domain ? (
            <div className="space-y-6">
              {/* Domain Status Box */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-mono font-bold text-slate-900">
                      {school.customDomain.domain}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        school.customDomain.status === 'verified'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {school.customDomain.status.toUpperCase()}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      SSL: {school.customDomain.sslStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Record type: {school.customDomain.dnsRecordType} • Challenge Host:{' '}
                    <code className="text-indigo-600 font-mono">
                      _smartschool-challenge.{school.customDomain.domain}
                    </code>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleVerifyDomain}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                    Verify DNS Now
                  </button>
                  <button
                    onClick={handleRemoveDomain}
                    disabled={actionLoading}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Disconnect Domain"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DNS Instructions Card for School IT Admin */}
              <div className="p-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  DNS Setup Instructions for School Domain Administrator
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Log in to your DNS provider (Cloudflare, GoDaddy, Route53, Namecheap) and create the following DNS record:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="bg-white p-3 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">Record Type</span>
                    <div className="font-bold text-slate-900 mt-1">{school.customDomain.dnsRecordType}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">Host / Name</span>
                    <div className="font-bold text-indigo-600 truncate mt-1">
                      {school.customDomain.dnsRecordType === 'TXT'
                        ? `_smartschool-challenge.${school.customDomain.domain}`
                        : school.customDomain.domain}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">Required Value</span>
                    <div className="font-bold text-slate-900 truncate mt-1">
                      {school.customDomain.expectedValue}
                    </div>
                  </div>
                </div>

                {school.customDomain.errorMessage && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{school.customDomain.errorMessage}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Configure Domain Form */
            <form onSubmit={handleConfigureDomain} className="max-w-md space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Connect Custom Subdomain or Domain
                </label>
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="e.g. erp.springfield.edu"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Verification Method</label>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dnsType"
                      value="TXT"
                      checked={dnsType === 'TXT'}
                      onChange={() => setDnsType('TXT')}
                    />
                    TXT Challenge Record (Recommended)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dnsType"
                      value="CNAME"
                      checked={dnsType === 'CNAME'}
                      onChange={() => setDnsType('CNAME')}
                    />
                    CNAME Routing Record
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading || !domainInput.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                Issue DNS Verification Challenge
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab 3: White-Label Branding */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900">White-Label Branding Overview</h3>
            <p className="text-xs text-slate-500">
              Active primary colors, login styling, and certificate templates configured for {school.name}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-2">
              <span className="text-xs font-medium text-slate-500">Theme Colors</span>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl shadow-sm border border-black/10"
                  style={{ backgroundColor: school.branding?.primaryColor || '#4f46e5' }}
                  title="Primary Color"
                />
                <div
                  className="w-8 h-8 rounded-xl shadow-sm border border-black/10"
                  style={{ backgroundColor: school.branding?.secondaryColor || '#0f172a' }}
                  title="Secondary Color"
                />
                <div
                  className="w-8 h-8 rounded-xl shadow-sm border border-black/10"
                  style={{ backgroundColor: school.branding?.accentColor || '#06b6d4' }}
                  title="Accent Color"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-1">
              <span className="text-xs font-medium text-slate-500">Custom Login Headline</span>
              <div className="text-xs font-bold text-slate-900">
                {school.branding?.loginTitle || 'Standard Portal'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {school.branding?.loginSubtitle || 'No custom subtitle'}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-1">
              <span className="text-xs font-medium text-slate-500">Receipt Signatory</span>
              <div className="text-xs font-bold text-slate-900">
                {school.branding?.authorizedSignatoryName || 'Not configured'}
              </div>
              <div className="text-[11px] text-slate-500">
                {school.branding?.authorizedSignatoryTitle || 'Administration'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Billing & Invoices */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Subscription Invoices & Payment Records</h3>
              <p className="text-xs text-slate-500">
                Issue customer invoices, track renewal payment receipts, and view payment histories.
              </p>
            </div>
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Generate Invoice
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-2.5">Invoice #</th>
                  <th className="py-2.5">Plan</th>
                  <th className="py-2.5">Amount</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Due Date</th>
                  <th className="py-2.5">Payment Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No invoices issued yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 uppercase">{inv.plan}</td>
                      <td className="py-3 font-semibold text-slate-900">${inv.amount}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="py-3 text-slate-500">{inv.paymentMethod || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Vendor Emergency Support Access */}
      {activeTab === 'support' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900">Authorized Vendor Support Sessions</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              In accordance with multi-tenant privacy guarantees, vendor administrators do not have default access to student records. Access must be explicitly initiated with an authorized support ticket and is fully audited.
            </p>
          </div>

          <form onSubmit={handleCreateSupportSession} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 max-w-xl space-y-4">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-indigo-600" />
              Request Limited Support Access Session
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Support Ticket Reference <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={supportTicket}
                onChange={(e) => setSupportTicket(e.target.value)}
                placeholder="e.g. TICKET-9921"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Authorized Reason / Purpose <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={supportReason}
                onChange={(e) => setSupportReason(e.target.value)}
                placeholder="e.g. Investigating student attendance export discrepancies as requested by school admin..."
                rows={2}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Session Duration</label>
              <select
                value={supportHours}
                onChange={(e) => setSupportHours(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1 hour</option>
                <option value={4}>4 hours</option>
                <option value={24}>24 hours</option>
                <option value={72}>72 hours (Maximum)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={actionLoading || !supportReason.trim() || !supportTicket.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              Initiate Authorized Support Session
            </button>
          </form>

          {/* Active Sessions List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Session History</h4>
            {supportSessions.length === 0 ? (
              <div className="text-xs text-slate-400 py-4">No support sessions recorded for this school.</div>
            ) : (
              supportSessions.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-slate-100 bg-white flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{s.ticketReference}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {s.isActive ? 'ACTIVE' : 'EXPIRED / REVOKED'}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{s.reason}</div>
                    <div className="text-slate-400 text-[10px] mt-0.5">
                      Expires: {new Date(s.expiresAt).toLocaleString()}
                    </div>
                  </div>
                  {s.isActive && (
                    <button
                      onClick={() => handleRevokeSupport(s.id)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900">Tenant Action Audit Trail</h3>
            <p className="text-xs text-slate-500">
              Immutable chronological record of administrative and configuration events on {school.name}.
            </p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No audit events recorded yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-slate-900 font-mono text-[11px]">{log.action}</div>
                    <div className="text-slate-500 text-[11px]">
                      By: <strong>{log.actorEmail}</strong> ({log.actorRole})
                    </div>
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Simple Modal for Generating Invoice */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Generate New Customer Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan</label>
                <select
                  value={invoicePlan}
                  onChange={(e) => setInvoicePlan(e.target.value as SubscriptionPlanType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="monthly">Standard Monthly</option>
                  <option value="annual">Institution Annual</option>
                  <option value="lifetime">Enterprise Lifetime</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (USD)</label>
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

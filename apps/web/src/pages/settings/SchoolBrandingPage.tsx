import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateSchoolBrandingSchema, UpdateSchoolBrandingInput } from '@smart-school/validation';
import { schoolService } from '../../services/schoolService.js';
import { useBranding } from '../../context/BrandingContext.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import {
  Palette,
  Globe,
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Eye,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

export const SchoolBrandingPage: React.FC = () => {
  const { school, branding, refreshBranding } = useBranding();
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Custom Domain State
  const [customDomainInput, setCustomDomainInput] = useState<string>('');
  const [domainRecordType, setDomainRecordType] = useState<'TXT' | 'CNAME'>('TXT');
  const [domainLoading, setDomainLoading] = useState<boolean>(false);
  const [domainMessage, setDomainMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateSchoolBrandingInput>({
    resolver: zodResolver(updateSchoolBrandingSchema),
    defaultValues: {
      primaryColor: branding.primaryColor || '#4f46e5',
      secondaryColor: branding.secondaryColor || '#0f172a',
      accentColor: branding.accentColor || '#06b6d4',
      loginTitle: branding.loginTitle || '',
      loginSubtitle: branding.loginSubtitle || '',
      receiptHeader: branding.receiptHeader || '',
      receiptFooter: branding.receiptFooter || '',
      taxId: branding.taxId || '',
      authorizedSignatoryName: branding.authorizedSignatoryName || '',
      authorizedSignatoryTitle: branding.authorizedSignatoryTitle || '',
      idCardTemplate: branding.idCardTemplate || 'modern',
      idCardShowBloodGroup: branding.idCardShowBloodGroup ?? true,
      idCardShowEmergencyContact: branding.idCardShowEmergencyContact ?? true,
    },
  });

  const watchedPrimary = watch('primaryColor') || '#4f46e5';
  const watchedSecondary = watch('secondaryColor') || '#0f172a';
  const watchedLoginTitle = watch('loginTitle') || 'School Portal';
  const watchedLoginSubtitle = watch('loginSubtitle') || 'Sign in to access your administrative dashboard.';
  const watchedReceiptHeader = watch('receiptHeader') || 'Official Fee Receipt';
  const watchedReceiptFooter = watch('receiptFooter') || 'Thank you for your prompt payment.';
  const watchedSignatory = watch('authorizedSignatoryName') || 'Authorized Signatory';
  const watchedSignatoryTitle = watch('authorizedSignatoryTitle') || 'Principal';

  useEffect(() => {
    if (school) {
      reset({
        primaryColor: school.branding?.primaryColor || '#4f46e5',
        secondaryColor: school.branding?.secondaryColor || '#0f172a',
        accentColor: school.branding?.accentColor || '#06b6d4',
        loginTitle: school.branding?.loginTitle || '',
        loginSubtitle: school.branding?.loginSubtitle || '',
        receiptHeader: school.branding?.receiptHeader || '',
        receiptFooter: school.branding?.receiptFooter || '',
        taxId: school.branding?.taxId || '',
        authorizedSignatoryName: school.branding?.authorizedSignatoryName || '',
        authorizedSignatoryTitle: school.branding?.authorizedSignatoryTitle || '',
        idCardTemplate: school.branding?.idCardTemplate || 'modern',
        idCardShowBloodGroup: school.branding?.idCardShowBloodGroup ?? true,
        idCardShowEmergencyContact: school.branding?.idCardShowEmergencyContact ?? true,
      });
      setCustomDomainInput(school.customDomain?.domain || '');
      setDomainRecordType(school.customDomain?.dnsRecordType || 'TXT');
    }
  }, [school, reset]);

  const onSubmit = async (data: UpdateSchoolBrandingInput) => {
    if (!school) return;
    try {
      setLoading(true);
      setSuccessMessage(null);
      setErrorMessage(null);
      await schoolService.updateBranding(school.id, data);
      await refreshBranding();
      setSuccessMessage('White-label branding and templates updated successfully!');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update branding settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !customDomainInput.trim()) return;
    try {
      setDomainLoading(true);
      setDomainMessage(null);
      await schoolService.configureDomain(school.id, {
        domain: customDomainInput.trim(),
        dnsRecordType: domainRecordType,
      });
      await refreshBranding();
      setDomainMessage('Custom domain registered. DNS verification challenge issued.');
    } catch (err: unknown) {
      setDomainMessage(err instanceof Error ? err.message : 'Domain registration failed.');
    } finally {
      setDomainLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!school) return;
    try {
      setDomainLoading(true);
      const res = await schoolService.verifyDomain(school.id);
      if (res.result.verified) {
        setDomainMessage('DNS verified! Your custom domain is now live and SSL encrypted.');
      } else {
        setDomainMessage(`DNS check failed: ${res.result.errorMessage}`);
      }
      await refreshBranding();
    } catch (err: unknown) {
      setDomainMessage(err instanceof Error ? err.message : 'DNS verification check failed.');
    } finally {
      setDomainLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              White-Label Customization
            </span>
            <span className="text-xs text-slate-500 font-medium">{school?.name}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">School Branding & Domain Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Customize your school's visual identity, primary colors, login appearance, certificate templates, and custom domain.
          </p>
        </div>

        {successMessage && (
          <div className="text-xs px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {successMessage}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Branding Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Brand Color Palette */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-500" />
                1. Brand Color Palette
              </h3>
              <p className="text-xs text-slate-500">
                These colors will automatically skin your navigation, buttons, login screen, and report headers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      {...register('primaryColor')}
                      className="w-10 h-10 p-0.5 rounded-xl border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      {...register('primaryColor')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Secondary / Dark</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      {...register('secondaryColor')}
                      className="w-10 h-10 p-0.5 rounded-xl border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      {...register('secondaryColor')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Accent Highlight</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      {...register('accentColor')}
                      className="w-10 h-10 p-0.5 rounded-xl border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      {...register('accentColor')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Login Page Customization */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                2. Login Page Branding
              </h3>
              <p className="text-xs text-slate-500">
                Custom greeting displayed to your teachers, students, and staff when accessing your school portal.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Portal Headline</label>
                  <input
                    {...register('loginTitle')}
                    placeholder="e.g. Springfield Academy Portal"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-Headline / Motto</label>
                  <textarea
                    {...register('loginSubtitle')}
                    rows={2}
                    placeholder="e.g. Excellence in academic leadership, character, and lifelong learning."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Receipts & Certificate Templates */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                3. Receipt & Certificate Templates
              </h3>
              <p className="text-xs text-slate-500">
                Configure headers, footers, tax identification, and authorized signatory details on generated documents.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Document Title</label>
                  <input
                    {...register('receiptHeader')}
                    placeholder="Official Fee Receipt"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax / Registration ID</label>
                  <input
                    {...register('taxId')}
                    placeholder="e.g. TAX-9844-01"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Signatory Full Name</label>
                  <input
                    {...register('authorizedSignatoryName')}
                    placeholder="e.g. Dr. Arthur Pendelton"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Signatory Designation</label>
                  <input
                    {...register('authorizedSignatoryTitle')}
                    placeholder="Principal / Bursar"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Footer Note</label>
                  <input
                    {...register('receiptFooter')}
                    placeholder="Thank you for your prompt fee remittance."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save Branding Settings
              </button>
            </div>
          </form>

          {/* 4. Custom Domain Connection Manager */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              4. Custom School Domain
            </h3>
            <p className="text-xs text-slate-500">
              Serve your portal under your own web domain (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">erp.yourschool.edu</code>).
            </p>

            {school?.customDomain?.domain ? (
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-slate-900">{school.customDomain.domain}</div>
                    <div className="text-[11px] text-slate-500">
                      Status: <strong>{school.customDomain.status}</strong> • SSL:{' '}
                      <strong>{school.customDomain.sslStatus}</strong>
                    </div>
                  </div>
                  <button
                    onClick={handleVerifyDomain}
                    disabled={domainLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${domainLoading ? 'animate-spin' : ''}`} />
                    Verify DNS
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-white border border-indigo-100 text-xs font-mono space-y-2">
                  <div className="text-slate-400 font-sans text-[11px] font-bold uppercase">
                    DNS Verification Challenge ({school.customDomain.dnsRecordType})
                  </div>
                  <div>
                    Host:{' '}
                    <span className="text-indigo-600">
                      {school.customDomain.dnsRecordType === 'TXT'
                        ? `_smartschool-challenge.${school.customDomain.domain}`
                        : school.customDomain.domain}
                    </span>
                  </div>
                  <div>
                    Value: <span className="text-slate-900">{school.customDomain.expectedValue}</span>
                  </div>
                </div>

                {domainMessage && (
                  <div className="text-xs p-3 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200">
                    {domainMessage}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleConfigureDomain} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Custom Domain</label>
                  <input
                    type="text"
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    placeholder="erp.myschool.edu"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={domainLoading || !customDomainInput.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold disabled:opacity-50"
                >
                  Connect Domain
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Col: Live White-Label Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm sticky top-6 space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Eye className="w-4 h-4 text-indigo-500" />
              Live Visual Preview
            </div>

            {/* 1. Login Screen Preview */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-500">Portal Login Preview</span>
              <div
                className="p-6 rounded-2xl border text-white shadow-md relative overflow-hidden"
                style={{ backgroundColor: watchedSecondary }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white mb-3 shadow"
                  style={{ backgroundColor: watchedPrimary }}
                >
                  {school?.name.charAt(0) || 'S'}
                </div>
                <div className="text-sm font-black">{watchedLoginTitle}</div>
                <div className="text-[11px] text-slate-300 mt-1 line-clamp-2">{watchedLoginSubtitle}</div>
                <div
                  className="mt-4 py-2 px-3 rounded-lg text-center font-bold text-[11px] shadow-sm text-white"
                  style={{ backgroundColor: watchedPrimary }}
                >
                  Sign In to Dashboard
                </div>
              </div>
            </div>

            {/* 2. Official Receipt Header Preview */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500">Document Receipt Preview</span>
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex justify-between items-start border-b pb-2 border-slate-200">
                  <div>
                    <div className="font-bold text-slate-900" style={{ color: watchedPrimary }}>
                      {school?.name || 'School Name'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{watchedReceiptHeader}</div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">REC-2026-0042</div>
                </div>

                <div className="py-2 text-[11px] flex justify-between font-medium text-slate-700">
                  <span>Tuition & Laboratory Fee</span>
                  <span className="font-bold">$850.00</span>
                </div>

                <div className="border-t pt-2 border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
                  <div>{watchedReceiptFooter}</div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800">{watchedSignatory}</div>
                    <div className="text-[9px] text-slate-400">{watchedSignatoryTitle}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

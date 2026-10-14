import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { onboardSchoolSchema, OnboardSchoolInput } from '@smart-school/validation';
import { schoolService } from '../../services/schoolService.js';
import { X, Building2, User, Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface SchoolOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SchoolOnboardingModal: React.FC<SchoolOnboardingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OnboardSchoolInput>({
    resolver: zodResolver(onboardSchoolSchema),
    defaultValues: {
      plan: 'trial',
      maxStudents: 50,
      schoolName: '',
      code: '',
      contactEmail: '',
      contactPhone: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      notes: '',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: OnboardSchoolInput) => {
    try {
      setLoading(true);
      setServerError(null);
      await schoolService.onboardSchool(data);
      reset();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to onboard school.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Onboard New Customer School</h2>
              <p className="text-xs text-slate-500">Create independent tenant organization and initial school admin account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {serverError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Section 1: School Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              1. School Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  School Name <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('schoolName')}
                  placeholder="e.g. Oakridge International Academy"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {errors.schoolName && <p className="text-[11px] text-rose-500 mt-1">{errors.schoolName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unique School Code</label>
                <input
                  {...register('code')}
                  placeholder="e.g. OAK-001"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Contact Email <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('contactEmail')}
                  type="email"
                  placeholder="contact@oakridge.edu"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {errors.contactEmail && <p className="text-[11px] text-rose-500 mt-1">{errors.contactEmail.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Initial Administrator */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              2. School Administrator Account
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('adminName')}
                  placeholder="e.g. Principal Margaret Thatcher"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {errors.adminName && <p className="text-[11px] text-rose-500 mt-1">{errors.adminName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Email (Login ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('adminEmail')}
                  type="email"
                  placeholder="admin@oakridge.edu"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {errors.adminEmail && <p className="text-[11px] text-rose-500 mt-1">{errors.adminEmail.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('adminPassword')}
                  type="password"
                  placeholder="Min 8 chars, 1 uppercase, 1 digit (e.g. Admin@123456)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {errors.adminPassword && <p className="text-[11px] text-rose-500 mt-1">{errors.adminPassword.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Subscription Plan */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              3. Licensing & Plan Assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subscription Plan</label>
                <select
                  {...register('plan')}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="trial">14-Day Free Evaluation (50 students)</option>
                  <option value="monthly">Standard Monthly (500 students)</option>
                  <option value="annual">Institution Annual (2,500 students)</option>
                  <option value="lifetime">Enterprise Lifetime (Unlimited)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Student Limit Override</label>
                <input
                  {...register('maxStudents')}
                  type="number"
                  placeholder="Leave blank for plan default"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Onboarding Notes</label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Contract terms, referred by, payment references..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Provisioning Tenant...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Onboarding
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

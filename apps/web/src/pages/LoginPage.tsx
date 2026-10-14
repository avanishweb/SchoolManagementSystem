import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginSchema, LoginInput } from '@smart-school/validation';
import { useAuth } from '../hooks/useAuth.js';
import { ErrorAlert } from '../components/common/ErrorAlert.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { Lock, Mail, Building, Eye, EyeOff, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      schoolSlug: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const apiErr = err as { message?: string; status?: number };
      if (apiErr?.status === 429) {
        setServerError(
          apiErr.message || 'Too many requests or login attempts from this IP. Please wait before trying again.'
        );
      } else if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred during login.');
      }
    }
  };

  const handleDemoFill = (email: string, pass: string, slug: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setValue('schoolSlug', slug, { shouldValidate: true });
    setServerError(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign In to Your School</h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your institutional credentials to access your administrative dashboard.
        </p>
      </div>

      {serverError && (
        <ErrorAlert
          title={serverError.toLowerCase().includes('too many') ? 'Rate Limit Exceeded' : 'Authentication Failed'}
          message={serverError}
          onDismiss={() => setServerError(null)}
          className="mb-5"
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* School Slug (Optional Tenant Domain) */}
        <div>
          <label htmlFor="schoolSlug" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            School Identifier / Slug <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Building className="h-4 w-4" />
            </div>
            <input
              id="schoolSlug"
              type="text"
              placeholder="e.g. springfield-academy"
              {...register('schoolSlug')}
              className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 transition-colors"
            />
          </div>
          {errors.schoolSlug && (
            <p className="mt-1 text-xs text-rose-600">{errors.schoolSlug.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Institutional Email Address
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@school.edu"
              {...register('email')}
              className={`block w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 transition-colors ${
                errors.email ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••••"
              {...register('password')}
              className={`block w-full pl-9 pr-10 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 transition-colors ${
                errors.password ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
            />
            <span className="ml-2">Keep me signed in</span>
          </label>
          <span className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer">
            Need help signing in?
          </span>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" label="Authenticating..." className="text-white" />
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </div>
      </form>

      {/* Development Quick Fill Helpers */}
      <div className="mt-6 pt-5 border-t border-slate-200">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
          Development Quick-Fill Credentials
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleDemoFill('superadmin@platform.local', 'SuperAdmin@123456', '')}
            className="p-2 text-left bg-purple-50 hover:bg-purple-100 hover:border-purple-300 border border-purple-200 rounded-md transition-colors"
          >
            <div className="font-semibold text-purple-900">Vendor Super Admin</div>
            <div className="text-[11px] text-purple-600 truncate">superadmin@platform.local</div>
          </button>
          <button
            type="button"
            onClick={() => handleDemoFill('admin@springfield.edu', 'Admin@123456', 'springfield-academy')}
            className="p-2 text-left bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-md transition-colors"
          >
            <div className="font-semibold text-slate-800">Springfield Admin</div>
            <div className="text-[11px] text-slate-500 truncate">admin@springfield.edu</div>
          </button>
          <button
            type="button"
            onClick={() => handleDemoFill('admin@riverdale.edu', 'Admin@123456', 'riverdale-collegiate')}
            className="p-2 text-left bg-slate-50 hover:bg-sky-50 hover:border-sky-200 border border-slate-200 rounded-md transition-colors"
          >
            <div className="font-semibold text-slate-800">Riverdale Admin</div>
            <div className="text-[11px] text-slate-500 truncate">admin@riverdale.edu</div>
          </button>
          <button
            type="button"
            onClick={() => handleDemoFill('teacher@springfield.edu', 'Teacher@123456', 'springfield-academy')}
            className="p-2 text-left bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-md transition-colors"
          >
            <div className="font-semibold text-slate-800">Teacher</div>
            <div className="text-[11px] text-slate-500 truncate">teacher@springfield.edu</div>
          </button>
        </div>
      </div>
    </div>
  );
};

import { UserRole } from '@smart-school/shared-types';

/**
 * Standard Application Error Codes
 */
export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  TENANT_MISMATCH: 'TENANT_MISMATCH',
  LICENSE_LIMIT_EXCEEDED: 'LICENSE_LIMIT_EXCEEDED',
  LICENSE_EXPIRED: 'LICENSE_EXPIRED',
  LICENSE_SUSPENDED: 'LICENSE_SUSPENDED',
  DOMAIN_VERIFICATION_FAILED: 'DOMAIN_VERIFICATION_FAILED',
  SUPPORT_ACCESS_REQUIRED: 'SUPPORT_ACCESS_REQUIRED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Normalizes text to URL-friendly slugs (e.g., "Oakridge High School" -> "oakridge-high-school")
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Simple email validation regex helper
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Role hierarchy order (from highest privilege to lowest)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  principal: 85,
  school_admin: 80,
  accountant: 50,
  teacher: 40,
  librarian: 30,
  staff: 20,
  parent: 10,
  student: 5,
};

/**
 * Determines whether user role meets required role level
 */
export function hasRequiredRole(currentRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_HIERARCHY[currentRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

/**
 * Formats a student's full name
 */
export function formatStudentName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

/**
 * Formats an admission number with sequence padding
 * e.g., formatAdmissionNumber("ADM", 2026, 42) -> "ADM-2026-0042"
 */
export function formatAdmissionNumber(prefix: string, year: number | string, sequence: number): string {
  const padded = String(sequence).padStart(4, '0');
  return `${prefix.toUpperCase()}-${year}-${padded}`;
}

export const STANDARD_CLASSES = [
  'Kindergarten',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
] as const;

export const STANDARD_SECTIONS = ['A', 'B', 'C', 'D'] as const;

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export interface PlanPreset {
  name: string;
  maxStudents: number;
  maxUsers: number;
  maxStorageMB: number;
  features: string[];
  defaultDurationDays: number;
}

export const SUBSCRIPTION_PLAN_PRESETS: Record<'trial' | 'monthly' | 'annual' | 'lifetime', PlanPreset> = {
  trial: {
    name: '14-Day Free Evaluation',
    maxStudents: 50,
    maxUsers: 5,
    maxStorageMB: 500,
    features: ['students', 'academics', 'branding'],
    defaultDurationDays: 14,
  },
  monthly: {
    name: 'Standard Monthly',
    maxStudents: 500,
    maxUsers: 25,
    maxStorageMB: 5000,
    features: ['students', 'academics', 'branding', 'reports', 'custom_domain'],
    defaultDurationDays: 30,
  },
  annual: {
    name: 'Institution Annual',
    maxStudents: 2500,
    maxUsers: 100,
    maxStorageMB: 25000,
    features: ['students', 'academics', 'branding', 'reports', 'custom_domain', 'api_access', 'priority_support'],
    defaultDurationDays: 365,
  },
  lifetime: {
    name: 'Enterprise Lifetime',
    maxStudents: 100000,
    maxUsers: 1000,
    maxStorageMB: 100000,
    features: ['students', 'academics', 'branding', 'reports', 'custom_domain', 'api_access', 'priority_support', 'audit_exports'],
    defaultDurationDays: 36500, // 100 years
  },
};

export const DEFAULT_SCHOOL_BRANDING = {
  primaryColor: '#4f46e5', // Indigo 600
  secondaryColor: '#0f172a', // Slate 900
  accentColor: '#06b6d4', // Cyan 500
  loginTitle: 'School Portal',
  loginSubtitle: 'Sign in to access your administrative dashboard and academic records.',
  receiptHeader: 'Official Fee Receipt',
  receiptFooter: 'Thank you for your prompt payment.',
  idCardTemplate: 'modern' as const,
  idCardShowBloodGroup: true,
  idCardShowEmergencyContact: true,
};

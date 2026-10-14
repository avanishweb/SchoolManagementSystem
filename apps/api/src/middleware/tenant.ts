import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { School } from '../modules/schools/school.model.js';
import { supportService } from '../modules/support/support.service.js';

/**
 * Tenant resolution middleware.
 * Ensures the tenant boundary is strictly derived from the authenticated user token
 * and prevents client tampering.
 */
export async function resolveTenant(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    return next(AppError.unauthorized('Authentication required before tenant resolution.'));
  }

  // Super administrators can optionally scope requests via header or query
  if (req.user.role === 'super_admin') {
    const explicitTenant = (req.headers['x-school-id'] as string) || (req.query.schoolId as string);
    if (explicitTenant) {
      req.tenantId = explicitTenant;

      // Vendor Support Access Check:
      // Super administrators must not automatically gain unrestricted access to student records!
      const isStudentPath = req.baseUrl.includes('/students') || req.originalUrl.includes('/api/students');
      if (isStudentPath) {
        const hasAccess = await supportService.hasActiveSupportAccess(req.user.id, explicitTenant);
        if (!hasAccess) {
          return next(
            new AppError(
              'Vendor support access denied: Vendor administrators must have an active authorized support session to access student records.',
              403,
              'SUPPORT_ACCESS_REQUIRED'
            )
          );
        }
      }
    }
    return next();
  }

  // School-scoped users MUST belong to a school
  if (!req.user.schoolId) {
    return next(AppError.forbidden('User does not have an assigned school tenant.'));
  }

  const authenticatedSchoolId = req.user.schoolId.toString();

  // If the client submitted an explicit schoolId in query, params, or body, verify it matches
  const clientProvidedSchoolId =
    (req.headers['x-school-id'] as string) ||
    req.params.schoolId ||
    (req.query.schoolId as string) ||
    (req.body && req.body.schoolId);

  if (clientProvidedSchoolId && clientProvidedSchoolId !== authenticatedSchoolId) {
    return next(
      new AppError(
        'Tenant boundary violation: Client-supplied schoolId does not match your authenticated organization.',
        403,
        'TENANT_MISMATCH'
      )
    );
  }

  // Bind verified tenant ID to request
  req.tenantId = authenticatedSchoolId;

  // Subscription & Licensing mutation guard:
  // If school is suspended or license is expired past grace period, block mutations (POST, PUT, PATCH, DELETE)
  // but allow GET reads, exports, and backups!
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    try {
      const school = await School.findById(authenticatedSchoolId);
      if (school) {
        if (school.status === 'suspended') {
          return next(
            new AppError(
              'School account is suspended. Operational changes are disabled, but data exports remain available.',
              403,
              'LICENSE_SUSPENDED'
            )
          );
        }

        if (school.subscription) {
          const now = new Date();
          const expiry = new Date(school.subscription.expiryDate);
          const graceMs = (school.subscription.gracePeriodDays || 0) * 86400000;

          if (now.getTime() > expiry.getTime() + graceMs) {
            return next(
              new AppError(
                'Subscription license has expired. Modifications are disabled, but data exports and backups remain available.',
                403,
                'LICENSE_EXPIRED'
              )
            );
          }
        }
      }
    } catch (dbErr) {
      // Non-blocking database check fallback
    }
  }

  next();
}

/**
 * Returns a Mongoose filter object ensuring tenant isolation for database queries.
 */
export function getTenantFilter(req: Request): Record<string, unknown> {
  if (req.user?.role === 'super_admin' && !req.tenantId) {
    // Super admin viewing global or unscoped data
    return {};
  }

  if (!req.tenantId) {
    throw AppError.forbidden('Cannot execute tenant query: tenant context is unresolved.');
  }

  return { schoolId: req.tenantId };
}

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@smart-school/shared-types';
import { AppError } from '../utils/appError.js';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return next(
        AppError.forbidden(
          `Access denied. Role '${req.user.role}' does not have sufficient permissions for this resource.`
        )
      );
    }

    next();
  };
}

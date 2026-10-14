import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/appError.js';

interface ValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validateRequest(schemas: ValidationSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error: unknown) {
      const isZod =
        error instanceof ZodError ||
        (error instanceof Error && error.name === 'ZodError') ||
        (typeof error === 'object' && error !== null && 'issues' in error);

      if (isZod) {
        const zodErr = error as ZodError;
        const issues = (zodErr.issues || zodErr.errors || []).map((err) => ({
          field: Array.isArray(err.path) ? err.path.join('.') : String(err.path),
          message: err.message,
        }));
        next(AppError.validation('Request validation failed', issues));
        return;
      }
      next(error);
    }
  };
}

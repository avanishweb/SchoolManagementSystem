import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { ERROR_CODES, ErrorCode } from '@smart-school/shared-utils';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let errorCode: ErrorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected server error occurred. Please try again later.';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError' || err.name === 'ZodError') {
    // Mongoose schema or Zod validation error
    statusCode = 422;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Data validation failed';
    details = err.message;
  } else if ((err as { code?: number }).code === 11000) {
    // Mongoose duplicate key error
    statusCode = 409;
    errorCode = ERROR_CODES.CONFLICT;
    message = 'A resource with this identifier already exists.';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = ERROR_CODES.UNAUTHORIZED;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = ERROR_CODES.UNAUTHORIZED;
    message = 'Authentication token has expired.';
  }

  // Log error (suppress operational noise in tests)
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - 500 Internal Error:`, {
      message: err.message,
      stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
    });
  } else if (env.NODE_ENV !== 'test') {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${statusCode} ${errorCode}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details !== undefined ? { details } : {}),
      ...(env.NODE_ENV !== 'production' && statusCode === 500 ? { stack: err.stack } : {}),
    },
  });
}

export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Cannot ${req.method} ${req.originalUrl} - endpoint not found`,
    },
  });
}

import { ERROR_CODES, ErrorCode } from '@smart-school/shared-utils';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ERROR_CODES.INTERNAL_SERVER_ERROR,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, ERROR_CODES.BAD_REQUEST, details);
  }

  static unauthorized(message: string = 'Authentication required') {
    return new AppError(message, 401, ERROR_CODES.UNAUTHORIZED);
  }

  static forbidden(message: string = 'Access denied: insufficient permissions') {
    return new AppError(message, 403, ERROR_CODES.FORBIDDEN);
  }

  static notFound(message: string = 'Requested resource not found') {
    return new AppError(message, 404, ERROR_CODES.NOT_FOUND);
  }

  static conflict(message: string, details?: unknown) {
    return new AppError(message, 409, ERROR_CODES.CONFLICT, details);
  }

  static validation(message: string, details?: unknown) {
    return new AppError(message, 422, ERROR_CODES.VALIDATION_ERROR, details);
  }

  static tooManyRequests(message: string = 'Too many requests. Please try again later.') {
    return new AppError(message, 429, ERROR_CODES.TOO_MANY_REQUESTS);
  }

  static internal(message: string = 'Internal server error') {
    return new AppError(message, 500, ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}

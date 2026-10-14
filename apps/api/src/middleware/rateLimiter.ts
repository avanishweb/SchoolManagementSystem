import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ERROR_CODES } from '@smart-school/shared-utils';

/**
 * Standard rate limiter for all general API traffic.
 * Protects server resources from abuse and DoS while exempting health checks.
 */
export const standardLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === 'test' ? 10000 : env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Exempt health check routes from rate limiting to prevent orchestrator/monitoring lockouts
    return (
      req.path === '/health' ||
      req.path === '/api/health' ||
      req.originalUrl?.includes('/health') ||
      false
    );
  },
  message: {
    success: false,
    error: {
      code: ERROR_CODES.TOO_MANY_REQUESTS,
      message: 'Too many requests from this IP. Please try again later.',
    },
  },
});

/**
 * Targeted authentication rate limiter for login attempts.
 * Prevents brute-force attacks against user credentials.
 * Only failed attempts (status >= 400) count against the limit (skipSuccessfulRequests: true).
 */
export const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === 'test' ? 1000 : env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.TOO_MANY_REQUESTS,
      message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    },
  },
});


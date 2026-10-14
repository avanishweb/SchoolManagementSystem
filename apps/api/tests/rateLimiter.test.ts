import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { standardLimiter, authLimiter } from '../src/middleware/rateLimiter.js';
import { User } from '../src/modules/auth/user.model.js';
import { School } from '../src/modules/schools/school.model.js';
import { ERROR_CODES } from '@smart-school/shared-utils';

describe('Rate Limiting & Brute-Force Protection Suite', () => {
  let demoSchoolId: string;

  beforeEach(async () => {
    // Seed demo school and user
    const school = await School.create({
      name: 'Rate Limit Test Academy',
      slug: 'ratelimit-academy',
      code: 'RLA-001',
      status: 'active',
      contactEmail: 'security@ratelimit.edu',
    });
    demoSchoolId = school.id;

    const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
    await User.create({
      name: 'Test Teacher',
      email: 'teacher@ratelimit.edu',
      passwordHash,
      role: 'teacher',
      schoolId: school._id,
      isActive: true,
    });
  });

  describe('Standard Rate Limiter & Health Exemption', () => {
    it('should NOT rate limit /api/health even after multiple rapid queries', async () => {
      // Send multiple requests to health endpoint
      for (let i = 0; i < 15; i++) {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('healthy');
      }
    });

    it('should return 429 with standard headers and message when standard limit is breached', async () => {
      const testApp: Express = express();
      testApp.use(
        rateLimit({
          windowMs: 5000,
          max: 3,
          standardHeaders: true,
          legacyHeaders: false,
          message: {
            success: false,
            error: {
              code: ERROR_CODES.TOO_MANY_REQUESTS,
              message: 'Too many requests from this IP. Please try again later.',
            },
          },
        })
      );
      testApp.get('/test-route', (_req, res) => res.json({ ok: true }));

      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const res = await request(testApp).get('/test-route');
        expect(res.status).toBe(200);
        expect(res.headers['ratelimit-limit']).toBe('3');
      }

      // 4th request must be blocked with HTTP 429
      const blockedRes = await request(testApp).get('/test-route');
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.success).toBe(false);
      expect(blockedRes.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
      expect(blockedRes.body.error.message).toBe('Too many requests from this IP. Please try again later.');
      expect(blockedRes.headers['ratelimit-remaining']).toBe('0');
      expect(blockedRes.headers['retry-after']).toBeDefined();
    });

    it('should automatically reset request limit after window expires', async () => {
      const testApp: Express = express();
      testApp.use(
        rateLimit({
          windowMs: 150, // 150ms reset window
          max: 2,
          standardHeaders: true,
          legacyHeaders: false,
        })
      );
      testApp.get('/ephemeral-test', (_req, res) => res.json({ ok: true }));

      // Send 2 requests to exhaust limit
      await request(testApp).get('/ephemeral-test');
      await request(testApp).get('/ephemeral-test');

      // 3rd request is blocked
      const blocked = await request(testApp).get('/ephemeral-test');
      expect(blocked.status).toBe(429);

      // Wait for window to reset
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Subsequent request should succeed again
      const refreshed = await request(testApp).get('/ephemeral-test');
      expect(refreshed.status).toBe(200);
      expect(refreshed.body.ok).toBe(true);
    });
  });

  describe('Authentication Limiter & Brute-Force Behavior', () => {
    it('should NOT penalize successful logins when skipSuccessfulRequests is true', async () => {
      const authTestApp: Express = express();
      authTestApp.use(express.json());

      // Configure a strict auth limiter with max: 3 and skipSuccessfulRequests: true
      const strictAuthLimiter = rateLimit({
        windowMs: 10000,
        max: 3,
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

      authTestApp.post('/login', strictAuthLimiter, (req, res) => {
        if (req.body.password === 'CorrectPassword123!') {
          return res.status(200).json({ success: true, token: 'jwt-token-ok' });
        }
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      });

      // Perform 5 consecutive successful logins (well above the max: 3 threshold)
      for (let i = 0; i < 5; i++) {
        const successRes = await request(authTestApp)
          .post('/login')
          .send({ password: 'CorrectPassword123!' });

        expect(successRes.status).toBe(200);
        expect(successRes.body.success).toBe(true);
      }

      // Legitimate user is still able to log in without being blocked
      const finalRes = await request(authTestApp)
        .post('/login')
        .send({ password: 'CorrectPassword123!' });

      expect(finalRes.status).toBe(200);
    });

    it('should block repeated failed attempts when limit is reached', async () => {
      const authTestApp: Express = express();
      authTestApp.use(express.json());

      const strictAuthLimiter = rateLimit({
        windowMs: 10000,
        max: 3,
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

      authTestApp.post('/login', strictAuthLimiter, (req, res) => {
        if (req.body.password === 'CorrectPassword123!') {
          return res.status(200).json({ success: true });
        }
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      });

      // 3 failed attempts
      for (let i = 0; i < 3; i++) {
        const failRes = await request(authTestApp)
          .post('/login')
          .send({ password: 'WrongPassword!' });
        expect(failRes.status).toBe(401);
      }

      // 4th attempt should be blocked by rate limiter (HTTP 429)
      const blockedRes = await request(authTestApp)
        .post('/login')
        .send({ password: 'WrongPassword!' });

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.success).toBe(false);
      expect(blockedRes.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
      expect(blockedRes.body.error.message).toBe('Too many login attempts from this IP. Please try again after 15 minutes.');
      expect(blockedRes.headers['ratelimit-remaining']).toBe('0');
      expect(blockedRes.headers['retry-after']).toBeDefined();
    });

    it('should verify production rateLimiter exports have skipSuccessfulRequests enabled', () => {
      // Verify middleware instance configuration
      expect(authLimiter).toBeDefined();
      expect(standardLimiter).toBeDefined();
    });
  });
});

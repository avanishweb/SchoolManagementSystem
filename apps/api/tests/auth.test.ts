import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { User } from '../src/modules/auth/user.model.js';
import { School } from '../src/modules/schools/school.model.js';

describe('Authentication & Authorization Flow', () => {
  let demoSchoolId: string;
  let demoStaffUserId: string;
  let demoSuperAdminUserId: string;

  beforeEach(async () => {
    // Create a demo school
    const school = await School.create({
      name: 'Springfield Academy',
      slug: 'springfield-academy',
      code: 'SPA-001',
      status: 'active',
      contactEmail: 'info@springfield.edu',
    });
    demoSchoolId = school.id;

    // Create a staff user
    const staffPasswordHash = await bcrypt.hash('StaffPassword123!', 10);
    const staffUser = await User.create({
      name: 'John Staff',
      email: 'john.staff@springfield.edu',
      passwordHash: staffPasswordHash,
      role: 'staff',
      schoolId: school._id,
      isActive: true,
    });
    demoStaffUserId = staffUser.id;

    // Create a super admin user
    const adminPasswordHash = await bcrypt.hash('SuperAdmin123!', 10);
    const superAdmin = await User.create({
      name: 'Global Admin',
      email: 'admin@platform.com',
      passwordHash: adminPasswordHash,
      role: 'super_admin',
      isActive: true,
    });
    demoSuperAdminUserId = superAdmin.id;
  });

  describe('POST /api/auth/login', () => {
    it('should reject login request with missing or invalid fields (422)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'short' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject login request with non-existent email (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unknown@springfield.edu', password: 'SomePassword123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid email or password');
    });

    it('should reject login request with incorrect password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john.staff@springfield.edu', password: 'WrongPassword999!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid email or password');
    });

    it('should succeed with valid credentials and return user profile and cookies', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john.staff@springfield.edu', password: 'StaffPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('john.staff@springfield.edu');
      expect(res.body.data.user.role).toBe('staff');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Never leak password hash!
      expect(res.body.data.school).toBeDefined();
      expect(res.body.data.school.slug).toBe('springfield-academy');

      // Check cookies set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toContain('access_token=');
      expect(cookieStr).toContain('refresh_token=');
    });
  });

  describe('Protected Routes & RBAC', () => {
    it('GET /api/auth/me should return 401 when no token is supplied', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/auth/me should succeed when valid Bearer token is provided', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john.staff@springfield.edu', password: 'StaffPassword123!' });

      const token = loginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('john.staff@springfield.edu');
    });

    it('GET /api/schools should forbid staff user (403 Forbidden)', async () => {
      const staffLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john.staff@springfield.edu', password: 'StaffPassword123!' });

      const staffToken = staffLogin.body.data.accessToken;

      const res = await request(app)
        .get('/api/schools')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('GET /api/schools should allow super_admin user (200 OK)', async () => {
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@platform.com', password: 'SuperAdmin123!' });

      const adminToken = adminLogin.body.data.accessToken;

      const res = await request(app)
        .get('/api/schools')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { User } from '../src/modules/auth/user.model.js';
import { School } from '../src/modules/schools/school.model.js';
import { Student } from '../src/modules/students/student.model.js';

describe('Student Admission & Records Management (Phase 2)', () => {
  let schoolAId: string;
  let schoolBId: string;
  let schoolAAdminToken: string;
  let schoolATeacherToken: string;
  let schoolBAdminToken: string;

  beforeEach(async () => {
    // 1. Create School A & School B
    const schoolA = await School.create({
      name: 'Oakridge High School',
      slug: 'oakridge-high',
      code: 'OHS-001',
      status: 'active',
    });
    schoolAId = schoolA.id;

    const schoolB = await School.create({
      name: 'St. Jude Academy',
      slug: 'st-jude-academy',
      code: 'SJA-002',
      status: 'active',
    });
    schoolBId = schoolB.id;

    // 2. Create Users for School A
    const passwordHash = await bcrypt.hash('SecurePassword123!', 10);

    const adminUserA = await User.create({
      name: 'Alice Admin',
      email: 'admin@oakridge.edu',
      passwordHash,
      role: 'school_admin',
      schoolId: schoolA._id,
      isActive: true,
    });

    const teacherUserA = await User.create({
      name: 'Timothy Teacher',
      email: 'teacher@oakridge.edu',
      passwordHash,
      role: 'teacher',
      schoolId: schoolA._id,
      isActive: true,
    });

    // 3. Create Admin for School B
    const adminUserB = await User.create({
      name: 'Bob Admin',
      email: 'admin@stjude.edu',
      passwordHash,
      role: 'school_admin',
      schoolId: schoolB._id,
      isActive: true,
    });

    // 4. Authenticate and obtain tokens
    const loginResA = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@oakridge.edu', password: 'SecurePassword123!' });
    schoolAAdminToken = loginResA.body.data.accessToken;

    const teacherLoginA = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@oakridge.edu', password: 'SecurePassword123!' });
    schoolATeacherToken = teacherLoginA.body.data.accessToken;

    const loginResB = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@stjude.edu', password: 'SecurePassword123!' });
    schoolBAdminToken = loginResB.body.data.accessToken;
  });

  const sampleStudentPayload = {
    admissionNumber: 'ADM-2026-0101',
    admissionDate: '2026-08-15',
    academicSession: '2026-2027',
    firstName: 'Benjamin',
    lastName: 'Taylor',
    dateOfBirth: '2011-05-20',
    gender: 'male',
    bloodGroup: 'O+',
    class: 'Grade 10',
    section: 'A',
    rollNumber: '101',
    email: 'benjamin.taylor@student.demo',
    phone: '+1 (555) 234-5501',
    currentAddress: {
      street: '12 Blossom Lane',
      city: 'Portland',
      state: 'OR',
      postalCode: '97201',
      country: 'US',
    },
    guardian: {
      guardianName: 'Jonathan Taylor',
      guardianRelation: 'Father',
      guardianPhone: '+1 (555) 234-5500',
      guardianEmail: 'jonathan.taylor@email.demo',
      guardianOccupation: 'Software Developer',
    },
    status: 'active',
  };

  describe('Student Admission (POST /api/students)', () => {
    it('should successfully admit a new student with valid data', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolAAdminToken}`)
        .send(sampleStudentPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Benjamin');
      expect(res.body.data.admissionNumber).toBe('ADM-2026-0101');
      expect(res.body.data.schoolId).toBe(schoolAId);

      // Verify persistence in DB
      const inDb = await Student.findOne({ admissionNumber: 'ADM-2026-0101' });
      expect(inDb).not.toBeNull();
      expect(inDb?.firstName).toBe('Benjamin');
      expect(inDb?.schoolId.toString()).toBe(schoolAId);
    });

    it('should automatically generate an admission number when omitted', async () => {
      const { admissionNumber, ...withoutAdmNumber } = sampleStudentPayload;

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolAAdminToken}`)
        .send(withoutAdmNumber);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admissionNumber).toMatch(/^ADM-2026-\d{4}$/);
    });

    it('should reject student admission with missing required fields (422)', async () => {
      const invalidPayload = {
        firstName: 'John',
        // missing lastName, dateOfBirth, gender, class, section, guardian
      };

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolAAdminToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should prevent duplicate admission numbers within the same school (409 Conflict)', async () => {
      // Admit first student
      await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolAAdminToken}`)
        .send(sampleStudentPayload);

      // Attempt to admit second student with the exact same admission number in School A
      const duplicateRes = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolAAdminToken}`)
        .send({
          ...sampleStudentPayload,
          firstName: 'Another',
          lastName: 'Student',
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.success).toBe(false);
      expect(duplicateRes.body.error.message).toContain('already registered in this school');
    });

    it('should permit identical admission numbers across different schools (Multi-tenant Isolation)', async () => {
      // Admit student with ADM-2026-0101 in School A
      const resA = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolAAdminToken}`)
        .send(sampleStudentPayload);
      expect(resA.status).toBe(201);

      // Admit student with the same admission number ADM-2026-0101 in School B
      const resB = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolBAdminToken}`)
        .send({
          ...sampleStudentPayload,
          firstName: 'School B Student',
        });

      expect(resB.status).toBe(201);
      expect(resB.body.data.schoolId).toBe(schoolBId);
      expect(resB.body.data.admissionNumber).toBe('ADM-2026-0101');
    });
  });

  describe('Student Directory & Filtering (GET /api/students)', () => {
    beforeEach(async () => {
      // Seed 3 students in School A
      await Student.create([
        {
          ...sampleStudentPayload,
          schoolId: schoolAId,
          admissionNumber: 'ADM-2026-0001',
          firstName: 'Liam',
          lastName: 'Smith',
          class: 'Grade 10',
          section: 'A',
          status: 'active',
        },
        {
          ...sampleStudentPayload,
          schoolId: schoolAId,
          admissionNumber: 'ADM-2026-0002',
          firstName: 'Emma',
          lastName: 'Johnson',
          class: 'Grade 10',
          section: 'B',
          status: 'active',
        },
        {
          ...sampleStudentPayload,
          schoolId: schoolAId,
          admissionNumber: 'ADM-2026-0003',
          firstName: 'Olivia',
          lastName: 'Brown',
          class: 'Grade 9',
          section: 'A',
          status: 'inactive',
        },
      ]);

      // Seed 1 student in School B
      await Student.create({
        ...sampleStudentPayload,
        schoolId: schoolBId,
        admissionNumber: 'ADM-2026-0001',
        firstName: 'Mason',
        lastName: 'Davis',
        class: 'Grade 10',
      });
    });

    it('should list only School A students for School A admin with pagination', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${schoolAAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(3);
      expect(res.body.data.pagination.total).toBe(3);

      // Verify no School B student leaked
      const names = res.body.data.items.map((s: any) => s.firstName);
      expect(names).not.toContain('Mason');
    });

    it('should filter students by class and status', async () => {
      const res = await request(app)
        .get('/api/students?class=Grade+10&status=active')
        .set('Authorization', `Bearer ${schoolAAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.items.every((s: any) => s.class === 'Grade 10' && s.status === 'active')).toBe(true);
    });

    it('should search students by keyword', async () => {
      const res = await request(app)
        .get('/api/students?search=Emma')
        .set('Authorization', `Bearer ${schoolAAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].firstName).toBe('Emma');
    });
  });

  describe('Student Profile & Status Management (GET, PUT, PATCH /api/students/:id)', () => {
    let studentAId: string;

    beforeEach(async () => {
      const student = await Student.create({
        ...sampleStudentPayload,
        schoolId: schoolAId,
        admissionNumber: 'ADM-2026-0050',
      });
      studentAId = student.id;
    });

    it('should retrieve student details by ID', async () => {
      const res = await request(app)
        .get(`/api/students/${studentAId}`)
        .set('Authorization', `Bearer ${schoolAAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(studentAId);
      expect(res.body.data.firstName).toBe('Benjamin');
      expect(res.body.data.guardian.guardianName).toBe('Jonathan Taylor');
    });

    it('should update student profile fields', async () => {
      const res = await request(app)
        .put(`/api/students/${studentAId}`)
        .set('Authorization', `Bearer ${schoolAAdminToken}`)
        .send({
          firstName: 'Ben',
          class: 'Grade 11',
          section: 'B',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('Ben');
      expect(res.body.data.class).toBe('Grade 11');
      expect(res.body.data.section).toBe('B');

      const updated = await Student.findById(studentAId);
      expect(updated?.firstName).toBe('Ben');
      expect(updated?.class).toBe('Grade 11');
    });

    it('should update student status via PATCH /api/students/:id/status', async () => {
      const res = await request(app)
        .patch(`/api/students/${studentAId}/status`)
        .set('Authorization', `Bearer ${schoolAAdminToken}`)
        .send({ status: 'transferred', reason: 'Relocated to another district' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('transferred');

      const updated = await Student.findById(studentAId);
      expect(updated?.status).toBe('transferred');
      expect(updated?.notes).toContain('Relocated to another district');
    });
  });

  describe('Security & Multi-Tenant Isolation Enforcement', () => {
    let studentAId: string;

    beforeEach(async () => {
      const student = await Student.create({
        ...sampleStudentPayload,
        schoolId: schoolAId,
        admissionNumber: 'ADM-2026-9999',
      });
      studentAId = student.id;
    });

    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/students');
      expect(res.status).toBe(401);
    });

    it('should deny School B admin from viewing School A student (404/403 Cross-Tenant Isolation)', async () => {
      const res = await request(app)
        .get(`/api/students/${studentAId}`)
        .set('Authorization', `Bearer ${schoolBAdminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not found in this institution');
    });

    it('should deny School B admin from updating School A student (404/403 Cross-Tenant Isolation)', async () => {
      const res = await request(app)
        .put(`/api/students/${studentAId}`)
        .set('Authorization', `Bearer ${schoolBAdminToken}`)
        .send({ firstName: 'Hacked Name' });

      expect(res.status).toBe(404);
      const student = await Student.findById(studentAId);
      expect(student?.firstName).toBe('Benjamin'); // Data untouched
    });

    it('should forbid teachers from creating student admissions (403 Forbidden RBAC)', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolATeacherToken}`)
        .send(sampleStudentPayload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow teachers to view student directory (200 OK)', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${schoolATeacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

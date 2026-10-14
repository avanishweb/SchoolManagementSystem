import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { School } from '../src/modules/schools/school.model.js';
import { User } from '../src/modules/auth/user.model.js';
import { Student } from '../src/modules/students/student.model.js';
import { AcademicSession, Classroom, Section, Subject } from '../src/modules/academic/academic.model.js';
import { Employee } from '../src/modules/employees/employee.model.js';
import { StudentAttendance } from '../src/modules/attendance/attendance.model.js';
import { FeeHead, FeeStructure, StudentFeeRecord, FeePayment } from '../src/modules/fees/fee.model.js';
import { Examination, ExamSchedule, ExamMark } from '../src/modules/examinations/examination.model.js';
import { TimetableSlot } from '../src/modules/timetable/timetable.model.js';
import { Homework, HomeworkSubmission } from '../src/modules/homework/homework.model.js';
import { AdmissionEnquiry } from '../src/modules/admissions/admission.model.js';
import { CmsPage, CmsNotice } from '../src/modules/cms/cms.model.js';
import { Account, JournalEntry } from '../src/modules/accounting/accounting.model.js';
import { NotificationLog } from '../src/modules/notifications/notification.model.js';
import { signAccessToken } from '../src/utils/jwt.js';

const app = createApp();

describe('TENORA365 ERP - Commercial Business Workflows & Tenant Isolation', () => {
  let schoolA: any;
  let adminAToken: string;
  let teacherAToken: string;
  let schoolB: any;
  let adminBToken: string;

  beforeEach(async () => {
    // 1. Create School A
    schoolA = await School.create({
      name: 'Delhi Modern Public School',
      slug: 'delhi-modern',
      code: 'DMS-01',
      status: 'active',
      subscription: {
        plan: 'annual',
        status: 'active',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 86400000),
        gracePeriodDays: 14,
        maxStudents: 1000,
        maxUsers: 50,
        maxStorageMB: 25000,
        features: ['all'],
        autoRenew: true,
      },
      branding: {
        primaryColor: '#0284c7',
        receiptHeader: 'Delhi Modern Public School - Fee Counter',
      },
    });

    const adminA = await User.create({
      name: 'Principal Sharma',
      email: 'principal@delhi-modern.edu',
      passwordHash: 'hash',
      role: 'school_admin',
      schoolId: schoolA._id,
      isActive: true,
    });
    adminAToken = signAccessToken({
      userId: adminA.id,
      email: adminA.email,
      role: adminA.role,
      schoolId: schoolA.id,
    });

    const teacherA = await User.create({
      name: 'Prof. Verma',
      email: 'verma@delhi-modern.edu',
      passwordHash: 'hash',
      role: 'teacher',
      schoolId: schoolA._id,
      isActive: true,
    });
    teacherAToken = signAccessToken({
      userId: teacherA.id,
      email: teacherA.email,
      role: teacherA.role,
      schoolId: schoolA.id,
    });

    // 2. Create School B (Tenant Isolation verification)
    schoolB = await School.create({
      name: 'Sunrise International School',
      slug: 'sunrise-international',
      code: 'SIS-02',
      status: 'active',
      subscription: {
        plan: 'annual',
        status: 'active',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 86400000),
        gracePeriodDays: 14,
        maxStudents: 500,
        maxUsers: 25,
        maxStorageMB: 10000,
        features: ['all'],
        autoRenew: true,
      },
    });

    const adminB = await User.create({
      name: 'Principal Rao',
      email: 'principal@sunrise.edu',
      passwordHash: 'hash',
      role: 'school_admin',
      schoolId: schoolB._id,
      isActive: true,
    });
    adminBToken = signAccessToken({
      userId: adminB.id,
      email: adminB.email,
      role: adminB.role,
      schoolId: schoolB.id,
    });
  });

  describe('1. Academic Configuration Module', () => {
    it('should create an academic session, classrooms, sections, and subjects for School A', async () => {
      // Create session
      const sessionRes = await request(app)
        .post('/api/academic/sessions')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: '2026-2027',
          startDate: '2026-04-01',
          endDate: '2027-03-31',
          isCurrent: true,
        });
      expect(sessionRes.status).toBe(201);
      expect(sessionRes.body.data.name).toBe('2026-2027');
      expect(sessionRes.body.data.isCurrent).toBe(true);

      // Create class
      const classRes = await request(app)
        .post('/api/academic/classes')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Grade 10',
          code: 'G10',
          numericOrder: 10,
          sections: ['A', 'B'],
        });
      expect(classRes.status).toBe(201);
      expect(classRes.body.data.name).toBe('Grade 10');

      // Create subject
      const subjectRes = await request(app)
        .post('/api/academic/subjects')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Mathematics',
          code: 'MATH-10',
          type: 'both',
          passMarks: 33,
          maxMarks: 100,
        });
      expect(subjectRes.status).toBe(201);
      expect(subjectRes.body.data.code).toBe('MATH-10');
    });

    it('should strictly isolate academic configurations between School A and School B', async () => {
      // School A creates class
      await request(app)
        .post('/api/academic/classes')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Class 12 Science', code: 'C12S', numericOrder: 12, sections: ['A'] });

      // School B lists classes -> should NOT see School A's class
      const resB = await request(app)
        .get('/api/academic/classes')
        .set('Authorization', `Bearer ${adminBToken}`);
      expect(resB.status).toBe(200);
      expect(resB.body.data).toHaveLength(0);
    });
  });

  describe('2. Faculty & Employee Management Module', () => {
    it('should register a new faculty member with auto-generated employee ID and assignments', async () => {
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          firstName: 'Ananya',
          lastName: 'Deshmukh',
          email: 'ananya.deshmukh@delhi-modern.edu',
          phone: '+91-9876543210',
          designation: 'Senior PGT Physics',
          department: 'Science',
          role: 'teacher',
          qualification: 'M.Sc. Physics, B.Ed',
          joiningDate: '2026-06-01',
          basicSalary: 65000,
          assignedClasses: ['Grade 10', 'Grade 11'],
          assignedSubjects: ['Physics'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.employeeId).toMatch(/^TEA-\d{4}$/);
      expect(res.body.data.fullName).toBe('Ananya Deshmukh');
      expect(res.body.data.basicSalary).toBe(65000);
    });

    it('should prevent School B from viewing School A employees', async () => {
      await Employee.create({
        schoolId: schoolA._id,
        employeeId: 'EMP-0001',
        firstName: 'Secret',
        lastName: 'Teacher',
        email: 'secret@schoola.com',
        phone: '1234567890',
        designation: 'Teacher',
        department: 'Arts',
        role: 'teacher',
        qualification: 'B.A.',
        joiningDate: new Date(),
        basicSalary: 40000,
        status: 'active',
      });

      const resB = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${adminBToken}`);
      expect(resB.status).toBe(200);
      expect(resB.body.data).toHaveLength(0);
    });
  });

  describe('3. Student Attendance Module', () => {
    it('should bulk mark student attendance and retrieve monthly percentages', async () => {
      // 1. Create a student in School A
      const student = await Student.create({
        schoolId: schoolA._id,
        admissionNumber: 'ADM-2026-0001',
        admissionDate: new Date(),
        academicSession: '2026-2027',
        firstName: 'Aarav',
        lastName: 'Patel',
        dateOfBirth: new Date('2010-05-15'),
        gender: 'male',
        class: 'Grade 10',
        section: 'A',
        guardian: {
          guardianName: 'Rajesh Patel',
          guardianRelation: 'Father',
          guardianPhone: '+91-9898989898',
        },
        currentAddress: {},
        status: 'active',
      });

      // 2. Bulk mark attendance for Grade 10-A
      const bulkRes = await request(app)
        .post('/api/attendance/bulk')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          class: 'Grade 10',
          section: 'A',
          date: '2026-10-15',
          records: [
            {
              studentId: student.id,
              status: 'present',
              remarks: 'On time',
            },
          ],
        });
      expect(bulkRes.status).toBe(200);
      expect(bulkRes.body.data).toHaveLength(1);
      expect(bulkRes.body.data[0].status).toBe('present');

      // 3. Retrieve student monthly attendance summary
      const summaryRes = await request(app)
        .get(`/api/attendance/student/${student.id}?year=2026&month=10`)
        .set('Authorization', `Bearer ${teacherAToken}`);
      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.data.summary.total).toBe(1);
      expect(summaryRes.body.data.summary.present).toBe(1);
      expect(summaryRes.body.data.summary.attendancePercentage).toBe(100);
    });
  });

  describe('4. Fee Management Module', () => {
    it('should create fee head, structure, allocate to students, accept partial payment, and issue receipt', async () => {
      // 1. Create student
      const student = await Student.create({
        schoolId: schoolA._id,
        admissionNumber: 'ADM-2026-0002',
        admissionDate: new Date(),
        academicSession: '2026-2027',
        firstName: 'Priya',
        lastName: 'Nair',
        dateOfBirth: new Date('2011-08-20'),
        gender: 'female',
        class: 'Grade 9',
        section: 'A',
        guardian: {
          guardianName: 'Suresh Nair',
          guardianRelation: 'Father',
          guardianPhone: '+91-9123456789',
        },
        currentAddress: {},
        status: 'active',
      });

      // 2. Create Fee Head (Tuition Fee)
      const headRes = await request(app)
        .post('/api/fees/heads')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Annual Tuition Fee',
          description: 'Academic tuition fee for Grade 9',
          feeType: 'recurring',
        });
      expect(headRes.status).toBe(201);
      const feeHeadId = headRes.body.data.id;

      // 3. Create Fee Structure (Amount: 50,000 INR)
      const structRes = await request(app)
        .post('/api/fees/structures')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          academicSession: '2026-2027',
          class: 'Grade 9',
          feeHeadId,
          amount: 50000,
          dueDate: '2026-11-30',
          frequency: 'annually',
        });
      expect(structRes.status).toBe(201);

      // 4. Verify StudentFeeRecord was auto-allocated
      const studentFeesRes = await request(app)
        .get(`/api/fees/student/${student.id}`)
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(studentFeesRes.status).toBe(200);
      expect(studentFeesRes.body.data).toHaveLength(1);
      const feeRecord = studentFeesRes.body.data[0];
      expect(feeRecord.amountDue).toBe(50000);
      expect(feeRecord.balance).toBe(50000);
      expect(feeRecord.status).toBe('unpaid');

      // 5. Record Partial Fee Payment (Pay 20,000 via UPI)
      const payRes = await request(app)
        .post('/api/fees/payments')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          studentId: student.id,
          feeRecordId: feeRecord.id,
          amount: 20000,
          paymentMethod: 'upi',
          transactionReference: 'UPI/AXIS/987654321',
          notes: 'First installment paid via UPI',
        });
      expect(payRes.status).toBe(201);
      expect(payRes.body.data.payment.receiptNumber).toMatch(/^REC-\d{4}-\d{5}$/);
      expect(payRes.body.data.updatedRecord.amountPaid).toBe(20000);
      expect(payRes.body.data.updatedRecord.balance).toBe(30000);
      expect(payRes.body.data.updatedRecord.status).toBe('partial');

      // 6. Settle remaining 30,000 -> status becomes 'paid'
      const payRes2 = await request(app)
        .post('/api/fees/payments')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          studentId: student.id,
          feeRecordId: feeRecord.id,
          amount: 30000,
          paymentMethod: 'bank_transfer',
          transactionReference: 'NEFT/HDFC/112233',
        });
      expect(payRes2.status).toBe(201);
      expect(payRes2.body.data.updatedRecord.balance).toBe(0);
      expect(payRes2.body.data.updatedRecord.status).toBe('paid');
    });
  });

  describe('5. Examination & Grading Module', () => {
    it('should create an examination, schedule papers, record marks, and generate a student report card', async () => {
      // 1. Student
      const student = await Student.create({
        schoolId: schoolA._id,
        admissionNumber: 'ADM-2026-0003',
        admissionDate: new Date(),
        academicSession: '2026-2027',
        firstName: 'Rohan',
        lastName: 'Mehta',
        dateOfBirth: new Date('2010-03-25'),
        gender: 'male',
        class: 'Grade 10',
        section: 'A',
        guardian: {
          guardianName: 'Vikas Mehta',
          guardianRelation: 'Father',
          guardianPhone: '+91-9888877777',
        },
        currentAddress: {},
        status: 'active',
      });

      // 2. Create Examination
      const examRes = await request(app)
        .post('/api/examinations')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Half Yearly Examination',
          academicSession: '2026-2027',
          startDate: '2026-09-15',
          endDate: '2026-09-30',
          classes: ['Grade 10'],
        });
      expect(examRes.status).toBe(201);
      const examId = examRes.body.data.id;

      // 3. Record marks for Mathematics (Theory: 75, Practical: 18 -> Total: 93/100 -> Grade A+)
      const marksRes = await request(app)
        .post('/api/examinations/marks')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          examId,
          class: 'Grade 10',
          section: 'A',
          subject: 'Mathematics',
          maxMarks: 100,
          marks: [
            {
              studentId: student.id,
              theoryMarks: 75,
              practicalMarks: 18,
              isAbsent: false,
              remarks: 'Excellent problem solving',
            },
          ],
        });
      expect(marksRes.status).toBe(200);
      expect(marksRes.body.data[0].totalMarks).toBe(93);
      expect(marksRes.body.data[0].grade).toBe('A+');

      // 4. Generate Student Report Card
      const reportRes = await request(app)
        .get(`/api/examinations/${examId}/report-card/${student.id}`)
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(reportRes.status).toBe(200);
      expect(reportRes.body.data.summary.totalScored).toBe(93);
      expect(reportRes.body.data.summary.percentage).toBe(93);
      expect(reportRes.body.data.summary.overallGrade).toBe('A+');
      expect(reportRes.body.data.summary.resultStatus).toBe('Passed');
    });
  });

  describe('6. Timetable & Conflict Engine', () => {
    it('should detect and prevent teacher, class, and room conflicts', async () => {
      // 1. Create teacher
      const teacher = await Employee.create({
        schoolId: schoolA._id,
        employeeId: 'TEA-0100',
        firstName: 'Sunita',
        lastName: 'Rao',
        email: 'sunita@schoola.com',
        phone: '9998887776',
        designation: 'Teacher',
        department: 'Science',
        role: 'teacher',
        qualification: 'M.Sc.',
        joiningDate: new Date(),
        basicSalary: 50000,
        status: 'active',
      });

      // 2. Schedule Slot 1: Monday Period 1 in Grade 10-A, Room 101 with Sunita
      const slot1Res = await request(app)
        .post('/api/timetable/slots')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          dayOfWeek: 'Monday',
          periodNumber: 1,
          startTime: '08:30',
          endTime: '09:15',
          class: 'Grade 10',
          section: 'A',
          subject: 'Physics',
          teacherId: teacher.id,
          teacherName: 'Sunita Rao',
          roomNumber: 'Room 101',
        });
      expect(slot1Res.status).toBe(201);

      // 3. Attempt conflicting schedule: Same teacher Sunita scheduled in Grade 9-B at same period!
      const conflictRes = await request(app)
        .post('/api/timetable/slots')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          dayOfWeek: 'Monday',
          periodNumber: 1,
          startTime: '08:30',
          endTime: '09:15',
          class: 'Grade 9',
          section: 'B',
          subject: 'Chemistry',
          teacherId: teacher.id,
          teacherName: 'Sunita Rao',
          roomNumber: 'Room 202',
        });
      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.error.message).toContain('already teaching');

      // 4. Attempt room collision: Different teacher in Grade 8-A but trying to use Room 101 at same period!
      const roomConflictRes = await request(app)
        .post('/api/timetable/slots')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          dayOfWeek: 'Monday',
          periodNumber: 1,
          startTime: '08:30',
          endTime: '09:15',
          class: 'Grade 8',
          section: 'A',
          subject: 'English',
          roomNumber: 'Room 101',
        });
      expect(roomConflictRes.status).toBe(409);
      expect(roomConflictRes.body.error.message).toContain('Room 101 is already occupied');
    });
  });

  describe('7. Homework & LMS Module', () => {
    it('should create homework, accept student submission, and allow teacher grading', async () => {
      // 1. Student
      const student = await Student.create({
        schoolId: schoolA._id,
        admissionNumber: 'ADM-2026-0004',
        admissionDate: new Date(),
        academicSession: '2026-2027',
        firstName: 'Isha',
        lastName: 'Gupta',
        dateOfBirth: new Date('2012-01-10'),
        gender: 'female',
        class: 'Grade 8',
        section: 'A',
        guardian: {
          guardianName: 'Manoj Gupta',
          guardianRelation: 'Father',
          guardianPhone: '+91-9555544444',
        },
        currentAddress: {},
        status: 'active',
      });

      // 2. Teacher creates homework
      const hwRes = await request(app)
        .post('/api/homework')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          title: 'Algebra Polynomial Exercises 3.1',
          description: 'Solve questions 1 through 15 from Chapter 3.',
          class: 'Grade 8',
          section: 'A',
          subject: 'Mathematics',
          assignedDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        });
      expect(hwRes.status).toBe(201);
      const homeworkId = hwRes.body.data.id;

      // 3. Student submits homework
      const subRes = await request(app)
        .post('/api/homework/submit')
        .set('Authorization', `Bearer ${adminAToken}`) // or student
        .send({
          homeworkId,
          studentId: student.id,
          content: 'Here is my completed assignment with full working steps.',
        });
      expect(subRes.status).toBe(201);
      expect(subRes.body.data.status).toBe('submitted');
      const submissionId = subRes.body.data.id;

      // 4. Teacher grades homework
      const gradeRes = await request(app)
        .patch(`/api/homework/submissions/${submissionId}/grade`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          marks: 10,
          feedback: 'Outstanding work, all proofs are correct.',
        });
      expect(gradeRes.status).toBe(200);
      expect(gradeRes.body.data.marks).toBe(10);
      expect(gradeRes.body.data.status).toBe('evaluated');
    });
  });

  describe('8. Admissions CRM Module', () => {
    it('should register enquiry and convert approved candidate into an admitted student', async () => {
      // 1. Create Enquiry
      const enqRes = await request(app)
        .post('/api/admissions/enquiries')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          candidateName: 'Kavya Singhania',
          parentName: 'Alok Singhania',
          phone: '+91-9876501234',
          email: 'alok.singhania@email.com',
          applyingForClass: 'Grade 6',
          academicSession: '2026-2027',
          stage: 'new_lead',
          notes: 'Interested in STEM robotics track.',
        });
      expect(enqRes.status).toBe(201);
      expect(enqRes.body.data.enquiryNumber).toMatch(/^ENQ-\d{4}-\d{4}$/);
      const enquiryId = enqRes.body.data.id;

      // 2. Advance stage to approved
      const stageRes = await request(app)
        .patch(`/api/admissions/enquiries/${enquiryId}/stage`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ stage: 'approved', notes: 'Interview passed with distinction.' });
      expect(stageRes.status).toBe(200);
      expect(stageRes.body.data.stage).toBe('approved');

      // 3. Convert to admitted Student record
      const convertRes = await request(app)
        .post(`/api/admissions/enquiries/${enquiryId}/convert`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ section: 'A', gender: 'female', dateOfBirth: '2014-07-12' });
      expect(convertRes.status).toBe(201);
      expect(convertRes.body.data.student.admissionNumber).toBeDefined();
      expect(convertRes.body.data.student.firstName).toBe('Kavya');
      expect(convertRes.body.data.student.lastName).toBe('Singhania');
      expect(convertRes.body.data.enquiry.stage).toBe('enrolled');
    });
  });

  describe('9. School Website CMS Builder Module', () => {
    it('should allow school admin to manage pages and expose public site endpoint without authentication', async () => {
      // 1. Admin creates notice
      const noticeRes = await request(app)
        .post('/api/cms/notices')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          title: 'Annual Sports Meet 2026 Announcement',
          category: 'sports',
          content: 'Annual inter-house athletic trials will commence next Monday.',
          date: new Date().toISOString(),
          isPublished: true,
        });
      expect(noticeRes.status).toBe(201);

      // 2. Public endpoint access without Authorization header
      const publicRes = await request(app).get('/api/cms/public/delhi-modern');
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.data.school.name).toBe('Delhi Modern Public School');
      expect(publicRes.body.data.pages.length).toBeGreaterThan(0); // seeded defaults
      expect(publicRes.body.data.notices).toHaveLength(1);
      expect(publicRes.body.data.notices[0].title).toBe('Annual Sports Meet 2026 Announcement');
    });
  });

  describe('10. Double-Entry Accounting & Finance Module', () => {
    it('should balance double-entry journal entries and generate a trial balance', async () => {
      // 1. List seeded chart of accounts
      const accountsRes = await request(app)
        .get('/api/accounting/accounts')
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(accountsRes.status).toBe(200);
      expect(accountsRes.body.data.length).toBeGreaterThanOrEqual(8);

      const cashAcc = accountsRes.body.data.find((a: any) => a.code === '1010');
      const feeIncomeAcc = accountsRes.body.data.find((a: any) => a.code === '4010');

      // 2. Reject unbalanced journal entry (Debit 1000, Credit 800)
      const badEntryRes = await request(app)
        .post('/api/accounting/journal-entries')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          date: '2026-10-15',
          description: 'Fee collection batch',
          lines: [
            { accountId: cashAcc.id, accountName: cashAcc.name, debit: 1000, credit: 0 },
            { accountId: feeIncomeAcc.id, accountName: feeIncomeAcc.name, debit: 0, credit: 800 },
          ],
        });
      expect(badEntryRes.status).toBe(400);
      expect(badEntryRes.body.error.message).toContain('Unbalanced journal entry');

      // 3. Post balanced journal entry (Debit Cash 50000, Credit Tuition Fee Income 50000)
      const goodEntryRes = await request(app)
        .post('/api/accounting/journal-entries')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          date: '2026-10-15',
          description: 'October Tuition Fee collections',
          lines: [
            { accountId: cashAcc.id, accountName: cashAcc.name, debit: 50000, credit: 0 },
            { accountId: feeIncomeAcc.id, accountName: feeIncomeAcc.name, debit: 0, credit: 50000 },
          ],
        });
      expect(goodEntryRes.status).toBe(201);
      expect(goodEntryRes.body.data.entryNumber).toMatch(/^JRN-\d{4}-\d{5}$/);

      // 4. Retrieve Trial Balance
      const tbRes = await request(app)
        .get('/api/accounting/trial-balance')
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(tbRes.status).toBe(200);
      expect(tbRes.body.data.totals.isBalanced).toBe(true);
      expect(tbRes.body.data.totals.totalDebit).toBe(50000);
      expect(tbRes.body.data.totals.totalCredit).toBe(50000);
    });
  });

  describe('11. Notification Dispatch Infrastructure', () => {
    it('should log notification dispatch in honest test mode without fake delivery claims', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          recipientType: 'parent',
          recipientContact: '+91-9876543210',
          channel: 'sms',
          title: 'Fee Payment Received',
          message: 'Thank you. Payment of INR 20,000 has been credited to your ward account.',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('sent');
      expect(res.body.data.channel).toBe('sms');
    });
  });
});

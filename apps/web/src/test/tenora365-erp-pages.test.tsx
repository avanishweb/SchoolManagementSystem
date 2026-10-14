import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TimetableSchedulerPage } from '../pages/timetable/TimetableSchedulerPage.js';
import { HomeworkPage } from '../pages/homework/HomeworkPage.js';
import { AdmissionsCrmPage } from '../pages/crm/AdmissionsCrmPage.js';
import { SchoolWebsiteCmsPage } from '../pages/cms/SchoolWebsiteCmsPage.js';
import { AccountingFinancePage } from '../pages/accounting/AccountingFinancePage.js';
import { FeeManagementPage } from '../pages/fees/FeeManagementPage.js';
import { ExaminationPage } from '../pages/examinations/ExaminationPage.js';
import { AcademicConfigPage } from '../pages/academics/AcademicConfigPage.js';

// Mock auth hook
vi.mock('../hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      name: 'Principal Ramesh',
      email: 'principal@delhimodern.edu',
      role: 'school_admin',
    },
    school: {
      id: 'school-1',
      name: 'Delhi Modern Public School',
      slug: 'delhi-modern',
    },
  }),
}));

// Mock studentService
vi.mock('../services/studentService.js', () => ({
  studentService: {
    getStudents: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'st1',
          fullName: 'Aarav Patel',
          admissionNumber: 'ADM-2026-001',
          class: 'Grade 10',
          section: 'A',
          rollNumber: '1',
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    }),
  },
}));

// Mock erpService
vi.mock('../services/erpService.js', () => ({
  erpService: {
    getClasses: vi.fn().mockResolvedValue({ data: [{ id: 'c1', name: 'Class 10', code: 'C10' }] }),
    getSections: vi.fn().mockResolvedValue({ data: [{ id: 's1', name: 'A' }] }),
    getTimetable: vi.fn().mockResolvedValue({
      data: [
        {
          _id: 't1',
          dayOfWeek: 'Monday',
          periodNumber: 1,
          startTime: '09:00',
          endTime: '09:45',
          subject: 'Mathematics',
          teacherName: 'Sunita Sharma',
          roomNumber: 'Room 101',
        },
      ],
    }),
    checkTimetableConflict: vi.fn().mockResolvedValue({ data: { conflict: false } }),
    createTimetableSlot: vi.fn().mockResolvedValue({ data: { _id: 't2' } }),
    getHomework: vi.fn().mockResolvedValue({
      data: [
        {
          _id: 'hw1',
          title: 'Quadratic Equations Exercise 4.1',
          subject: 'Mathematics',
          class: 'Class 10',
          section: 'A',
          description: 'Solve questions 1 through 10 from NCERT textbook.',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          maxMarks: 20,
        },
      ],
    }),
    getHomeworkSubmissions: vi.fn().mockResolvedValue({ data: [] }),
    getEnquiries: vi.fn().mockResolvedValue({
      data: [
        {
          _id: 'enq1',
          studentName: 'Aarav Patel',
          parentName: 'Deepak Patel',
          parentPhone: '9876543210',
          targetClass: 'Class 10',
          stage: 'INQUIRY',
          leadSource: 'Walk-in',
        },
      ],
    }),
    getCmsPages: vi.fn().mockResolvedValue({
      data: [
        {
          _id: 'page1',
          title: 'About Our School',
          slug: 'about-us',
          content: 'Founded in 1985 with high academic standards.',
          isPublished: true,
        },
      ],
    }),
    getCmsNotices: vi.fn().mockResolvedValue({
      data: [
        {
          _id: 'not1',
          title: 'Sports Day 2026',
          content: 'Annual sports day will be held on December 15th.',
          category: 'SPORTS',
          priority: 'HIGH',
        },
      ],
    }),
    getPublicSite: vi.fn().mockResolvedValue({ data: { schoolName: 'Delhi Modern Public School' } }),
    getAccounts: vi.fn().mockResolvedValue({
      data: [
        { _id: 'acc1', code: '1001', name: 'Cash in Hand', type: 'ASSET', balance: 50000 },
        { _id: 'acc2', code: '3001', name: 'Tuition Fee Revenue', type: 'INCOME', balance: 50000 },
      ],
    }),
    getJournalEntries: vi.fn().mockResolvedValue({ data: [] }),
    getTrialBalance: vi.fn().mockResolvedValue({
      data: {
        isBalanced: true,
        totalDebits: 50000,
        totalCredits: 50000,
        accounts: [],
      },
    }),
    getFeeHeads: vi.fn().mockResolvedValue({ data: [{ id: 'fh1', name: 'Tuition Fee', feeType: 'recurring' }] }),
    getFeeStructures: vi.fn().mockResolvedValue({ data: [] }),
    getFeeDefaulters: vi.fn().mockResolvedValue({ data: [] }),
    getFeePayments: vi.fn().mockResolvedValue({ data: [] }),
    getExams: vi.fn().mockResolvedValue({ data: [{ id: 'ex1', name: 'Mid-Term Examinations', academicSession: '2026-27' }] }),
    getExamSchedules: vi.fn().mockResolvedValue({ data: [] }),
    getSessions: vi.fn().mockResolvedValue({ data: [{ id: 'ses1', name: '2026-2027', isCurrent: true }] }),
    getSubjects: vi.fn().mockResolvedValue({ data: [{ id: 'sub1', name: 'Mathematics', code: 'MATH' }] }),
  },
}));

describe('TENORA365 Commercial ERP Modules Frontend Suite', () => {
  it('renders Timetable Scheduler with period slots and collision engine badge', async () => {
    render(
      <MemoryRouter>
        <TimetableSchedulerPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Class Schedules & Periods/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule Period/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
      expect(screen.getByText(/Sunita Sharma/i)).toBeInTheDocument();
    });
  });

  it('renders Homework Page with assignment cards and turn-in action', async () => {
    render(
      <MemoryRouter>
        <HomeworkPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Homework & Assignments/i)).toBeInTheDocument();
    expect(screen.getByText(/New Assignment/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Quadratic Equations Exercise 4.1/i)).toBeInTheDocument();
      expect(screen.getByText(/Turn In/i)).toBeInTheDocument();
    });
  });

  it('renders Admissions CRM pipeline with lead conversion metrics', async () => {
    render(
      <MemoryRouter>
        <AdmissionsCrmPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Admission Leads & Conversion/i)).toBeInTheDocument();
    expect(screen.getByText(/New Lead/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
      expect(screen.getByText(/Convert & Enroll as Student/i)).toBeInTheDocument();
    });
  });

  it('renders School Website CMS with page builder and notice manager', async () => {
    render(
      <MemoryRouter>
        <SchoolWebsiteCmsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/School Website Builder/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('About Our School')).toBeInTheDocument();
      expect(screen.getByText('/about-us')).toBeInTheDocument();
    });
  });

  it('renders Double-Entry Accounting & Ledger with Chart of Accounts and Trial Balance', async () => {
    render(
      <MemoryRouter>
        <AccountingFinancePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Accounting & General Ledger/i)).toBeInTheDocument();
    expect(screen.getByText(/New Journal Voucher/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Cash in Hand')).toBeInTheDocument();
      expect(screen.getByText('Tuition Fee Revenue')).toBeInTheDocument();
    });
  });

  it('renders Fee Management with fee collection and defaulters tabs', async () => {
    render(
      <MemoryRouter>
        <FeeManagementPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Fee Management & Accounts Counter/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Outstanding Dues/i)).toBeInTheDocument();
      expect(screen.getByText(/Fee Structures/i)).toBeInTheDocument();
    });
  });

  it('renders Examination Page with grading sheet and report card generator', async () => {
    render(
      <MemoryRouter>
        <ExaminationPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Examination & Report Card Portal/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Save Marks Sheet/i)).toBeInTheDocument();
    });
  });

  it('renders Academic Configuration Page with sessions and curriculum', async () => {
    render(
      <MemoryRouter>
        <AcademicConfigPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Academic Configuration/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('2026-2027')).toBeInTheDocument();
    });
  });
});

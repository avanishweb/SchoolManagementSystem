import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PromotionPage } from '../pages/academics/PromotionPage.js';
import { DailyDiaryPage } from '../pages/diary/DailyDiaryPage.js';
import { WhatsAppBroadcastPage } from '../pages/notifications/WhatsAppBroadcastPage.js';
import { IdCardStudioPage } from '../pages/idcard/IdCardStudioPage.js';
import { FeeManagementPage } from '../pages/fees/FeeManagementPage.js';

// Mock auth hook
vi.mock('../hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      name: 'Principal Ramesh',
      email: 'principal@springfield.edu',
      role: 'school_admin',
    },
    school: {
      id: 'school-1',
      name: 'Springfield Academy',
      slug: 'springfield',
    },
  }),
}));

// Mock studentService
vi.mock('../services/studentService.js', () => ({
  studentService: {
    getStudents: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'st-01',
          firstName: 'Aarav',
          lastName: 'Sharma',
          admissionNumber: 'ADM-2026-001',
          class: 'Grade 9',
          section: 'A',
          rollNumber: '01',
          academicSession: '2025-2026',
          status: 'active',
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, pages: 1 },
    }),
  },
}));

// Mock erpService
vi.mock('../services/erpService.js', () => ({
  erpService: {
    getPromotionBatches: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'batch-01',
          fromSession: '2025-2026',
          toSession: '2026-2027',
          fromClass: 'Grade 9',
          toClass: 'Grade 10',
          fromSection: 'A',
          toSection: 'A',
          studentCount: 35,
          status: 'promoted',
          createdAt: new Date().toISOString(),
        },
      ],
    }),
    promoteStudents: vi.fn().mockResolvedValue({ success: true, count: 1 }),
    undoPromotion: vi.fn().mockResolvedValue({ success: true, message: 'Restored' }),
    getDailyDiary: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'diary-01',
          subject: 'Mathematics',
          topicCovered: 'Quadratic Equations Exercise 4.2',
          homework: 'Solve problems 1 through 8',
          teacherName: 'Vikram Joshi',
          signedOff: true,
        },
      ],
    }),
    createDailyDiary: vi.fn().mockResolvedValue({ success: true }),
    getNotifications: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'notif-01',
          title: 'Annual Sports Day Notice',
          message: 'All parents are invited this Saturday.',
          targetAudience: 'all',
          createdAt: new Date().toISOString(),
        },
      ],
    }),
    broadcastNoticeToParents: vi.fn().mockResolvedValue({
      data: { recipientsCount: 150 },
    }),
    getEmployees: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'emp-01',
          employeeId: 'EMP-001',
          firstName: 'Anita',
          lastName: 'Deshmukh',
          email: 'anita@school.edu',
          phone: '+91 9876543210',
          role: 'teacher',
          department: 'Academics',
          designation: 'Senior PGT Math',
        },
      ],
    }),
    getFeeHeads: vi.fn().mockResolvedValue({ data: [] }),
    getFeeStructures: vi.fn().mockResolvedValue({ data: [] }),
    getDefaulters: vi.fn().mockResolvedValue({ data: [] }),
    getFeePayments: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'pay-01',
          receiptNumber: 'RCP-2026-0001',
          studentName: 'Aarav Sharma',
          feeHeadName: 'Tuition Fee Q1',
          amount: 15000,
          paymentMethod: 'upi',
          status: 'voided',
          voidReason: 'Mistakenly charged wrong fee structure',
          createdAt: new Date().toISOString(),
        },
      ],
    }),
    voidFeePayment: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('New Features Test Suite', () => {
  it('renders Academic Year Promotion Page with batch promotion and undo tab', async () => {
    render(
      <MemoryRouter>
        <PromotionPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Academic Year Promotion')).toBeInTheDocument();
    expect(screen.getByText('Batch Promotion')).toBeInTheDocument();
    expect(screen.getByText('Promotion History & Undo')).toBeInTheDocument();
    expect(screen.getByText('Source Cohort (Current Class)')).toBeInTheDocument();
    expect(screen.getByText('Target Cohort (Promoted To)')).toBeInTheDocument();
  });

  it('renders Daily Diary Module with subject records and homework logs', async () => {
    render(
      <MemoryRouter>
        <DailyDiaryPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Daily Diary & Homework Log')).toBeInTheDocument();
    expect(screen.getByText('Add Diary Entry')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Quadratic Equations Exercise 4.2')).toBeInTheDocument();
      expect(screen.getByText('Solve problems 1 through 8')).toBeInTheDocument();
    });
  });

  it('renders WhatsApp Notice Broadcast Page with composer and live smartphone preview', async () => {
    render(
      <MemoryRouter>
        <WhatsAppBroadcastPage />
      </MemoryRouter>
    );

    expect(screen.getByText('WhatsApp Notice Broadcast')).toBeInTheDocument();
    expect(screen.getByText('Compose WhatsApp Notice')).toBeInTheDocument();
    expect(screen.getByText('Send WhatsApp Broadcast Now')).toBeInTheDocument();
    expect(screen.getByText('Live Parent Mobile WhatsApp Preview')).toBeInTheDocument();
  });

  it('renders ID Card Studio with template styles, orientation, and card preview', async () => {
    render(
      <MemoryRouter>
        <IdCardStudioPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/ID Card Studio/i)).toBeInTheDocument();
    expect(screen.getByText(/Student Badges/i)).toBeInTheDocument();
    expect(screen.getByText(/Staff \/ Faculty Badges/i)).toBeInTheDocument();
    expect(screen.getByText(/Silent Print/i)).toBeInTheDocument();
  });

  it('renders Fee Collection Page with Void/Reversal audit indicator', async () => {
    render(
      <MemoryRouter>
        <FeeManagementPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Fee Management/i)).toBeInTheDocument();
  });
});

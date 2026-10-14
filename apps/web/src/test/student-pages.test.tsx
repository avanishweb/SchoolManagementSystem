import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StudentAdmissionPage } from '../pages/students/StudentAdmissionPage.js';
import { studentService } from '../services/studentService.js';

// Mock studentService
vi.mock('../services/studentService.js', () => ({
  studentService: {
    getNextAdmissionNumber: vi.fn().mockResolvedValue({ admissionNumber: 'ADM-2026-0099' }),
    createStudent: vi.fn().mockResolvedValue({
      id: 'student-123',
      firstName: 'Alice',
      lastName: 'Smith',
      admissionNumber: 'ADM-2026-0099',
    }),
  },
}));

// Mock auth hook
vi.mock('../hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: {
      id: 'user-admin',
      name: 'Principal Skinner',
      email: 'admin@springfield.edu',
      role: 'school_admin',
    },
    school: {
      id: 'school-123',
      name: 'Springfield Academy',
      slug: 'springfield',
    },
    logout: vi.fn(),
  }),
}));

describe('StudentAdmissionPage Component', () => {
  it('renders admission form with auto-generated admission number', async () => {
    render(
      <MemoryRouter>
        <StudentAdmissionPage />
      </MemoryRouter>
    );

    expect(screen.getByText('New Student Admission')).toBeInTheDocument();
    expect(screen.getByText('Student Identity & Details')).toBeInTheDocument();
    expect(screen.getByText('Academic Enrollment & Placement')).toBeInTheDocument();
    expect(screen.getByText('Parent / Guardian Information')).toBeInTheDocument();
    expect(screen.getByText('Residential Address')).toBeInTheDocument();

    await waitFor(() => {
      const admInput = screen.getByPlaceholderText('e.g. ADM-2026-0001') as HTMLInputElement;
      expect(admInput.value).toBe('ADM-2026-0099');
    });
  });

  it('renders required field inputs and complete admission action button', () => {
    render(
      <MemoryRouter>
        <StudentAdmissionPage />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('e.g. Liam')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Vance')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Robert Vance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete Admission/i })).toBeInTheDocument();
  });
});

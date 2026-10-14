import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SuperAdminDashboardPage } from '../pages/super-admin/SuperAdminDashboardPage.js';
import { SchoolBrandingPage } from '../pages/settings/SchoolBrandingPage.js';
import { schoolService } from '../services/schoolService.js';
import { BrandingProvider } from '../context/BrandingContext.js';

// Mock schoolService
vi.mock('../services/schoolService.js', () => ({
  schoolService: {
    listSchools: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'school-1',
          name: 'Springfield Academy',
          slug: 'springfield-academy',
          code: 'SPA-001',
          status: 'active',
          subscription: {
            plan: 'annual',
            status: 'active',
            maxStudents: 2500,
          },
          customDomain: {
            domain: 'erp.springfield.edu',
            status: 'verified',
          },
          usage: {
            studentCount: 150,
          },
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    }),
    getCurrentSchool: vi.fn().mockResolvedValue({
      id: 'school-1',
      name: 'Springfield Academy',
      slug: 'springfield-academy',
      branding: {
        primaryColor: '#4f46e5',
        loginTitle: 'Welcome to Springfield Portal',
      },
    }),
  },
}));

// Mock auth context
vi.mock('../context/AuthContext.js', () => ({
  useAuth: () => ({
    user: {
      id: 'super-admin-1',
      name: 'Platform Overseer',
      email: 'superadmin@platform.local',
      role: 'super_admin',
    },
    school: {
      id: 'school-1',
      name: 'Springfield Academy',
      slug: 'springfield-academy',
      branding: {
        primaryColor: '#4f46e5',
        loginTitle: 'Welcome to Springfield Portal',
      },
    },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

describe('Commercial Super Admin & White-Label Frontend', () => {
  it('renders Super Admin Dashboard with platform metrics and managed schools', async () => {
    render(
      <MemoryRouter>
        <SuperAdminDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Customer Schools & Licensing')).toBeInTheDocument();
    expect(screen.getByText('Managed Schools')).toBeInTheDocument();
    expect(screen.getByText('Platform Students')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Springfield Academy')).toBeInTheDocument();
      expect(screen.getByText('/springfield-academy')).toBeInTheDocument();
      expect(screen.getByText('erp.springfield.edu (verified)')).toBeInTheDocument();
    });
  });

  it('renders School Branding Page with color pickers and live preview', async () => {
    render(
      <MemoryRouter>
        <BrandingProvider>
          <SchoolBrandingPage />
        </BrandingProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('School Branding & Domain Settings')).toBeInTheDocument();
    expect(screen.getByText('1. Brand Color Palette')).toBeInTheDocument();
    expect(screen.getByText('2. Login Page Branding')).toBeInTheDocument();
    expect(screen.getByText('3. Receipt & Certificate Templates')).toBeInTheDocument();
    expect(screen.getByText('4. Custom School Domain')).toBeInTheDocument();
    expect(screen.getByText('Live Visual Preview')).toBeInTheDocument();
  });
});

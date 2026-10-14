import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout.js';
import { AuthLayout } from '../layouts/AuthLayout.js';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { NotFoundPage } from '../pages/NotFoundPage.js';
import { UnauthorizedPage } from '../pages/UnauthorizedPage.js';
import { ProtectedRoute } from './ProtectedRoute.js';

import { StudentListPage } from '../pages/students/StudentListPage.js';
import { StudentAdmissionPage } from '../pages/students/StudentAdmissionPage.js';
import { StudentProfilePage } from '../pages/students/StudentProfilePage.js';
import { StudentEditPage } from '../pages/students/StudentEditPage.js';
import { SuperAdminDashboardPage } from '../pages/super-admin/SuperAdminDashboardPage.js';
import { SchoolDetailsManagePage } from '../pages/super-admin/SchoolDetailsManagePage.js';
import { VendorAuditLogPage } from '../pages/super-admin/VendorAuditLogPage.js';
import { SchoolBrandingPage } from '../pages/settings/SchoolBrandingPage.js';

// TENORA365 Commercial ERP Module Pages
import { AcademicConfigPage } from '../pages/academics/AcademicConfigPage.js';
import { PromotionPage } from '../pages/academics/PromotionPage.js';
import { FacultyPage } from '../pages/faculty/FacultyPage.js';
import { StudentAttendancePage } from '../pages/attendance/StudentAttendancePage.js';
import { FeeManagementPage } from '../pages/fees/FeeManagementPage.js';
import { ExaminationPage } from '../pages/examinations/ExaminationPage.js';
import { TimetableSchedulerPage } from '../pages/timetable/TimetableSchedulerPage.js';
import { HomeworkPage } from '../pages/homework/HomeworkPage.js';
import { DailyDiaryPage } from '../pages/diary/DailyDiaryPage.js';
import { AdmissionsCrmPage } from '../pages/crm/AdmissionsCrmPage.js';
import { IdCardStudioPage } from '../pages/idcard/IdCardStudioPage.js';
import { WhatsAppBroadcastPage } from '../pages/notifications/WhatsAppBroadcastPage.js';
import { SchoolWebsiteCmsPage } from '../pages/cms/SchoolWebsiteCmsPage.js';
import { AccountingFinancePage } from '../pages/accounting/AccountingFinancePage.js';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected Application Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        
        {/* Phase 2: Student Management Routes */}
        <Route
          path="students"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal', 'teacher', 'staff']}>
              <StudentListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="students/admission"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal', 'staff']}>
              <StudentAdmissionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="students/:id"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal', 'teacher', 'staff']}>
              <StudentProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="students/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal', 'staff']}>
              <StudentEditPage />
            </ProtectedRoute>
          }
        />

        {/* Commercial Multi-School Super Admin Portal */}
        <Route
          path="super-admin"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="super-admin/schools/:id"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SchoolDetailsManagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="super-admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <VendorAuditLogPage />
            </ProtectedRoute>
          }
        />

        {/* White-Label School Branding Settings */}
        <Route
          path="settings/branding"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin']}>
              <SchoolBrandingPage />
            </ProtectedRoute>
          }
        />
        <Route path="settings" element={<Navigate to="/settings/branding" replace />} />

        {/* TENORA365 Commercial ERP Operational Modules */}
        <Route
          path="admissions"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal', 'staff']}>
              <AdmissionsCrmPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="academics"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal', 'teacher']}>
              <AcademicConfigPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="academics/promotion"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal']}>
              <PromotionPage />
            </ProtectedRoute>
          }
        />
        <Route path="promotion" element={<Navigate to="/academics/promotion" replace />} />
        <Route path="classes" element={<Navigate to="/academics" replace />} />
        <Route
          path="faculty"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal']}>
              <FacultyPage />
            </ProtectedRoute>
          }
        />
        <Route path="teachers" element={<Navigate to="/faculty" replace />} />
        <Route
          path="attendance"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal', 'teacher', 'staff']}>
              <StudentAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="timetable"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal', 'teacher', 'student', 'parent']}>
              <TimetableSchedulerPage />
            </ProtectedRoute>
          }
        />
        <Route path="schedule" element={<Navigate to="/timetable" replace />} />
        <Route
          path="homework"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal', 'teacher', 'student', 'parent']}>
              <HomeworkPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="daily-diary"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal', 'teacher', 'student', 'parent', 'staff']}>
              <DailyDiaryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="examinations"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal', 'teacher']}>
              <ExaminationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="fees"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal', 'accountant']}>
              <FeeManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="id-cards"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal', 'staff']}>
              <IdCardStudioPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="whatsapp-broadcast"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal', 'teacher']}>
              <WhatsAppBroadcastPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="accounting"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'principal', 'accountant']}>
              <AccountingFinancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="website-cms"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'school_admin']}>
              <SchoolWebsiteCmsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Error & Fallback Routes */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

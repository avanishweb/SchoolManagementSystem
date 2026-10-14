import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { IStudent, StudentStatus, PaginatedResult } from '@smart-school/shared-types';
import { STANDARD_CLASSES, STANDARD_SECTIONS } from '@smart-school/shared-utils';
import { studentService } from '../../services/studentService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { ErrorAlert } from '../../components/common/ErrorAlert.js';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  UserCheck,
  UserX,
  GraduationCap,
  AlertTriangle,
  Building,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  StudentStatus,
  { label: string; badgeClass: string; icon: React.FC<{ className?: string }> }
> = {
  active: {
    label: 'Active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: UserCheck,
  },
  inactive: {
    label: 'Inactive',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: UserX,
  },
  suspended: {
    label: 'Suspended',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertTriangle,
  },
  graduated: {
    label: 'Graduated',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: GraduationCap,
  },
  transferred: {
    label: 'Transferred',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: Building,
  },
};

export const StudentListPage: React.FC = () => {
  const { user } = useAuth();

  // State
  const [data, setData] = useState<PaginatedResult<IStudent> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const limit = 10;

  // RBAC permissions: super_admin, school_admin, and staff can admit and edit students
  const canManageStudents = user?.role === 'super_admin' || user?.role === 'school_admin' || user?.role === 'staff';

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentService.getStudents({
        page: currentPage,
        limit,
        search: search.trim() || undefined,
        class: selectedClass || undefined,
        section: selectedSection || undefined,
        status: (selectedStatus as StudentStatus) || undefined,
      });
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch student directory.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, selectedClass, selectedSection, selectedStatus]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStudents();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedClass('');
    setSelectedSection('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const handleQuickStatusChange = async (studentId: string, newStatus: StudentStatus) => {
    if (!canManageStudents) return;
    try {
      await studentService.updateStudentStatus(studentId, newStatus);
      fetchStudents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update student status.';
      setError(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Phase 2 Active
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Student Records & Admissions
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            Student Directory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Comprehensive directory, enrollment status, profile records, and class assignments.
          </p>
        </div>

        {canManageStudents && (
          <Link
            to="/students/admission"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            New Admission
          </Link>
        )}
      </div>

      {error && (
        <ErrorAlert
          title="Directory Notice"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, admission no, roll no, or guardian phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Classes</option>
            {STANDARD_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          {/* Section Filter */}
          <select
            value={selectedSection}
            onChange={(e) => {
              setSelectedSection(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Sections</option>
            {STANDARD_SECTIONS.map((sec) => (
              <option key={sec} value={sec}>
                Section {sec}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="graduated">Graduated</option>
            <option value="transferred">Transferred</option>
          </select>

          {/* Reset Filters */}
          {(search || selectedClass || selectedSection || selectedStatus) && (
            <button
              onClick={handleResetFilters}
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}

          {data && (
            <span className="ml-auto text-xs text-slate-500 font-medium">
              Total Found: <strong className="text-slate-800">{data.pagination.total}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Student Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" label="Loading student directory..." />
          </div>
        ) : !data || data.items.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Students Found</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {search || selectedClass || selectedSection || selectedStatus
                ? 'No student records match the specified filters. Try adjusting your search query or reset the filters.'
                : 'No student admissions have been recorded for your school yet. Begin by enrolling your first student.'}
            </p>
            {canManageStudents && (
              <Link
                to="/students/admission"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Admit First Student
              </Link>
            )}
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Class & Sec</th>
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Guardian Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {data.items.map((student) => {
                  const statusInfo = STATUS_CONFIG[student.status] || STATUS_CONFIG.active;
                  const StatusIcon = statusInfo.icon;
                  const fullName = `${student.firstName} ${student.lastName}`;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Student Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={fullName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-200 shadow-xs shrink-0">
                              {student.firstName[0]}
                              {student.lastName[0]}
                            </div>
                          )}
                          <div>
                            <Link
                              to={`/students/${student.id}`}
                              className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors block text-sm"
                            >
                              {fullName}
                            </Link>
                            <span className="text-[11px] text-slate-400 capitalize">
                              {student.gender} • {student.bloodGroup || 'Blood group N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Admission Number */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-indigo-700">
                        {student.admissionNumber}
                      </td>

                      {/* Class & Section */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-900">{student.class}</span>
                        <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px]">
                          Sec {student.section}
                        </span>
                      </td>

                      {/* Roll No */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {student.rollNumber || '-'}
                      </td>

                      {/* Guardian */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{student.guardian.guardianName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {student.guardian.guardianPhone}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {canManageStudents ? (
                          <select
                            value={student.status}
                            onChange={(e) =>
                              handleQuickStatusChange(
                                student.id,
                                e.target.value as StudentStatus
                              )
                            }
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${statusInfo.badgeClass}`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                            <option value="graduated">Graduated</option>
                            <option value="transferred">Transferred</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            to={`/students/${student.id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="View Student Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {canManageStudents && (
                            <Link
                              to={`/students/${student.id}/edit`}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Edit Student Record"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {data && data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Showing{' '}
              <strong className="text-slate-800">
                {(currentPage - 1) * limit + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800">
                {Math.min(currentPage * limit, data.pagination.total)}
              </strong>{' '}
              of <strong className="text-slate-800">{data.pagination.total}</strong> students
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold px-3 py-1 text-slate-700">
                Page {currentPage} of {data.pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={currentPage === data.pagination.totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

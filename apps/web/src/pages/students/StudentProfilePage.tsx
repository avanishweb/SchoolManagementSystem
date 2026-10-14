import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { IStudent, StudentStatus, IStudentDocument } from '@smart-school/shared-types';
import { studentService } from '../../services/studentService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { ErrorAlert } from '../../components/common/ErrorAlert.js';
import {
  ArrowLeft,
  Edit2,
  Camera,
  FileText,
  Upload,
  Trash2,
  Download,
  BookOpen,
  UserCheck,
  UserX,
  AlertTriangle,
  GraduationCap,
  Building,
  HeartPulse,
  Phone,
  MapPin,
  CheckCircle2,
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

export const StudentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [student, setStudent] = useState<IStudent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Document upload state
  const [docTitle, setDocTitle] = useState<string>('');
  const [docCategory, setDocCategory] = useState<string>('ID Proof');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  // RBAC
  const canManageStudents = user?.role === 'super_admin' || user?.role === 'school_admin' || user?.role === 'staff';

  const fetchStudent = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await studentService.getStudentById(id);
      setStudent(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve student record.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const handleStatusChange = async (newStatus: StudentStatus) => {
    if (!student || !canManageStudents) return;
    try {
      const updated = await studentService.updateStudentStatus(student.id, newStatus);
      setStudent(updated);
      setSuccessMessage(`Student status updated to ${newStatus}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update student status.';
      setError(msg);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Photo must be a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo size must not exceed 2MB.');
      return;
    }

    try {
      setUploadingPhoto(true);
      setError(null);
      const updated = await studentService.uploadPhoto(student.id, file);
      setStudent(updated);
      setSuccessMessage('Student photo updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload photo.';
      setError(msg);
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !docFile || !docTitle.trim()) {
      setError('Please provide document title and select a valid file.');
      return;
    }

    try {
      setUploadingDoc(true);
      setError(null);
      const updated = await studentService.uploadDocument(
        student.id,
        docFile,
        docTitle.trim(),
        docCategory
      );
      setStudent(updated);
      setDocTitle('');
      setDocFile(null);
      if (docInputRef.current) docInputRef.current.value = '';
      setSuccessMessage('Document attached to student record successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload document.';
      setError(msg);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!student || !window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const updated = await studentService.deleteDocument(student.id, documentId);
      setStudent(updated);
      setSuccessMessage('Document removed successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete document.';
      setError(msg);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" label="Loading student profile..." />
      </div>
    );
  }

  if (error && !student) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pt-8">
        <ErrorAlert title="Student Record Notice" message={error} />
        <Link
          to="/students"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
      </div>
    );
  }

  if (!student) return null;

  const statusInfo = STATUS_CONFIG[student.status] || STATUS_CONFIG.active;
  const fullName = `${student.firstName} ${student.lastName}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/students"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Student Directory
        </Link>

        {canManageStudents && (
          <div className="flex items-center gap-2">
            <Link
              to={`/students/${student.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Profile
            </Link>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      {error && (
        <ErrorAlert
          title="Operation Error"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Main Student Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            {/* Student Photo with Upload Button */}
            <div className="relative group shrink-0">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={fullName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xl border-2 border-indigo-200 shadow-sm">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </div>
              )}

              {canManageStudents && (
                <>
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-colors"
                    title="Upload student photograph"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {student.admissionNumber}
                </span>

                {canManageStudents ? (
                  <select
                    value={student.status}
                    onChange={(e) => handleStatusChange(e.target.value as StudentStatus)}
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border cursor-pointer focus:outline-none ${statusInfo.badgeClass}`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="graduated">Graduated</option>
                    <option value="transferred">Transferred</option>
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                  >
                    {statusInfo.label}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{fullName}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Class: <strong className="text-slate-800 font-semibold">{student.class}</strong> • Section:{' '}
                <strong className="text-slate-800 font-semibold">{student.section}</strong> • Roll No:{' '}
                <strong className="text-slate-800 font-semibold">{student.rollNumber || 'Not assigned'}</strong>
              </p>
            </div>
          </div>

          <div className="flex md:flex-col items-start md:items-end justify-between gap-1 text-xs text-slate-500">
            <div>
              Academic Session:{' '}
              <strong className="text-slate-800 font-mono">{student.academicSession}</strong>
            </div>
            <div>
              Admission Date:{' '}
              <strong className="text-slate-800">
                {new Date(student.admissionDate).toLocaleDateString()}
              </strong>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Column 1: Academic & Personal */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Academic & Personal
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Date of Birth:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(student.dateOfBirth).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Gender:</span>
                <span className="font-semibold text-slate-800 capitalize">{student.gender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Blood Group:</span>
                <span className="font-semibold text-slate-800">{student.bloodGroup || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Roll Number:</span>
                <span className="font-semibold text-slate-800">{student.rollNumber || 'Unassigned'}</span>
              </div>
            </div>

            {student.notes && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-600" /> Notes & Medical Records
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">{student.notes}</p>
              </div>
            )}
          </div>

          {/* Column 2: Guardian Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Phone className="w-3.5 h-3.5 text-sky-600" />
              Primary Guardian
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Name:</span>
                <span className="font-semibold text-slate-800">{student.guardian.guardianName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Relationship:</span>
                <span className="font-semibold text-slate-800">{student.guardian.guardianRelation}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Phone:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {student.guardian.guardianPhone}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-800">
                  {student.guardian.guardianEmail || 'None registered'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Occupation:</span>
                <span className="font-semibold text-slate-800">
                  {student.guardian.guardianOccupation || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Domicile / Address */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              Residential Address
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Street:</span>
                <span className="font-semibold text-slate-800 text-right">{student.currentAddress?.street || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">City:</span>
                <span className="font-semibold text-slate-800">{student.currentAddress?.city || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">State:</span>
                <span className="font-semibold text-slate-800">{student.currentAddress?.state || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Postal Code:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {student.currentAddress?.postalCode || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Country:</span>
                <span className="font-semibold text-slate-800">{student.currentAddress?.country || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Student Documents & Certificates
            </h2>
            <p className="text-xs text-slate-500">
              Safely stored files (ID proofs, medical certificates, transcripts, transfer certs)
            </p>
          </div>
        </div>

        {/* Upload New Document Form */}
        {canManageStudents && (
          <form
            onSubmit={handleDocumentSubmit}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3"
          >
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Upload New Document
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Birth Certificate"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Category *
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ID Proof">ID Proof</option>
                  <option value="Birth Certificate">Birth Certificate</option>
                  <option value="Transfer Certificate">Transfer Certificate</option>
                  <option value="Medical Certificate">Medical Certificate</option>
                  <option value="Previous Academic Report">Previous Academic Report</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  File (PDF, PNG, JPG &lt; 5MB) *
                </label>
                <input
                  type="file"
                  ref={docInputRef}
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={uploadingDoc || !docFile || !docTitle.trim()}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {uploadingDoc ? (
                    <LoadingSpinner size="sm" label="Uploading..." />
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Attach File
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Document List Table */}
        {!student.documents || student.documents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No documents uploaded for this student yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">File Size</th>
                  <th className="py-2.5 px-4">Upload Date</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {student.documents.map((doc: IStudentDocument) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {doc.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[10px]">
                        {doc.fileType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Download document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {canManageStudents && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

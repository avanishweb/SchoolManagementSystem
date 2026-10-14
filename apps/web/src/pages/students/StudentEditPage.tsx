import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateStudentSchema, UpdateStudentInput } from '@smart-school/validation';
import { STANDARD_CLASSES, STANDARD_SECTIONS, BLOOD_GROUPS } from '@smart-school/shared-utils';
import { studentService } from '../../services/studentService.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { ErrorAlert } from '../../components/common/ErrorAlert.js';
import {
  Edit2,
  ArrowLeft,
  User,
  BookOpen,
  Phone,
  MapPin,
  HeartPulse,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const StudentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loadingStudent, setLoadingStudent] = useState<boolean>(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [admissionNumber, setAdmissionNumber] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateStudentInput>({
    resolver: zodResolver(updateStudentSchema),
  });

  useEffect(() => {
    if (!id) return;
    const fetchStudent = async () => {
      try {
        setLoadingStudent(true);
        setServerError(null);
        const s = await studentService.getStudentById(id);
        setAdmissionNumber(s.admissionNumber);

        const dobStr = s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : '';
        const admDateStr = s.admissionDate ? new Date(s.admissionDate).toISOString().split('T')[0] : '';

        reset({
          firstName: s.firstName,
          lastName: s.lastName,
          gender: s.gender,
          dateOfBirth: dobStr,
          bloodGroup: s.bloodGroup || undefined,
          class: s.class,
          section: s.section,
          rollNumber: s.rollNumber || '',
          academicSession: s.academicSession,
          admissionDate: admDateStr,
          guardian: {
            guardianName: s.guardian.guardianName,
            guardianRelation: s.guardian.guardianRelation,
            guardianPhone: s.guardian.guardianPhone,
            guardianEmail: s.guardian.guardianEmail || '',
            guardianOccupation: s.guardian.guardianOccupation || '',
          },
          currentAddress: {
            street: s.currentAddress?.street || '',
            city: s.currentAddress?.city || '',
            state: s.currentAddress?.state || '',
            postalCode: s.currentAddress?.postalCode || '',
            country: s.currentAddress?.country || 'India',
          },
          notes: s.notes || '',
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load student details.';
        setServerError(msg);
      } finally {
        setLoadingStudent(false);
      }
    };
    fetchStudent();
  }, [id, reset]);

  const onSubmit = async (formData: UpdateStudentInput) => {
    if (!id) return;
    try {
      setServerError(null);
      await studentService.updateStudent(id, formData);
      setSuccessToast('Student details updated successfully!');
      setTimeout(() => {
        navigate(`/students/${id}`);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update student profile.';
      setServerError(msg);
    }
  };

  if (loadingStudent) {
    return (
      <div className="p-16 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" label="Loading student data for editing..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            to={id ? `/students/${id}` : '/students'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Profile
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Edit2 className="w-6 h-6 text-indigo-600" />
            Edit Student Profile
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Update personal information, academic grade allocation, and parent contacts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={id ? `/students/${id}` : '/students'}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>

      {serverError && (
        <ErrorAlert
          title="Update Error"
          message={serverError}
          onDismiss={() => setServerError(null)}
        />
      )}

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Main Edit Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Personal & Identity Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Identity & Details</h2>
              <p className="text-xs text-slate-500">Legal name, identification, and demographic data</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Admission Number (Read-only) */}
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Admission Number <span className="text-slate-400 font-normal lowercase">(read-only system identifier)</span>
              </label>
              <input
                type="text"
                disabled
                value={admissionNumber}
                className="w-full max-w-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-sm font-mono cursor-not-allowed"
              />
            </div>

            {/* First Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('firstName')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.firstName && (
                <p className="text-xs text-rose-600 mt-1">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('lastName')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.lastName && (
                <p className="text-xs text-rose-600 mt-1">{errors.lastName.message}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                {...register('dateOfBirth')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-rose-600 mt-1">{errors.dateOfBirth.message}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <select
                {...register('gender')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Blood Group <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <select
                {...register('bloodGroup')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Academic Enrollment */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Academic Enrollment & Placement</h2>
              <p className="text-xs text-slate-500">Grade level, section allocation, session, and admission date</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Class */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Class / Grade
              </label>
              <select
                {...register('class')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {STANDARD_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Section
              </label>
              <select
                {...register('section')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {STANDARD_SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Roll Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Roll Number <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 15"
                {...register('rollNumber')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Academic Session */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Academic Session
              </label>
              <input
                type="text"
                {...register('academicSession')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Admission Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Admission Date
              </label>
              <input
                type="date"
                {...register('admissionDate')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Guardian Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Parent / Guardian Information</h2>
              <p className="text-xs text-slate-500">Primary emergency contact, phone, and communications</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Guardian Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Guardian Full Name
              </label>
              <input
                type="text"
                {...register('guardian.guardianName')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Relationship */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Relationship
              </label>
              <select
                {...register('guardian.guardianRelation')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Legal Guardian">Legal Guardian</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Phone
              </label>
              <input
                type="tel"
                {...register('guardian.guardianPhone')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Guardian Email <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                {...register('guardian.guardianEmail')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Occupation <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                {...register('guardian.guardianOccupation')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Address */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Residential Address</h2>
              <p className="text-xs text-slate-500">Student permanent domicile and mailing address</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Street */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Street Address
              </label>
              <input
                type="text"
                {...register('currentAddress.street')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                City
              </label>
              <input
                type="text"
                {...register('currentAddress.city')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                State / Province
              </label>
              <input
                type="text"
                {...register('currentAddress.state')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Postal Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Postal / Zip Code
              </label>
              <input
                type="text"
                {...register('currentAddress.postalCode')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Country
              </label>
              <input
                type="text"
                {...register('currentAddress.country')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Notes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Medical Notes & Special Needs</h2>
              <p className="text-xs text-slate-500">Allergies, chronic conditions, emergency medical precautions</p>
            </div>
          </div>

          <div>
            <textarea
              rows={3}
              {...register('notes')}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to={id ? `/students/${id}` : '/students'}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" label="Saving updates..." />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

import { apiClient } from './apiClient.js';
import {
  IAcademicSession,
  IClassroom,
  ISection,
  ISubject,
  IEmployee,
  IStudentAttendance,
  IFeeHead,
  IFeeStructure,
  IStudentFeeRecord,
  IFeePayment,
  IExamination,
  IExamSchedule,
  IExamMark,
  ITimetableSlot,
  IHomework,
  IHomeworkSubmission,
  IAdmissionEnquiry,
  ICmsPage,
  ICmsNotice,
  IAccount,
  IJournalEntry,
} from '@smart-school/shared-types';

export const erpService = {
  // ACADEMICS
  getSessions: () => apiClient.get<IAcademicSession[]>('/academic/sessions'),
  createSession: (data: Partial<IAcademicSession>) => apiClient.post<IAcademicSession>('/academic/sessions', data),
  setCurrentSession: (id: string) => apiClient.patch<IAcademicSession>(`/academic/sessions/${id}/current`),
  getClasses: () => apiClient.get<IClassroom[]>('/academic/classes'),
  createClass: (data: Partial<IClassroom>) => apiClient.post<IClassroom>('/academic/classes', data),
  getSections: (classId?: string) => apiClient.get<ISection[]>(`/academic/sections${classId ? `?classId=${classId}` : ''}`),
  createSection: (data: Partial<ISection>) => apiClient.post<ISection>('/academic/sections', data),
  getSubjects: () => apiClient.get<ISubject[]>('/academic/subjects'),
  createSubject: (data: Partial<ISubject>) => apiClient.post<ISubject>('/academic/subjects', data),

  // EMPLOYEES
  getEmployees: (role?: string) => apiClient.get<IEmployee[]>(`/employees${role ? `?role=${role}` : ''}`),
  createEmployee: (data: Partial<IEmployee>) => apiClient.post<IEmployee>('/employees', data),
  updateEmployee: (id: string, data: Partial<IEmployee>) => apiClient.put<IEmployee>(`/employees/${id}`, data),

  // ATTENDANCE
  bulkMarkAttendance: (data: { class: string; section: string; date: string; records: { studentId: string; status: string; remarks?: string }[] }) =>
    apiClient.post<IStudentAttendance[]>('/attendance/bulk', data),
  getClassAttendance: (className: string, section: string, date: string) =>
    apiClient.get<IStudentAttendance[]>(`/attendance/class?class=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}&date=${encodeURIComponent(date)}`),
  getStudentMonthlyAttendance: (studentId: string, year?: number, month?: number) =>
    apiClient.get<{ records: IStudentAttendance[]; summary: any }>(`/attendance/student/${studentId}?year=${year || ''}&month=${month || ''}`),

  // FEES
  getFeeHeads: () => apiClient.get<IFeeHead[]>('/fees/heads'),
  createFeeHead: (data: Partial<IFeeHead>) => apiClient.post<IFeeHead>('/fees/heads', data),
  getFeeStructures: (className?: string) =>
    apiClient.get<IFeeStructure[]>(`/fees/structures${className ? `?class=${encodeURIComponent(className)}` : ''}`),
  createFeeStructure: (data: Partial<IFeeStructure>) => apiClient.post<IFeeStructure>('/fees/structures', data),
  getStudentFees: (studentId: string) => apiClient.get<IStudentFeeRecord[]>(`/fees/student/${studentId}`),
  recordFeePayment: (data: { studentId: string; feeRecordId: string; amount: number; paymentMethod: string; transactionReference?: string; notes?: string }) =>
    apiClient.post<{ payment: IFeePayment; updatedRecord: IStudentFeeRecord }>('/fees/payments', data),
  getFeePayments: (studentId?: string) => apiClient.get<IFeePayment[]>(`/fees/payments${studentId ? `?studentId=${studentId}` : ''}`),
  getFeeDefaulters: (className?: string) =>
    apiClient.get<IStudentFeeRecord[]>(`/fees/defaulters${className ? `?class=${encodeURIComponent(className)}` : ''}`),

  // EXAMS
  getExams: () => apiClient.get<IExamination[]>('/examinations'),
  createExam: (data: Partial<IExamination>) => apiClient.post<IExamination>('/examinations', data),
  getExamSchedules: (examId: string) => apiClient.get<IExamSchedule[]>(`/examinations/${examId}/schedules`),
  createExamSchedule: (data: Partial<IExamSchedule>) => apiClient.post<IExamSchedule>('/examinations/schedules', data),
  recordExamMarks: (data: any) => apiClient.post<IExamMark[]>('/examinations/marks', data),
  getReportCard: (examId: string, studentId: string) => apiClient.get<any>(`/examinations/${examId}/report-card/${studentId}`),
  publishResults: (examId: string) => apiClient.patch<IExamination>(`/examinations/${examId}/publish`),

  // TIMETABLE
  getTimetable: (className: string, section: string) =>
    apiClient.get<ITimetableSlot[]>(`/timetable/class?class=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}`),
  createTimetableSlot: (data: Partial<ITimetableSlot>) => apiClient.post<ITimetableSlot>('/timetable/slots', data),
  checkTimetableConflict: (data: Partial<ITimetableSlot>) => apiClient.post<any>('/timetable/check-conflict', data),
  deleteTimetableSlot: (id: string) => apiClient.delete(`/timetable/slots/${id}`),

  // HOMEWORK
  getHomework: (className?: string, section?: string) =>
    apiClient.get<IHomework[]>(`/homework?class=${encodeURIComponent(className || '')}&section=${encodeURIComponent(section || '')}`),
  createHomework: (data: Partial<IHomework>) => apiClient.post<IHomework>('/homework', data),
  submitHomework: (data: Partial<IHomeworkSubmission>) => apiClient.post<IHomeworkSubmission>('/homework/submit', data),
  getHomeworkSubmissions: (homeworkId: string) => apiClient.get<IHomeworkSubmission[]>(`/homework/${homeworkId}/submissions`),
  gradeSubmission: (submissionId: string, marks: number, feedback: string) =>
    apiClient.patch<IHomeworkSubmission>(`/homework/submissions/${submissionId}/grade`, { marks, feedback }),

  // ADMISSIONS CRM
  getEnquiries: (stage?: string, className?: string) =>
    apiClient.get<IAdmissionEnquiry[]>(`/admissions/enquiries?stage=${stage || ''}&class=${className || ''}`),
  createEnquiry: (data: Partial<IAdmissionEnquiry>) => apiClient.post<IAdmissionEnquiry>('/admissions/enquiries', data),
  updateEnquiryStage: (id: string, stage: string, notes?: string) =>
    apiClient.patch<IAdmissionEnquiry>(`/admissions/enquiries/${id}/stage`, { stage, notes }),
  convertEnquiryToStudent: (id: string, section?: string, gender?: string, dateOfBirth?: string) =>
    apiClient.post<any>(`/admissions/enquiries/${id}/convert`, { section, gender, dateOfBirth }),

  // CMS WEBSITE BUILDER
  getCmsPages: () => apiClient.get<ICmsPage[]>('/cms/pages'),
  createCmsPage: (data: Partial<ICmsPage>) => apiClient.post<ICmsPage>('/cms/pages', data),
  updateCmsPage: (id: string, data: Partial<ICmsPage>) => apiClient.put<ICmsPage>(`/cms/pages/${id}`, data),
  getCmsNotices: () => apiClient.get<ICmsNotice[]>('/cms/notices'),
  createCmsNotice: (data: Partial<ICmsNotice>) => apiClient.post<ICmsNotice>('/cms/notices', data),
  getPublicSite: (slug: string) => apiClient.get<any>(`/cms/public/${slug}`),

  // ACCOUNTING
  getAccounts: () => apiClient.get<IAccount[]>('/accounting/accounts'),
  createAccount: (data: Partial<IAccount>) => apiClient.post<IAccount>('/accounting/accounts', data),
  getJournalEntries: () => apiClient.get<IJournalEntry[]>('/accounting/journal-entries'),
  createJournalEntry: (data: any) => apiClient.post<IJournalEntry>('/accounting/journal-entries', data),
  getTrialBalance: () => apiClient.get<any>('/accounting/trial-balance'),

  // FEE VOID / REVERSAL
  voidFeePayment: (paymentId: string, reason: string) =>
    apiClient.post<any>(`/fees/payments/${paymentId}/void`, { reason }),

  // BULK ATTENDANCE WHATSAPP
  sendBulkAttendanceWhatsAppAlerts: (className: string, section: string, date: string) =>
    apiClient.post<any>('/attendance/broadcast-whatsapp', { class: className, section, date }),

  // ACADEMIC YEAR PROMOTION (WITH UNDO)
  promoteStudents: (data: any) => apiClient.post<any>('/academic/promotions', data),
  undoPromotion: (batchId: string) => apiClient.post<any>(`/academic/promotions/${batchId}/undo`, {}),
  getPromotionBatches: () => apiClient.get<any[]>('/academic/promotions'),

  // DAILY DIARY
  getDailyDiary: (className?: string, section?: string, date?: string) =>
    apiClient.get<any[]>(
      `/academic/diary?class=${encodeURIComponent(className || '')}&section=${encodeURIComponent(section || '')}&date=${encodeURIComponent(date || '')}`
    ),
  createDailyDiary: (data: any) => apiClient.post<any>('/academic/diary', data),
  updateDailyDiary: (id: string, data: any) => apiClient.put<any>(`/academic/diary/${id}`, data),
  deleteDailyDiary: (id: string) => apiClient.delete(`/academic/diary/${id}`),

  // WHATSAPP NOTICE BROADCAST
  broadcastNoticeToParents: (data: any) => apiClient.post<any>('/notifications/broadcast', data),
  getNotifications: () => apiClient.get<any[]>('/notifications'),
};


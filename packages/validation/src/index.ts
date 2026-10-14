import { z } from 'zod';

export const userRoleEnum = z.enum([
  'super_admin',
  'school_admin',
  'teacher',
  'staff',
  'accountant',
  'parent',
  'student',
  'principal',
  'librarian',
]);

export const schoolStatusEnum = z.enum(['active', 'suspended', 'pending', 'archived']);

export const subscriptionPlanEnum = z.enum(['trial', 'monthly', 'annual', 'lifetime']);

export const licenseStatusEnum = z.enum(['active', 'expired', 'grace_period', 'suspended']);

export const customDomainStatusEnum = z.enum(['unconfigured', 'pending', 'verified', 'failed']);

/**
 * Authentication Validation Schemas
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long'),
  schoolSlug: z
    .string()
    .trim()
    .toLowerCase()
    .optional(),
  rememberMe: z
    .boolean()
    .optional()
    .default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * School Validation Schemas
 */
export const createSchoolSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'School name must be at least 2 characters')
    .max(100, 'School name cannot exceed 100 characters'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Slug must be at least 2 characters')
    .max(60, 'Slug cannot exceed 60 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .max(20, 'School code cannot exceed 20 characters')
    .optional(),
  contactEmail: z
    .string()
    .trim()
    .email('Please enter a valid contact email')
    .optional()
    .or(z.literal('')),
  contactPhone: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  address: z
    .object({
      street: z.string().optional().or(z.literal('')),
      city: z.string().optional().or(z.literal('')),
      state: z.string().optional().or(z.literal('')),
      postalCode: z.string().optional().or(z.literal('')),
      country: z.string().optional().or(z.literal('')),
    })
    .optional(),
  settings: z
    .object({
      academicYear: z.string().optional(),
      timezone: z.string().optional(),
      currency: z.string().optional(),
      dateFormat: z.string().optional(),
      language: z.string().optional(),
    })
    .optional(),
  plan: subscriptionPlanEnum.optional().default('trial'),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;

/**
 * Comprehensive School Onboarding Schema (Creates school + initial School Admin)
 */
export const onboardSchoolSchema = z.object({
  schoolName: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().min(2).max(60).regex(/^[a-z0-9-]+$/).optional(),
  code: z.string().trim().toUpperCase().max(20).optional(),
  contactEmail: z.string().trim().email(),
  contactPhone: z.string().trim().optional(),
  adminName: z.string().trim().min(2).max(70),
  adminEmail: z.string().trim().email(),
  adminPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  plan: subscriptionPlanEnum.default('trial'),
  maxStudents: z.coerce.number().int().min(1).optional(),
  notes: z.string().trim().optional(),
});

export type OnboardSchoolInput = z.infer<typeof onboardSchoolSchema>;

/**
 * School Branding Schema
 */
export const updateSchoolBrandingSchema = z.object({
  logoUrl: z.string().trim().optional().or(z.literal('')),
  faviconUrl: z.string().trim().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color').optional(),
  secondaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color').optional(),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color').optional(),
  loginTitle: z.string().trim().max(100).optional().or(z.literal('')),
  loginSubtitle: z.string().trim().max(300).optional().or(z.literal('')),
  loginBannerUrl: z.string().trim().optional().or(z.literal('')),
  receiptHeader: z.string().trim().max(150).optional().or(z.literal('')),
  receiptFooter: z.string().trim().max(250).optional().or(z.literal('')),
  taxId: z.string().trim().max(50).optional().or(z.literal('')),
  authorizedSignatoryName: z.string().trim().max(80).optional().or(z.literal('')),
  authorizedSignatoryTitle: z.string().trim().max(80).optional().or(z.literal('')),
  idCardTemplate: z.enum(['modern', 'classic', 'minimal']).optional(),
  idCardShowBloodGroup: z.boolean().optional(),
  idCardShowEmergencyContact: z.boolean().optional(),
  welcomeEmailTemplate: z.string().trim().max(2000).optional().or(z.literal('')),
  feeReminderTemplate: z.string().trim().max(2000).optional().or(z.literal('')),
  admissionNoticeTemplate: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type UpdateSchoolBrandingInput = z.infer<typeof updateSchoolBrandingSchema>;

/**
 * Subscription / License Configuration Schema
 */
export const updateSchoolSubscriptionSchema = z.object({
  plan: subscriptionPlanEnum,
  status: licenseStatusEnum.optional(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  gracePeriodDays: z.coerce.number().int().min(0).max(90).default(14),
  maxStudents: z.coerce.number().int().min(1),
  maxUsers: z.coerce.number().int().min(1),
  maxStorageMB: z.coerce.number().int().min(50),
  features: z.array(z.string()).min(1),
  autoRenew: z.boolean().default(false),
  notes: z.string().trim().optional(),
});

export type UpdateSchoolSubscriptionInput = z.infer<typeof updateSchoolSubscriptionSchema>;

/**
 * Custom Domain Configuration & Verification
 */
export const configureCustomDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Domain must be at least 3 characters')
    .max(120, 'Domain cannot exceed 120 characters')
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, 'Invalid domain format (e.g. erp.schoolname.com)'),
  dnsRecordType: z.enum(['TXT', 'CNAME']).default('TXT'),
});

export type ConfigureCustomDomainInput = z.infer<typeof configureCustomDomainSchema>;

export const updateSchoolStatusSchema = z.object({
  status: schoolStatusEnum,
  reason: z.string().trim().max(500).optional(),
});

export type UpdateSchoolStatusInput = z.infer<typeof updateSchoolStatusSchema>;

/**
 * Support Access Session Authorization Schema
 */
export const createSupportAccessSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters').max(500),
  ticketReference: z.string().trim().min(2, 'Ticket reference is required').max(50),
  durationHours: z.coerce.number().int().min(1).max(72).default(24),
});

export type CreateSupportAccessInput = z.infer<typeof createSupportAccessSchema>;

/**
 * Subscription Invoice Schema
 */
export const createInvoiceSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  plan: subscriptionPlanEnum,
  amount: z.coerce.number().min(0),
  currency: z.string().default('USD'),
  billingCycle: z.string().default('Annual'),
  dueDate: z.string().min(1),
  notes: z.string().trim().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['paid', 'pending', 'overdue', 'void']),
  paymentMethod: z.string().trim().optional(),
  paidAt: z.string().optional(),
  notes: z.string().trim().optional(),
});

export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;

/**
 * School Query Schema
 */
export const schoolQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  status: schoolStatusEnum.optional(),
  plan: subscriptionPlanEnum.optional(),
  sortBy: z.enum(['name', 'createdAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SchoolQueryInput = z.infer<typeof schoolQuerySchema>;

/**
 * User Creation Validation Schema
 */
export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(70, 'Name cannot exceed 70 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(
    ['school_admin', 'teacher', 'staff', 'accountant', 'principal', 'librarian', 'parent', 'student'],
    {
      errorMap: () => ({ message: 'Invalid role specified' }),
    }
  ),
  schoolId: z
    .string()
    .optional(),
  studentId: z
    .string()
    .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// =============================================================================
// PHASE 2: STUDENT VALIDATION SCHEMAS
// =============================================================================

export const studentGenderEnum = z.enum(['male', 'female', 'other'], {
  errorMap: () => ({ message: 'Gender must be male, female, or other' }),
});

export const studentStatusEnum = z.enum(
  ['active', 'inactive', 'suspended', 'graduated', 'transferred'],
  {
    errorMap: () => ({ message: 'Status must be active, inactive, suspended, graduated, or transferred' }),
  }
);

export const addressSchema = z.object({
  street: z.string().trim().max(150).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  state: z.string().trim().max(80).optional().or(z.literal('')),
  postalCode: z.string().trim().max(20).optional().or(z.literal('')),
  country: z.string().trim().max(60).optional().or(z.literal('')),
});

export const guardianSchema = z.object({
  guardianName: z
    .string()
    .trim()
    .min(2, 'Guardian name must be at least 2 characters')
    .max(80, 'Guardian name cannot exceed 80 characters'),
  guardianRelation: z
    .string()
    .trim()
    .min(2, 'Guardian relationship is required (e.g. Father, Mother, Guardian)')
    .max(40),
  guardianPhone: z
    .string()
    .trim()
    .min(6, 'Valid guardian phone number is required')
    .max(25),
  guardianEmail: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  guardianOccupation: z.string().trim().max(80).optional().or(z.literal('')),
  guardianAddress: z.string().trim().max(200).optional().or(z.literal('')),
  fatherName: z.string().trim().max(80).optional().or(z.literal('')),
  fatherPhone: z.string().trim().max(25).optional().or(z.literal('')),
  fatherOccupation: z.string().trim().max(80).optional().or(z.literal('')),
  motherName: z.string().trim().max(80).optional().or(z.literal('')),
  motherPhone: z.string().trim().max(25).optional().or(z.literal('')),
  motherOccupation: z.string().trim().max(80).optional().or(z.literal('')),
});

export const createStudentSchema = z.object({
  admissionNumber: z
    .string()
    .trim()
    .max(30, 'Admission number cannot exceed 30 characters')
    .optional()
    .or(z.literal('')),
  admissionDate: z
    .string()
    .min(1, 'Admission date is required'),
  academicSession: z
    .string()
    .trim()
    .min(4, 'Academic session is required (e.g. 2026-2027)'),
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z
    .string()
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required'),
  gender: studentGenderEnum,
  bloodGroup: z.string().trim().max(10).optional().or(z.literal('')),
  nationalId: z.string().trim().max(50).optional().or(z.literal('')),
  photoUrl: z.string().trim().optional().or(z.literal('')),
  class: z
    .string()
    .trim()
    .min(1, 'Class/Grade is required'),
  section: z
    .string()
    .trim()
    .min(1, 'Section is required'),
  rollNumber: z.string().trim().max(20).optional().or(z.literal('')),
  email: z
    .string()
    .trim()
    .email('Invalid student email')
    .optional()
    .or(z.literal('')),
  phone: z.string().trim().max(25).optional().or(z.literal('')),
  currentAddress: addressSchema.default({}),
  permanentAddress: addressSchema.optional(),
  guardian: guardianSchema,
  status: studentStatusEnum.default('active'),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = createStudentSchema.partial();

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

export const updateStudentStatusSchema = z.object({
  status: studentStatusEnum,
  reason: z.string().trim().max(500).optional(),
});

export type UpdateStudentStatusInput = z.infer<typeof updateStudentStatusSchema>;

export const studentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  class: z.string().trim().optional(),
  section: z.string().trim().optional(),
  status: studentStatusEnum.optional(),
  gender: studentGenderEnum.optional(),
  academicSession: z.string().trim().optional(),
  sortBy: z.enum(['firstName', 'lastName', 'admissionNumber', 'admissionDate', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type StudentQueryInput = z.infer<typeof studentQuerySchema>;

// =============================================================================
// ACADEMIC VALIDATION SCHEMAS
// =============================================================================

export const createAcademicSessionSchema = z.object({
  name: z.string().trim().min(4, 'Session name is required (e.g. 2026-2027)').max(30),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isCurrent: z.boolean().default(false),
});
export type CreateAcademicSessionInput = z.infer<typeof createAcademicSessionSchema>;

export const createClassroomSchema = z.object({
  name: z.string().trim().min(1, 'Class name is required').max(50),
  code: z.string().trim().toUpperCase().min(1).max(20),
  numericOrder: z.coerce.number().int().min(0).default(0),
  sections: z.array(z.string().trim()).default(['A']),
});
export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;

export const createSectionSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  className: z.string().min(1, 'Class name is required'),
  name: z.string().trim().min(1, 'Section name is required (e.g. A, B)').max(20),
  maxCapacity: z.coerce.number().int().min(1).default(40),
  roomNumber: z.string().trim().optional(),
  classTeacherId: z.string().optional(),
  classTeacherName: z.string().optional(),
});
export type CreateSectionInput = z.infer<typeof createSectionSchema>;

export const createSubjectSchema = z.object({
  name: z.string().trim().min(2, 'Subject name is required').max(60),
  code: z.string().trim().toUpperCase().min(2).max(20),
  type: z.enum(['theory', 'practical', 'both']).default('theory'),
  passMarks: z.coerce.number().min(0).default(33),
  maxMarks: z.coerce.number().min(1).default(100),
});
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

// =============================================================================
// EMPLOYEE & FACULTY VALIDATION SCHEMAS
// =============================================================================

export const employeeRoleEnum = z.enum(['teacher', 'staff', 'accountant', 'principal', 'librarian']);
export const employeeStatusEnum = z.enum(['active', 'on_leave', 'resigned', 'terminated']);

export const createEmployeeSchema = z.object({
  employeeId: z.string().trim().max(30).optional(),
  firstName: z.string().trim().min(2, 'First name is required').max(50),
  lastName: z.string().trim().min(2, 'Last name is required').max(50),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().min(6, 'Valid phone is required').max(25),
  designation: z.string().trim().min(2, 'Designation is required').max(60),
  department: z.string().trim().min(2, 'Department is required').max(60),
  role: employeeRoleEnum.default('teacher'),
  qualification: z.string().trim().min(2, 'Qualification is required').max(100),
  joiningDate: z.string().min(1, 'Joining date is required'),
  basicSalary: z.coerce.number().min(0).default(0),
  assignedClasses: z.array(z.string()).default([]),
  assignedSubjects: z.array(z.string()).default([]),
  status: employeeStatusEnum.default('active'),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial();
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

// =============================================================================
// ATTENDANCE VALIDATION SCHEMAS
// =============================================================================

export const attendanceStatusEnum = z.enum(['present', 'absent', 'late', 'half_day', 'approved_leave']);

export const markAttendanceItemSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  status: attendanceStatusEnum,
  remarks: z.string().trim().max(200).optional(),
});

export const bulkMarkAttendanceSchema = z.object({
  class: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  date: z.string().min(1, 'Date is required'),
  records: z.array(markAttendanceItemSchema).min(1, 'At least one student record is required'),
});
export type BulkMarkAttendanceInput = z.infer<typeof bulkMarkAttendanceSchema>;

// =============================================================================
// FEE MANAGEMENT VALIDATION SCHEMAS
// =============================================================================

export const createFeeHeadSchema = z.object({
  name: z.string().trim().min(2, 'Fee head name is required').max(80),
  description: z.string().trim().max(200).optional(),
  feeType: z.enum(['recurring', 'one_time']).default('recurring'),
});
export type CreateFeeHeadInput = z.infer<typeof createFeeHeadSchema>;

export const createFeeStructureSchema = z.object({
  academicSession: z.string().min(1, 'Academic session is required'),
  class: z.string().min(1, 'Class is required'),
  feeHeadId: z.string().min(1, 'Fee head is required'),
  amount: z.coerce.number().min(0, 'Amount must be non-negative'),
  dueDate: z.string().min(1, 'Due date is required'),
  frequency: z.enum(['monthly', 'quarterly', 'annually', 'one_time']).default('monthly'),
});
export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;

export const recordFeePaymentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  feeRecordId: z.string().min(1, 'Fee record ID is required'),
  amount: z.coerce.number().min(0.01, 'Payment amount must be greater than zero'),
  paymentMethod: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'cheque']).default('cash'),
  transactionReference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(300).optional(),
});
export type RecordFeePaymentInput = z.infer<typeof recordFeePaymentSchema>;

// =============================================================================
// EXAMINATION VALIDATION SCHEMAS
// =============================================================================

export const createExaminationSchema = z.object({
  name: z.string().trim().min(2, 'Exam name is required').max(100),
  academicSession: z.string().min(1, 'Academic session is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  classes: z.array(z.string()).min(1, 'At least one class is required'),
});
export type CreateExaminationInput = z.infer<typeof createExaminationSchema>;

export const createExamScheduleSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  class: z.string().min(1, 'Class is required'),
  subject: z.string().min(1, 'Subject is required'),
  examDate: z.string().min(1, 'Exam date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  durationMinutes: z.coerce.number().int().min(15).default(180),
  maxMarks: z.coerce.number().min(1).default(100),
  passingMarks: z.coerce.number().min(0).default(33),
  roomNumber: z.string().trim().optional(),
});
export type CreateExamScheduleInput = z.infer<typeof createExamScheduleSchema>;

export const recordExamMarksSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  class: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  subject: z.string().min(1, 'Subject is required'),
  maxMarks: z.coerce.number().min(1).default(100),
  marks: z.array(
    z.object({
      studentId: z.string().min(1),
      theoryMarks: z.coerce.number().min(0).default(0),
      practicalMarks: z.coerce.number().min(0).default(0),
      isAbsent: z.boolean().default(false),
      remarks: z.string().trim().optional(),
    })
  ).min(1),
});
export type RecordExamMarksInput = z.infer<typeof recordExamMarksSchema>;

// =============================================================================
// TIMETABLE VALIDATION SCHEMAS
// =============================================================================

export const dayOfWeekEnum = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);

export const createTimetableSlotSchema = z.object({
  dayOfWeek: dayOfWeekEnum,
  periodNumber: z.coerce.number().int().min(1).max(12),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  class: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  subject: z.string().min(1, 'Subject is required'),
  teacherId: z.string().optional(),
  teacherName: z.string().optional(),
  roomNumber: z.string().optional(),
});
export type CreateTimetableSlotInput = z.infer<typeof createTimetableSlotSchema>;

// =============================================================================
// HOMEWORK & LMS VALIDATION SCHEMAS
// =============================================================================

export const createHomeworkSchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(150),
  description: z.string().trim().min(5, 'Description is required'),
  class: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  subject: z.string().min(1, 'Subject is required'),
  assignedDate: z.string().min(1, 'Assigned date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  attachments: z.array(z.string()).optional(),
});
export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema>;

export const submitHomeworkSchema = z.object({
  homeworkId: z.string().min(1, 'Homework ID is required'),
  studentId: z.string().optional(),
  content: z.string().trim().min(2, 'Submission content is required'),
  attachments: z.array(z.string()).optional(),
});
export type SubmitHomeworkInput = z.infer<typeof submitHomeworkSchema>;

// =============================================================================
// ADMISSIONS CRM VALIDATION SCHEMAS
// =============================================================================

export const enquiryStageEnum = z.enum([
  'new_lead',
  'counseling',
  'campus_visit',
  'application_submitted',
  'approved',
  'enrolled',
  'rejected',
]);

export const createAdmissionEnquirySchema = z.object({
  candidateName: z.string().trim().min(2, 'Candidate name is required').max(60),
  parentName: z.string().trim().min(2, 'Parent name is required').max(60),
  phone: z.string().trim().min(6, 'Phone is required').max(25),
  email: z.string().trim().email('Invalid email').optional().or(z.literal('')),
  applyingForClass: z.string().min(1, 'Applying class is required'),
  academicSession: z.string().min(4, 'Academic session is required'),
  stage: enquiryStageEnum.default('new_lead'),
  followUpDate: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
  assignedTo: z.string().optional(),
});
export type CreateAdmissionEnquiryInput = z.infer<typeof createAdmissionEnquirySchema>;

export const updateEnquiryStageSchema = z.object({
  stage: enquiryStageEnum,
  notes: z.string().trim().max(500).optional(),
  followUpDate: z.string().optional(),
});
export type UpdateEnquiryStageInput = z.infer<typeof updateEnquiryStageSchema>;

// =============================================================================
// WEBSITE CMS BUILDER VALIDATION SCHEMAS
// =============================================================================

export const createCmsPageSchema = z.object({
  slug: z.string().trim().toLowerCase().min(2).max(60).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(2).max(120),
  content: z.string().min(5),
  bannerImageUrl: z.string().optional().or(z.literal('')),
  isPublished: z.boolean().default(true),
  seoTitle: z.string().trim().max(100).optional(),
  seoDescription: z.string().trim().max(250).optional(),
  order: z.coerce.number().int().default(0),
});
export type CreateCmsPageInput = z.infer<typeof createCmsPageSchema>;

export const createCmsNoticeSchema = z.object({
  title: z.string().trim().min(2).max(150),
  category: z.enum(['general', 'academic', 'sports', 'holiday']).default('general'),
  content: z.string().trim().min(5),
  date: z.string().min(1),
  isPublished: z.boolean().default(true),
  attachmentUrl: z.string().optional(),
});
export type CreateCmsNoticeInput = z.infer<typeof createCmsNoticeSchema>;

// =============================================================================
// ACCOUNTING VALIDATION SCHEMAS
// =============================================================================

export const createAccountSchema = z.object({
  code: z.string().trim().toUpperCase().min(2).max(20),
  name: z.string().trim().min(2).max(80),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  balance: z.coerce.number().default(0),
});
export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const createJournalEntrySchema = z.object({
  date: z.string().min(1),
  description: z.string().trim().min(3).max(250),
  lines: z
    .array(
      z.object({
        accountId: z.string().min(1),
        accountName: z.string().min(1),
        debit: z.coerce.number().min(0).default(0),
        credit: z.coerce.number().min(0).default(0),
      })
    )
    .min(2, 'Journal entry must have at least two line items'),
  reference: z.string().trim().max(100).optional(),
});
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;

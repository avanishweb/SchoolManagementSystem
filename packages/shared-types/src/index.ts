export type UserRole =
  | 'super_admin'
  | 'school_admin'
  | 'teacher'
  | 'staff'
  | 'accountant'
  | 'parent'
  | 'student'
  | 'principal'
  | 'librarian';

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  studentId?: string; // For parent/student portals
  isActive: boolean;
  lastLoginAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type SchoolStatus = 'active' | 'suspended' | 'pending' | 'archived';

export type SubscriptionPlanType = 'trial' | 'monthly' | 'annual' | 'lifetime';

export type LicenseStatus = 'active' | 'expired' | 'grace_period' | 'suspended';

export type CustomDomainStatus = 'unconfigured' | 'pending' | 'verified' | 'failed';

export type SslStatus = 'active' | 'provisioning' | 'pending' | 'failed';

export interface ISchoolAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface ISchoolSettings {
  academicYear?: string;
  timezone?: string;
  currency?: string;
  dateFormat?: string;
  language?: string;
}

export interface ISchoolBranding {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  loginTitle?: string;
  loginSubtitle?: string;
  loginBannerUrl?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  taxId?: string;
  authorizedSignatoryName?: string;
  authorizedSignatoryTitle?: string;
  idCardTemplate?: 'modern' | 'classic' | 'minimal';
  idCardShowBloodGroup?: boolean;
  idCardShowEmergencyContact?: boolean;
  welcomeEmailTemplate?: string;
  feeReminderTemplate?: string;
  admissionNoticeTemplate?: string;
}

export interface ISubscription {
  plan: SubscriptionPlanType;
  status: LicenseStatus;
  startDate: string | Date;
  expiryDate: string | Date;
  gracePeriodDays: number;
  maxStudents: number;
  maxUsers: number;
  maxStorageMB: number;
  features: string[];
  autoRenew: boolean;
  notes?: string;
}

export interface ICustomDomain {
  domain: string;
  status: CustomDomainStatus;
  verificationToken: string;
  dnsRecordType: 'TXT' | 'CNAME';
  expectedValue: string;
  verifiedAt?: string | Date;
  lastCheckedAt?: string | Date;
  sslStatus: SslStatus;
  errorMessage?: string;
}

export interface ISchoolUsage {
  studentCount: number;
  userCount: number;
  storageUsedMB: number;
  lastActivityAt?: string | Date;
}

export interface ISchool {
  id: string;
  name: string;
  slug: string;
  code?: string;
  domain?: string;
  customDomain?: ICustomDomain;
  status: SchoolStatus;
  contactEmail?: string;
  contactPhone?: string;
  address?: ISchoolAddress;
  settings?: ISchoolSettings;
  branding?: ISchoolBranding;
  subscription?: ISubscription;
  usage?: ISchoolUsage;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IVendorAuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetSchoolId?: string;
  targetSchoolName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string | Date;
}

export interface ISupportAccessSession {
  id: string;
  schoolId: string;
  requestedBy: string;
  authorizedBy: string;
  reason: string;
  ticketReference: string;
  expiresAt: string | Date;
  isActive: boolean;
  createdAt: string | Date;
}

export interface ISubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  schoolId: string;
  schoolName: string;
  plan: SubscriptionPlanType;
  amount: number;
  currency: string;
  billingCycle: string;
  status: 'paid' | 'pending' | 'overdue' | 'void';
  dueDate: string | Date;
  paidAt?: string | Date;
  paymentMethod?: string;
  notes?: string;
  createdAt: string | Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  schoolId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponse {
  user: IUser;
  school: ISchool | null;
  accessToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  timestamp: string;
  environment: string;
  services: {
    database: 'connected' | 'disconnected' | 'connecting';
    server: 'operational';
  };
}

// =============================================================================
// PHASE 2: STUDENT MANAGEMENT TYPES
// =============================================================================

export type StudentStatus = 'active' | 'inactive' | 'suspended' | 'graduated' | 'transferred';

export type StudentGender = 'male' | 'female' | 'other';

export interface IStudentAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface IStudentGuardian {
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail?: string;
  guardianOccupation?: string;
  guardianAddress?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  motherOccupation?: string;
}

export interface IStudentDocument {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string | Date;
}

export interface IStudent {
  id: string;
  schoolId: string;
  admissionNumber: string;
  admissionDate: string | Date;
  academicSession: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  dateOfBirth: string | Date;
  gender: StudentGender;
  bloodGroup?: string;
  nationalId?: string;
  photoUrl?: string;
  class: string;
  section: string;
  rollNumber?: string;
  email?: string;
  phone?: string;
  currentAddress: IStudentAddress;
  permanentAddress?: IStudentAddress;
  guardian: IStudentGuardian;
  status: StudentStatus;
  documents?: IStudentDocument[];
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface StudentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  class?: string;
  section?: string;
  status?: StudentStatus;
  gender?: StudentGender;
  academicSession?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// ACADEMIC CONFIGURATION TYPES
// =============================================================================

export interface IAcademicSession {
  id: string;
  schoolId: string;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  isCurrent: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IClassroom {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  numericOrder: number;
  sections: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ISection {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  name: string;
  maxCapacity: number;
  roomNumber?: string;
  classTeacherId?: string;
  classTeacherName?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ISubject {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  type: 'theory' | 'practical' | 'both';
  passMarks: number;
  maxMarks: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// =============================================================================
// EMPLOYEE & FACULTY MANAGEMENT TYPES
// =============================================================================

export type EmployeeRole = 'teacher' | 'staff' | 'accountant' | 'principal' | 'librarian';
export type EmployeeStatus = 'active' | 'on_leave' | 'resigned' | 'terminated';

export interface IEmployee {
  id: string;
  schoolId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  role: EmployeeRole;
  qualification: string;
  joiningDate: string | Date;
  basicSalary: number;
  assignedClasses: string[];
  assignedSubjects: string[];
  status: EmployeeStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// =============================================================================
// ATTENDANCE MANAGEMENT TYPES
// =============================================================================

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'approved_leave';

export interface IStudentAttendance {
  id: string;
  schoolId: string;
  studentId: string;
  studentName?: string;
  admissionNumber?: string;
  rollNumber?: string;
  class: string;
  section: string;
  date: string | Date;
  status: AttendanceStatus;
  remarks?: string;
  markedBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IAttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  attendancePercentage: number;
}

// =============================================================================
// FEE MANAGEMENT TYPES
// =============================================================================

export interface IFeeHead {
  id: string;
  schoolId: string;
  name: string;
  description?: string;
  feeType: 'recurring' | 'one_time';
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IFeeStructure {
  id: string;
  schoolId: string;
  academicSession: string;
  class: string;
  feeHeadId: string;
  feeHeadName?: string;
  amount: number;
  dueDate: string | Date;
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one_time';
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IStudentFeeRecord {
  id: string;
  schoolId: string;
  studentId: string;
  studentName?: string;
  admissionNumber?: string;
  class: string;
  section: string;
  academicSession: string;
  feeStructureId: string;
  feeHeadName: string;
  amountDue: number;
  amountPaid: number;
  discount: number;
  lateFee: number;
  balance: number;
  dueDate: string | Date;
  status: 'unpaid' | 'partial' | 'paid' | 'waived';
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque';
export type PaymentStatus = 'completed' | 'cancelled' | 'refunded' | 'voided';

export interface IFeePayment {
  id: string;
  schoolId: string;
  receiptNumber: string;
  studentId: string;
  studentName?: string;
  admissionNumber?: string;
  class?: string;
  feeRecordId: string;
  feeHeadName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  paidAt: string | Date;
  cashierId: string;
  cashierName?: string;
  notes?: string;
  status: PaymentStatus;
  voidReason?: string;
  voidedAt?: string | Date;
  voidedBy?: string;
  voidedByName?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// =============================================================================
// EXAMINATION & GRADING TYPES
// =============================================================================

export interface IExamination {
  id: string;
  schoolId: string;
  name: string;
  academicSession: string;
  startDate: string | Date;
  endDate: string | Date;
  classes: string[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'published';
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IExamSchedule {
  id: string;
  schoolId: string;
  examId: string;
  class: string;
  subject: string;
  examDate: string | Date;
  startTime: string;
  durationMinutes: number;
  maxMarks: number;
  passingMarks: number;
  roomNumber?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IExamMark {
  id: string;
  schoolId: string;
  examId: string;
  studentId: string;
  studentName?: string;
  admissionNumber?: string;
  rollNumber?: string;
  class: string;
  section: string;
  subject: string;
  theoryMarks: number;
  practicalMarks: number;
  totalMarks: number;
  maxMarks: number;
  grade: string;
  isAbsent: boolean;
  remarks?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// =============================================================================
// TIMETABLE & CONFLICT ENGINE TYPES
// =============================================================================

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface ITimetableSlot {
  id?: string;
  _id?: string;
  schoolId?: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  class: string;
  section: string;
  subject: string;
  teacherId?: string;
  teacherName?: string;
  roomNumber?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// =============================================================================
// HOMEWORK & LMS TYPES
// =============================================================================

export interface IHomework {
  id?: string;
  _id?: string;
  schoolId?: string;
  title: string;
  description: string;
  class: string;
  section: string;
  subject: string;
  assignedDate: string | Date;
  dueDate: string | Date;
  teacherId?: string;
  teacherName?: string;
  maxMarks?: number;
  attachments?: string[];
  submissionCount?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IHomeworkSubmission {
  id?: string;
  _id?: string;
  schoolId?: string;
  homeworkId: string;
  studentId?: string;
  studentName?: string;
  submissionDate?: string | Date;
  submittedAt?: string | Date;
  content?: string;
  submissionContent?: string;
  attachments?: string[];
  status?: 'submitted' | 'evaluated' | 'late' | 'GRADED';
  isLate?: boolean;
  marks?: number;
  marksObtained?: number;
  feedback?: string;
  teacherFeedback?: string;
  evaluatedBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// =============================================================================
// ADMISSIONS CRM TYPES
// =============================================================================

export type EnquiryStage =
  | 'new_lead'
  | 'counseling'
  | 'campus_visit'
  | 'application_submitted'
  | 'approved'
  | 'enrolled'
  | 'rejected'
  | 'INQUIRY'
  | 'COUNSELING'
  | 'CAMPUS_VISIT'
  | 'APPLICATION_SUBMITTED'
  | 'APPROVED'
  | 'ENROLLED'
  | 'REJECTED';

export interface IAdmissionEnquiry {
  id?: string;
  _id?: string;
  schoolId?: string;
  enquiryNumber?: string;
  candidateName: string;
  studentName?: string;
  parentName: string;
  phone: string;
  parentPhone?: string;
  email?: string;
  parentEmail?: string;
  applyingForClass: string;
  targetClass?: string;
  academicSession: string;
  stage: EnquiryStage;
  followUpDate?: string | Date;
  notes?: string;
  leadSource?: string;
  convertedStudentId?: string;
  assignedTo?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// =============================================================================
// SCHOOL WEBSITE BUILDER (CMS) TYPES
// =============================================================================

export interface ICmsPage {
  id?: string;
  _id?: string;
  schoolId?: string;
  slug: string;
  title: string;
  content: string;
  bannerImageUrl?: string;
  isPublished: boolean;
  seoTitle?: string;
  metaTitle?: string;
  seoDescription?: string;
  metaDescription?: string;
  order?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ICmsNotice {
  id?: string;
  _id?: string;
  schoolId?: string;
  title: string;
  category?: 'general' | 'academic' | 'sports' | 'holiday' | string;
  content: string;
  date?: string | Date;
  publishedAt?: string | Date;
  priority?: string;
  isPublished?: boolean;
  isActive?: boolean;
  attachmentUrl?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// =============================================================================
// NOTIFICATION LOG TYPES
// =============================================================================

export interface INotificationLog {
  id?: string;
  _id?: string;
  schoolId?: string;
  recipientType: 'parent' | 'teacher' | 'student' | 'all';
  recipientContact: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'in_app';
  title: string;
  message: string;
  status: 'delivered' | 'sent' | 'failed' | 'pending';
  failureReason?: string;
  sentAt: string | Date;
  createdAt?: string | Date;
}

// =============================================================================
// ACCOUNTING & FINANCE TYPES
// =============================================================================

export interface IAccount {
  id?: string;
  _id?: string;
  schoolId?: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense' | 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  balance: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IJournalLine {
  accountId: string;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface IJournalEntry {
  id?: string;
  _id?: string;
  schoolId?: string;
  entryNumber?: string;
  date: string | Date;
  description: string;
  lines: IJournalLine[];
  reference?: string;
  totalAmount?: number;
  createdBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// =============================================================================
// ACADEMIC YEAR PROMOTION TYPES
// =============================================================================

export interface IPromotionStudentSnapshot {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  previousClass: string;
  previousSection: string;
  previousSession: string;
  previousStatus: string;
  targetClass: string;
  targetSection: string;
  targetSession: string;
  action: 'promoted' | 'retained' | 'graduated';
}

export interface IPromotionBatch {
  id?: string;
  schoolId?: string;
  batchNumber: string;
  fromSession: string;
  toSession: string;
  fromClass: string;
  toClass: string;
  promotedCount: number;
  promotedBy: string;
  promotedByName?: string;
  promotedAt: string | Date;
  isUndone: boolean;
  undoneAt?: string | Date;
  undoneBy?: string;
  undoneByName?: string;
  students: IPromotionStudentSnapshot[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// =============================================================================
// DAILY DIARY TYPES
// =============================================================================

export interface IDailyDiary {
  id?: string;
  schoolId?: string;
  date: string | Date;
  class: string;
  section: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  topicCovered: string;
  homeworkAssigned?: string;
  remarksNotes?: string;
  signOffStatus: 'draft' | 'published';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// =============================================================================
// ID CARD STUDIO TYPES
// =============================================================================

export type IdCardTemplate = 'modern' | 'classic' | 'minimal' | 'executive';

export interface IIdCardConfig {
  template: IdCardTemplate;
  cardType: 'student' | 'staff';
  orientation: 'vertical' | 'horizontal';
  showBloodGroup: boolean;
  showEmergencyContact: boolean;
  showBarcode: boolean;
  showPrincipalSign: boolean;
  showSchoolAddress: boolean;
  showSchoolLogo: boolean;
  primaryColor?: string;
  accentColor?: string;
}

// =============================================================================
// BULK WHATSAPP ALERTS & NOTICES TYPES
// =============================================================================

export interface IBulkWhatsAppPayload {
  audience: 'absent_today' | 'fee_defaulters' | 'class_parents' | 'all_parents';
  class?: string;
  section?: string;
  templateType: 'attendance_alert' | 'fee_reminder' | 'general_notice' | 'custom';
  customMessage?: string;
  date?: string;
  urgentNotice?: boolean;
}

export interface IBulkWhatsAppResult {
  totalTargeted: number;
  deliveredCount: number;
  failedCount: number;
  recipientLogs: Array<{
    name: string;
    phone: string;
    channel: string;
    status: string;
    message: string;
  }>;
}


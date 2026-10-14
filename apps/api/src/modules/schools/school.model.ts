import { Schema, model, Document, Model } from 'mongoose';
import { ISchool, SchoolStatus } from '@smart-school/shared-types';

export interface SchoolDocument extends Omit<ISchool, 'id'>, Document {
  id: string;
}

const schoolSchema = new Schema<SchoolDocument>(
  {
    name: {
      type: String,
      required: [true, 'School name is required'],
      trim: true,
      minlength: [2, 'School name must be at least 2 characters'],
      maxlength: [100, 'School name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'School slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^[a-z0-9-]+$/, 'Slug must contain only alphanumeric characters and hyphens'],
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      index: true,
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending', 'archived'],
      default: 'active' as SchoolStatus,
      index: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'US' },
    },
    settings: {
      academicYear: { type: String, default: '2026-2027' },
      timezone: { type: String, default: 'UTC' },
      currency: { type: String, default: 'USD' },
      dateFormat: { type: String, default: 'YYYY-MM-DD' },
      language: { type: String, default: 'en' },
    },
    branding: {
      logoUrl: { type: String, default: '' },
      faviconUrl: { type: String, default: '' },
      primaryColor: { type: String, default: '#4f46e5' },
      secondaryColor: { type: String, default: '#0f172a' },
      accentColor: { type: String, default: '#06b6d4' },
      loginTitle: { type: String, default: 'School Portal' },
      loginSubtitle: { type: String, default: 'Sign in to access your administrative dashboard and academic records.' },
      loginBannerUrl: { type: String, default: '' },
      receiptHeader: { type: String, default: 'Official Fee Receipt' },
      receiptFooter: { type: String, default: 'Thank you for your prompt payment.' },
      taxId: { type: String, default: '' },
      authorizedSignatoryName: { type: String, default: '' },
      authorizedSignatoryTitle: { type: String, default: '' },
      idCardTemplate: { type: String, enum: ['modern', 'classic', 'minimal'], default: 'modern' },
      idCardShowBloodGroup: { type: Boolean, default: true },
      idCardShowEmergencyContact: { type: Boolean, default: true },
      welcomeEmailTemplate: { type: String, default: '' },
      feeReminderTemplate: { type: String, default: '' },
      admissionNoticeTemplate: { type: String, default: '' },
    },
    subscription: {
      plan: { type: String, enum: ['trial', 'monthly', 'annual', 'lifetime'], default: 'trial' },
      status: { type: String, enum: ['active', 'expired', 'grace_period', 'suspended'], default: 'active' },
      startDate: { type: Date, default: Date.now },
      expiryDate: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default trial
      },
      gracePeriodDays: { type: Number, default: 14 },
      maxStudents: { type: Number, default: 50 },
      maxUsers: { type: Number, default: 5 },
      maxStorageMB: { type: Number, default: 500 },
      features: {
        type: [String],
        default: ['students', 'academics', 'branding'],
      },
      autoRenew: { type: Boolean, default: false },
      notes: { type: String, default: '' },
    },
    customDomain: {
      domain: { type: String, trim: true, lowercase: true },
      status: { type: String, enum: ['unconfigured', 'pending', 'verified', 'failed'], default: 'unconfigured' },
      verificationToken: { type: String, trim: true },
      dnsRecordType: { type: String, enum: ['TXT', 'CNAME'], default: 'TXT' },
      expectedValue: { type: String, trim: true },
      verifiedAt: { type: Date },
      lastCheckedAt: { type: Date },
      sslStatus: { type: String, enum: ['active', 'provisioning', 'pending', 'failed'], default: 'pending' },
      errorMessage: { type: String },
    },
    usage: {
      studentCount: { type: Number, default: 0 },
      userCount: { type: Number, default: 0 },
      storageUsedMB: { type: Number, default: 0 },
      lastActivityAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
schoolSchema.index({ 'customDomain.domain': 1 }, { unique: true, sparse: true });
schoolSchema.index({ 'subscription.status': 1 });
schoolSchema.index({ 'subscription.expiryDate': 1 });

export const School: Model<SchoolDocument> = model<SchoolDocument>('School', schoolSchema);

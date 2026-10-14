import { Schema, model, Document, Model, Types } from 'mongoose';
import {
  IFeeHead,
  IFeeStructure,
  IStudentFeeRecord,
  IFeePayment,
  PaymentMethod,
  PaymentStatus,
} from '@smart-school/shared-types';

// 1. Fee Head Model
export interface FeeHeadDocument extends Omit<IFeeHead, 'id' | 'schoolId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
}

const feeHeadSchema = new Schema<FeeHeadDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    feeType: {
      type: String,
      enum: ['recurring', 'one_time'],
      default: 'recurring',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        if (ret.schoolId) ret.schoolId = (ret.schoolId as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

feeHeadSchema.index({ schoolId: 1, name: 1 }, { unique: true });
export const FeeHead: Model<FeeHeadDocument> = model<FeeHeadDocument>('FeeHead', feeHeadSchema);

// 2. Fee Structure Model
export interface FeeStructureDocument extends Omit<IFeeStructure, 'id' | 'schoolId' | 'feeHeadId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
  feeHeadId: Types.ObjectId;
}

const feeStructureSchema = new Schema<FeeStructureDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    academicSession: {
      type: String,
      required: true,
      trim: true,
    },
    class: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    feeHeadId: {
      type: Schema.Types.ObjectId,
      ref: 'FeeHead',
      required: true,
    },
    feeHeadName: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'annually', 'one_time'],
      default: 'monthly',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        if (ret.schoolId) ret.schoolId = (ret.schoolId as { toString(): string }).toString();
        if (ret.feeHeadId) ret.feeHeadId = (ret.feeHeadId as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const FeeStructure: Model<FeeStructureDocument> = model<FeeStructureDocument>(
  'FeeStructure',
  feeStructureSchema
);

// 3. Student Fee Record Model
export interface StudentFeeRecordDocument
  extends Omit<IStudentFeeRecord, 'id' | 'schoolId' | 'studentId' | 'feeStructureId'>,
    Document {
  id: string;
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  feeStructureId: Types.ObjectId;
}

const studentFeeRecordSchema = new Schema<StudentFeeRecordDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    studentName: { type: String, trim: true },
    admissionNumber: { type: String, trim: true },
    class: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    academicSession: { type: String, required: true, trim: true },
    feeStructureId: {
      type: Schema.Types.ObjectId,
      ref: 'FeeStructure',
      required: true,
    },
    feeHeadName: { type: String, required: true, trim: true },
    amountDue: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    lateFee: { type: Number, default: 0, min: 0 },
    balance: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'waived'],
      default: 'unpaid',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        if (ret.schoolId) ret.schoolId = (ret.schoolId as { toString(): string }).toString();
        if (ret.studentId) ret.studentId = (ret.studentId as { toString(): string }).toString();
        if (ret.feeStructureId) ret.feeStructureId = (ret.feeStructureId as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

studentFeeRecordSchema.index({ schoolId: 1, studentId: 1, feeStructureId: 1 });
export const StudentFeeRecord: Model<StudentFeeRecordDocument> = model<StudentFeeRecordDocument>(
  'StudentFeeRecord',
  studentFeeRecordSchema
);

// 4. Fee Payment Model
export interface FeePaymentDocument
  extends Omit<IFeePayment, 'id' | 'schoolId' | 'studentId' | 'feeRecordId'>,
    Document {
  id: string;
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  feeRecordId: Types.ObjectId;
}

const feePaymentSchema = new Schema<FeePaymentDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    receiptNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    studentName: { type: String, trim: true },
    admissionNumber: { type: String, trim: true },
    class: { type: String, trim: true },
    feeRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'StudentFeeRecord',
      required: true,
    },
    feeHeadName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'bank_transfer', 'cheque'],
      default: 'cash' as PaymentMethod,
    },
    transactionReference: { type: String, trim: true },
    paidAt: { type: Date, default: Date.now },
    cashierId: { type: String, required: true, trim: true },
    cashierName: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ['completed', 'cancelled', 'refunded', 'voided'],
      default: 'completed' as PaymentStatus,
      index: true,
    },
    voidReason: { type: String, trim: true },
    voidedAt: { type: Date },
    voidedBy: { type: String, trim: true },
    voidedByName: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        if (ret.schoolId) ret.schoolId = (ret.schoolId as { toString(): string }).toString();
        if (ret.studentId) ret.studentId = (ret.studentId as { toString(): string }).toString();
        if (ret.feeRecordId) ret.feeRecordId = (ret.feeRecordId as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

feePaymentSchema.index({ schoolId: 1, receiptNumber: 1 }, { unique: true });
export const FeePayment: Model<FeePaymentDocument> = model<FeePaymentDocument>('FeePayment', feePaymentSchema);

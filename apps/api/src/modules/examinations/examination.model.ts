import { Schema, model, Document, Model, Types } from 'mongoose';
import { IExamination, IExamSchedule, IExamMark } from '@smart-school/shared-types';

// Examination Model
export interface ExaminationDocument extends Omit<IExamination, 'id' | 'schoolId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
}

const examinationSchema = new Schema<ExaminationDocument>(
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
    academicSession: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    classes: {
      type: [String],
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'published'],
      default: 'scheduled',
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
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

examinationSchema.index({ schoolId: 1, academicSession: 1, name: 1 }, { unique: true });
export const Examination: Model<ExaminationDocument> = model<ExaminationDocument>(
  'Examination',
  examinationSchema
);

// Exam Schedule Model
export interface ExamScheduleDocument extends Omit<IExamSchedule, 'id' | 'schoolId' | 'examId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
  examId: Types.ObjectId;
}

const examScheduleSchema = new Schema<ExamScheduleDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Examination',
      required: true,
      index: true,
    },
    class: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    examDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 180,
    },
    maxMarks: {
      type: Number,
      default: 100,
    },
    passingMarks: {
      type: Number,
      default: 33,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        if (ret.schoolId) ret.schoolId = (ret.schoolId as { toString(): string }).toString();
        if (ret.examId) ret.examId = (ret.examId as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

examScheduleSchema.index({ schoolId: 1, examId: 1, class: 1, subject: 1 }, { unique: true });
export const ExamSchedule: Model<ExamScheduleDocument> = model<ExamScheduleDocument>(
  'ExamSchedule',
  examScheduleSchema
);

// Exam Mark Model
export interface ExamMarkDocument
  extends Omit<IExamMark, 'id' | 'schoolId' | 'examId' | 'studentId'>,
    Document {
  id: string;
  schoolId: Types.ObjectId;
  examId: Types.ObjectId;
  studentId: Types.ObjectId;
}

const examMarkSchema = new Schema<ExamMarkDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Examination',
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
    rollNumber: { type: String, trim: true },
    class: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    theoryMarks: { type: Number, default: 0 },
    practicalMarks: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 100 },
    grade: { type: String, required: true, default: 'F' },
    isAbsent: { type: Boolean, default: false },
    remarks: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        if (ret.schoolId) ret.schoolId = (ret.schoolId as { toString(): string }).toString();
        if (ret.examId) ret.examId = (ret.examId as { toString(): string }).toString();
        if (ret.studentId) ret.studentId = (ret.studentId as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

examMarkSchema.index({ schoolId: 1, examId: 1, studentId: 1, subject: 1 }, { unique: true });
export const ExamMark: Model<ExamMarkDocument> = model<ExamMarkDocument>('ExamMark', examMarkSchema);

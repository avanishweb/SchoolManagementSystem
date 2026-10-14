import { Schema, model, Document, Model, Types } from 'mongoose';
import { IStudentAttendance, AttendanceStatus } from '@smart-school/shared-types';

export interface StudentAttendanceDocument extends Omit<IStudentAttendance, 'id' | 'schoolId' | 'studentId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
}

const studentAttendanceSchema = new Schema<StudentAttendanceDocument>(
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
    studentName: {
      type: String,
      trim: true,
    },
    admissionNumber: {
      type: String,
      trim: true,
    },
    rollNumber: {
      type: String,
      trim: true,
    },
    class: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half_day', 'approved_leave'],
      required: true,
      default: 'present' as AttendanceStatus,
    },
    remarks: {
      type: String,
      trim: true,
    },
    markedBy: {
      type: String,
      required: true,
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
        if (ret.studentId) ret.studentId = (ret.studentId as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// One attendance record per student per date per school
studentAttendanceSchema.index({ schoolId: 1, studentId: 1, date: 1 }, { unique: true });
studentAttendanceSchema.index({ schoolId: 1, class: 1, section: 1, date: 1 });

export const StudentAttendance: Model<StudentAttendanceDocument> = model<StudentAttendanceDocument>(
  'StudentAttendance',
  studentAttendanceSchema
);

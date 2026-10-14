import { Schema, model, Document, Model, Types } from 'mongoose';
import { IHomework, IHomeworkSubmission } from '@smart-school/shared-types';

export interface HomeworkDocument extends Omit<IHomework, 'id' | '_id' | 'schoolId' | 'teacherId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
  teacherId: Types.ObjectId;
}

const homeworkSchema = new Schema<HomeworkDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
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
    section: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    teacherName: {
      type: String,
      trim: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
    submissionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        if (ret.schoolId) ret.schoolId = (ret.schoolId as { toString(): string }).toString();
        if (ret.teacherId) ret.teacherId = (ret.teacherId as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

homeworkSchema.index({ schoolId: 1, class: 1, section: 1, dueDate: -1 });
export const Homework: Model<HomeworkDocument> = model<HomeworkDocument>('Homework', homeworkSchema);

// Submission Model
export interface HomeworkSubmissionDocument
  extends Omit<IHomeworkSubmission, 'id' | '_id' | 'schoolId' | 'homeworkId' | 'studentId'>,
    Document {
  id: string;
  schoolId: Types.ObjectId;
  homeworkId: Types.ObjectId;
  studentId: Types.ObjectId;
}

const homeworkSubmissionSchema = new Schema<HomeworkSubmissionDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    homeworkId: {
      type: Schema.Types.ObjectId,
      ref: 'Homework',
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
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['submitted', 'evaluated', 'late'],
      default: 'submitted',
    },
    marks: {
      type: Number,
    },
    feedback: {
      type: String,
      trim: true,
    },
    evaluatedBy: {
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
        if (ret.homeworkId) ret.homeworkId = (ret.homeworkId as { toString(): string }).toString();
        if (ret.studentId) ret.studentId = (ret.studentId as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

homeworkSubmissionSchema.index({ schoolId: 1, homeworkId: 1, studentId: 1 }, { unique: true });
export const HomeworkSubmission: Model<HomeworkSubmissionDocument> = model<HomeworkSubmissionDocument>(
  'HomeworkSubmission',
  homeworkSubmissionSchema
);

import { Schema, model, Document, Model, Types } from 'mongoose';
import {
  IAcademicSession,
  IClassroom,
  ISection,
  ISubject,
} from '@smart-school/shared-types';

export interface AcademicSessionDocument extends Omit<IAcademicSession, 'id' | 'schoolId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
}

const academicSessionSchema = new Schema<AcademicSessionDocument>(
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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
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

academicSessionSchema.index({ schoolId: 1, name: 1 }, { unique: true });

export const AcademicSession: Model<AcademicSessionDocument> = model<AcademicSessionDocument>(
  'AcademicSession',
  academicSessionSchema
);

// Classroom Model
export interface ClassroomDocument extends Omit<IClassroom, 'id' | 'schoolId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
}

const classroomSchema = new Schema<ClassroomDocument>(
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
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    numericOrder: {
      type: Number,
      default: 0,
    },
    sections: {
      type: [String],
      default: ['A'],
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

classroomSchema.index({ schoolId: 1, name: 1 }, { unique: true });

export const Classroom: Model<ClassroomDocument> = model<ClassroomDocument>(
  'Classroom',
  classroomSchema
);

// Section Model
export interface SectionDocument extends Omit<ISection, 'id' | 'schoolId' | 'classId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
}

const sectionSchema = new Schema<SectionDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
      index: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    maxCapacity: {
      type: Number,
      default: 40,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    classTeacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    classTeacherName: {
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
        if (ret.classId) ret.classId = (ret.classId as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

sectionSchema.index({ schoolId: 1, classId: 1, name: 1 }, { unique: true });

export const Section: Model<SectionDocument> = model<SectionDocument>('Section', sectionSchema);

// Subject Model
export interface SubjectDocument extends Omit<ISubject, 'id' | 'schoolId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
}

const subjectSchema = new Schema<SubjectDocument>(
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
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['theory', 'practical', 'both'],
      default: 'theory',
    },
    passMarks: {
      type: Number,
      default: 33,
    },
    maxMarks: {
      type: Number,
      default: 100,
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

subjectSchema.index({ schoolId: 1, code: 1 }, { unique: true });

export const Subject: Model<SubjectDocument> = model<SubjectDocument>('Subject', subjectSchema);

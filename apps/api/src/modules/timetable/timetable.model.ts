import { Schema, model, Document, Model, Types } from 'mongoose';
import { ITimetableSlot, DayOfWeek } from '@smart-school/shared-types';

export interface TimetableSlotDocument
  extends Omit<ITimetableSlot, 'id' | '_id' | 'schoolId' | 'teacherId'>,
    Document {
  id: string;
  schoolId: Types.ObjectId;
  teacherId?: Types.ObjectId;
}

const timetableSlotSchema = new Schema<TimetableSlotDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
      index: true,
    },
    periodNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
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
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      index: true,
    },
    teacherName: {
      type: String,
      trim: true,
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
        if (ret.teacherId) ret.teacherId = (ret.teacherId as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Prevent same class & section having multiple subjects at the same day & period
timetableSlotSchema.index({ schoolId: 1, dayOfWeek: 1, periodNumber: 1, class: 1, section: 1 }, { unique: true });

export const TimetableSlot: Model<TimetableSlotDocument> = model<TimetableSlotDocument>(
  'TimetableSlot',
  timetableSlotSchema
);

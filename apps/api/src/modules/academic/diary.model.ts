import { Schema, model, Document, Model, Types } from 'mongoose';
import { IDailyDiary } from '@smart-school/shared-types';

export interface DailyDiaryDocument extends Omit<IDailyDiary, 'id' | 'schoolId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
}

const dailyDiarySchema = new Schema<DailyDiaryDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
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
      type: String,
      required: true,
      trim: true,
    },
    teacherName: {
      type: String,
      required: true,
      trim: true,
    },
    topicCovered: {
      type: String,
      required: true,
      trim: true,
    },
    homeworkAssigned: {
      type: String,
      trim: true,
      default: '',
    },
    remarksNotes: {
      type: String,
      trim: true,
      default: '',
    },
    signOffStatus: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
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

dailyDiarySchema.index({ schoolId: 1, class: 1, section: 1, date: 1 });

export const DailyDiary: Model<DailyDiaryDocument> = model<DailyDiaryDocument>(
  'DailyDiary',
  dailyDiarySchema
);

import { Schema, model, Document, Model, Types } from 'mongoose';
import { IPromotionBatch, IPromotionStudentSnapshot } from '@smart-school/shared-types';

export interface PromotionBatchDocument extends Omit<IPromotionBatch, 'id' | 'schoolId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
}

const promotionStudentSnapshotSchema = new Schema<IPromotionStudentSnapshot>(
  {
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    admissionNumber: { type: String, required: true },
    previousClass: { type: String, required: true },
    previousSection: { type: String, required: true },
    previousSession: { type: String, required: true },
    previousStatus: { type: String, required: true },
    targetClass: { type: String, required: true },
    targetSection: { type: String, required: true },
    targetSession: { type: String, required: true },
    action: {
      type: String,
      enum: ['promoted', 'retained', 'graduated'],
      default: 'promoted',
    },
  },
  { _id: false }
);

const promotionBatchSchema = new Schema<PromotionBatchDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },
    fromSession: { type: String, required: true, trim: true },
    toSession: { type: String, required: true, trim: true },
    fromClass: { type: String, required: true, trim: true },
    toClass: { type: String, required: true, trim: true },
    promotedCount: { type: Number, required: true, min: 0 },
    promotedBy: { type: String, required: true, trim: true },
    promotedByName: { type: String, trim: true },
    promotedAt: { type: Date, default: Date.now },
    isUndone: { type: Boolean, default: false, index: true },
    undoneAt: { type: Date },
    undoneBy: { type: String, trim: true },
    undoneByName: { type: String, trim: true },
    students: [promotionStudentSnapshotSchema],
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

promotionBatchSchema.index({ schoolId: 1, batchNumber: 1 }, { unique: true });

export const PromotionBatch: Model<PromotionBatchDocument> = model<PromotionBatchDocument>(
  'PromotionBatch',
  promotionBatchSchema
);

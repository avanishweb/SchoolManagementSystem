import { Schema, model, Document, Model } from 'mongoose';
import { ISupportAccessSession } from '@smart-school/shared-types';

export interface SupportSessionDocument extends Omit<ISupportAccessSession, 'id'>, Document {
  id: string;
}

const supportSessionSchema = new Schema<SupportSessionDocument>(
  {
    schoolId: {
      type: String,
      required: true,
      index: true,
    },
    requestedBy: {
      type: String,
      required: true,
    },
    authorizedBy: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    ticketReference: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

supportSessionSchema.index({ schoolId: 1, isActive: 1, expiresAt: 1 });

export const SupportSession: Model<SupportSessionDocument> = model<SupportSessionDocument>(
  'SupportSession',
  supportSessionSchema
);

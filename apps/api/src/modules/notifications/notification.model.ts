import { Schema, model, Document, Model, Types } from 'mongoose';
import { INotificationLog } from '@smart-school/shared-types';

export interface NotificationLogDocument
  extends Omit<INotificationLog, 'id' | '_id' | 'schoolId'>,
    Document {
  id: string;
  schoolId: Types.ObjectId;
}

const notificationLogSchema = new Schema<NotificationLogDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    recipientType: {
      type: String,
      enum: ['parent', 'teacher', 'student', 'all'],
      required: true,
    },
    recipientContact: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'in_app'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['delivered', 'sent', 'failed', 'pending'],
      default: 'sent',
    },
    failureReason: {
      type: String,
      trim: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
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

notificationLogSchema.index({ schoolId: 1, sentAt: -1 });
export const NotificationLog: Model<NotificationLogDocument> = model<NotificationLogDocument>(
  'NotificationLog',
  notificationLogSchema
);

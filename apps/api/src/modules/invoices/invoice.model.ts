import { Schema, model, Document, Model } from 'mongoose';
import { ISubscriptionInvoice, SubscriptionPlanType } from '@smart-school/shared-types';

export interface InvoiceDocument extends Omit<ISubscriptionInvoice, 'id'>, Document {
  id: string;
}

const invoiceSchema = new Schema<InvoiceDocument>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    schoolId: {
      type: String,
      required: true,
      index: true,
    },
    schoolName: {
      type: String,
      required: true,
      trim: true,
    },
    plan: {
      type: String,
      enum: ['trial', 'monthly', 'annual', 'lifetime'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    billingCycle: {
      type: String,
      default: 'Annual',
      trim: true,
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'overdue', 'void'],
      default: 'pending',
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidAt: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    notes: {
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
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

invoiceSchema.index({ schoolId: 1, createdAt: -1 });

export const SubscriptionInvoice: Model<InvoiceDocument> = model<InvoiceDocument>(
  'SubscriptionInvoice',
  invoiceSchema
);

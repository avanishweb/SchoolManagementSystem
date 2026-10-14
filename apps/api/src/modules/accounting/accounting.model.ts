import { Schema, model, Document, Model, Types } from 'mongoose';
import { IAccount, IJournalEntry, IJournalLine } from '@smart-school/shared-types';

export interface AccountDocument extends Omit<IAccount, 'id' | '_id' | 'schoolId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
}

const accountSchema = new Schema<AccountDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['asset', 'liability', 'equity', 'income', 'expense'],
      required: true,
      index: true,
    },
    balance: {
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
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

accountSchema.index({ schoolId: 1, code: 1 }, { unique: true });
export const Account: Model<AccountDocument> = model<AccountDocument>('Account', accountSchema);

// Journal Entry Model
export interface JournalEntryDocument extends Omit<IJournalEntry, 'id' | '_id' | 'schoolId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
}

const journalLineSchema = new Schema<IJournalLine>(
  {
    accountId: { type: String, required: true },
    accountName: { type: String, required: true },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const journalEntrySchema = new Schema<JournalEntryDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    entryNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    lines: {
      type: [journalLineSchema],
      required: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    createdBy: {
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
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

journalEntrySchema.index({ schoolId: 1, entryNumber: 1 }, { unique: true });
export const JournalEntry: Model<JournalEntryDocument> = model<JournalEntryDocument>(
  'JournalEntry',
  journalEntrySchema
);

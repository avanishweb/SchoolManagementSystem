import { Schema, model, Document, Model } from 'mongoose';
import { IVendorAuditLog } from '@smart-school/shared-types';

export interface AuditLogDocument extends Omit<IVendorAuditLog, 'id'>, Document {
  id: string;
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    actorId: {
      type: String,
      required: true,
      index: true,
    },
    actorEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetSchoolId: {
      type: String,
      index: true,
      sparse: true,
    },
    targetSchoolName: {
      type: String,
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
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

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetSchoolId: 1, createdAt: -1 });

export const AuditLog: Model<AuditLogDocument> = model<AuditLogDocument>('AuditLog', auditLogSchema);

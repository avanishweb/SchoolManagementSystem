import { Schema, model, Document, Model, Types } from 'mongoose';
import { IAdmissionEnquiry, EnquiryStage } from '@smart-school/shared-types';

export interface AdmissionEnquiryDocument
  extends Omit<IAdmissionEnquiry, 'id' | '_id' | 'schoolId'>,
    Document {
  id: string;
  schoolId: Types.ObjectId;
}

const admissionEnquirySchema = new Schema<AdmissionEnquiryDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    enquiryNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },
    parentName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    applyingForClass: {
      type: String,
      required: true,
      trim: true,
    },
    academicSession: {
      type: String,
      required: true,
      trim: true,
    },
    stage: {
      type: String,
      enum: [
        'new_lead',
        'counseling',
        'campus_visit',
        'application_submitted',
        'approved',
        'enrolled',
        'rejected',
      ],
      default: 'new_lead' as EnquiryStage,
      index: true,
    },
    followUpDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    assignedTo: {
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
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

admissionEnquirySchema.index({ schoolId: 1, enquiryNumber: 1 }, { unique: true });
export const AdmissionEnquiry: Model<AdmissionEnquiryDocument> = model<AdmissionEnquiryDocument>(
  'AdmissionEnquiry',
  admissionEnquirySchema
);

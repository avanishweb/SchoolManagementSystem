import { Schema, model, Document, Model, Types } from 'mongoose';
import { IStudent, StudentStatus, StudentGender, IStudentDocument } from '@smart-school/shared-types';

export interface StudentDocument extends Omit<IStudent, 'id' | 'schoolId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
}

const studentDocumentSchema = new Schema<IStudentDocument>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const studentSchema = new Schema<StudentDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School ID is required for student record'],
      index: true,
    },
    admissionNumber: {
      type: String,
      required: [true, 'Admission number is required'],
      trim: true,
      uppercase: true,
    },
    admissionDate: {
      type: Date,
      required: [true, 'Admission date is required'],
      default: Date.now,
    },
    academicSession: {
      type: String,
      required: [true, 'Academic session is required'],
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required'],
      index: true,
    },
    bloodGroup: {
      type: String,
      trim: true,
      uppercase: true,
    },
    nationalId: {
      type: String,
      trim: true,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    class: {
      type: String,
      required: [true, 'Class assignment is required'],
      trim: true,
      index: true,
    },
    section: {
      type: String,
      required: [true, 'Section assignment is required'],
      trim: true,
      index: true,
    },
    rollNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    currentAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'US' },
    },
    permanentAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'US' },
    },
    guardian: {
      guardianName: {
        type: String,
        required: [true, 'Guardian name is required'],
        trim: true,
      },
      guardianRelation: {
        type: String,
        required: [true, 'Guardian relationship is required'],
        trim: true,
      },
      guardianPhone: {
        type: String,
        required: [true, 'Guardian phone is required'],
        trim: true,
      },
      guardianEmail: { type: String, trim: true, lowercase: true },
      guardianOccupation: { type: String, trim: true },
      guardianAddress: { type: String, trim: true },
      fatherName: { type: String, trim: true },
      fatherPhone: { type: String, trim: true },
      fatherOccupation: { type: String, trim: true },
      motherName: { type: String, trim: true },
      motherPhone: { type: String, trim: true },
      motherOccupation: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'graduated', 'transferred'],
      default: 'active' as StudentStatus,
      index: true,
    },
    documents: [studentDocumentSchema],
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
        if (ret.schoolId) {
          ret.schoolId = (ret.schoolId as { toString(): string }).toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual property for student's full name
studentSchema.virtual('fullName').get(function (this: StudentDocument) {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Compound unique index: Duplicate protection for admission numbers strictly within each school tenant
studentSchema.index({ schoolId: 1, admissionNumber: 1 }, { unique: true });

// Compound indexes for high-frequency queries
studentSchema.index({ schoolId: 1, class: 1, section: 1 });
studentSchema.index({ schoolId: 1, status: 1 });
studentSchema.index({ schoolId: 1, firstName: 1, lastName: 1 });

export const Student: Model<StudentDocument> = model<StudentDocument>('Student', studentSchema);

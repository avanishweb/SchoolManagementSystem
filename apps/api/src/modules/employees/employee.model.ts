import { Schema, model, Document, Model, Types } from 'mongoose';
import { IEmployee, EmployeeRole, EmployeeStatus } from '@smart-school/shared-types';

export interface EmployeeDocument extends Omit<IEmployee, 'id' | 'schoolId'>, Document {
  id: string;
  schoolId: Types.ObjectId;
}

const employeeSchema = new Schema<EmployeeDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['teacher', 'staff', 'accountant', 'principal', 'librarian'],
      default: 'teacher' as EmployeeRole,
      index: true,
    },
    qualification: {
      type: String,
      required: true,
      trim: true,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    basicSalary: {
      type: Number,
      default: 0,
    },
    assignedClasses: {
      type: [String],
      default: [],
    },
    assignedSubjects: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'on_leave', 'resigned', 'terminated'],
      default: 'active' as EmployeeStatus,
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

employeeSchema.virtual('fullName').get(function (this: EmployeeDocument) {
  return `${this.firstName} ${this.lastName}`.trim();
});

employeeSchema.index({ schoolId: 1, employeeId: 1 }, { unique: true });
employeeSchema.index({ schoolId: 1, email: 1 });

export const Employee: Model<EmployeeDocument> = model<EmployeeDocument>('Employee', employeeSchema);

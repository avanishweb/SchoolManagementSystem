import { Types } from 'mongoose';
import {
  FeeHead,
  FeeHeadDocument,
  FeeStructure,
  FeeStructureDocument,
  StudentFeeRecord,
  StudentFeeRecordDocument,
  FeePayment,
  FeePaymentDocument,
} from './fee.model.js';
import { Student } from '../students/student.model.js';
import {
  CreateFeeHeadInput,
  CreateFeeStructureInput,
  RecordFeePaymentInput,
} from '@smart-school/validation';
import { AppError } from '../../utils/appError.js';

export class FeeService {
  // FEE HEADS
  async listFeeHeads(schoolId: string): Promise<FeeHeadDocument[]> {
    return FeeHead.find({ schoolId: new Types.ObjectId(schoolId) }).sort({ name: 1 });
  }

  async createFeeHead(schoolId: string, input: CreateFeeHeadInput): Promise<FeeHeadDocument> {
    const existing = await FeeHead.findOne({
      schoolId: new Types.ObjectId(schoolId),
      name: input.name.trim(),
    });

    if (existing) {
      throw AppError.conflict(`Fee head '${input.name}' already exists in this school.`);
    }

    const feeHead = new FeeHead({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
    });

    await feeHead.save();
    return feeHead;
  }

  // FEE STRUCTURES & ALLOCATION
  async listFeeStructures(schoolId: string, className?: string): Promise<FeeStructureDocument[]> {
    const filter: Record<string, unknown> = { schoolId: new Types.ObjectId(schoolId) };
    if (className) filter.class = className;
    return FeeStructure.find(filter).sort({ dueDate: 1 });
  }

  async createFeeStructure(schoolId: string, input: CreateFeeStructureInput): Promise<FeeStructureDocument> {
    const head = await FeeHead.findOne({
      _id: new Types.ObjectId(input.feeHeadId),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!head) {
      throw AppError.notFound('Fee head not found.');
    }

    const structure = new FeeStructure({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
      feeHeadId: new Types.ObjectId(input.feeHeadId),
      feeHeadName: head.name,
      dueDate: new Date(input.dueDate),
    });

    await structure.save();

    // Auto-allocate this fee structure to all current students in that class
    const students = await Student.find({
      schoolId: new Types.ObjectId(schoolId),
      class: input.class,
      status: 'active',
    });

    for (const st of students) {
      await StudentFeeRecord.create({
        schoolId: new Types.ObjectId(schoolId),
        studentId: st._id,
        studentName: st.fullName,
        admissionNumber: st.admissionNumber,
        class: st.class,
        section: st.section,
        academicSession: input.academicSession,
        feeStructureId: structure._id,
        feeHeadName: head.name,
        amountDue: input.amount,
        amountPaid: 0,
        discount: 0,
        lateFee: 0,
        balance: input.amount,
        dueDate: structure.dueDate,
        status: 'unpaid',
      });
    }

    return structure;
  }

  // STUDENT FEE RECORDS
  async listStudentFees(schoolId: string, studentId: string): Promise<StudentFeeRecordDocument[]> {
    return StudentFeeRecord.find({
      schoolId: new Types.ObjectId(schoolId),
      studentId: new Types.ObjectId(studentId),
    }).sort({ dueDate: 1 });
  }

  // PAYMENTS & RECEIPTS
  async generateReceiptNumber(schoolId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await FeePayment.countDocuments({ schoolId: new Types.ObjectId(schoolId) });
    return `REC-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async recordPayment(
    schoolId: string,
    cashierId: string,
    cashierName: string,
    input: RecordFeePaymentInput
  ): Promise<{ payment: FeePaymentDocument; updatedRecord: StudentFeeRecordDocument }> {
    const record = await StudentFeeRecord.findOne({
      _id: new Types.ObjectId(input.feeRecordId),
      schoolId: new Types.ObjectId(schoolId),
      studentId: new Types.ObjectId(input.studentId),
    });

    if (!record) {
      throw AppError.notFound('Student fee invoice not found.');
    }

    if (record.status === 'paid') {
      throw AppError.badRequest('This fee invoice is already fully settled.');
    }

    if (input.amount > record.balance) {
      throw AppError.badRequest(`Payment amount ($${input.amount}) exceeds outstanding balance ($${record.balance}).`);
    }

    const receiptNumber = await this.generateReceiptNumber(schoolId);

    const payment = new FeePayment({
      schoolId: new Types.ObjectId(schoolId),
      receiptNumber,
      studentId: record.studentId,
      studentName: record.studentName,
      admissionNumber: record.admissionNumber,
      class: record.class,
      feeRecordId: record._id,
      feeHeadName: record.feeHeadName,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      transactionReference: input.transactionReference,
      paidAt: new Date(),
      cashierId,
      cashierName,
      notes: input.notes,
      status: 'completed',
    });

    await payment.save();

    // Update StudentFeeRecord balance and status
    record.amountPaid += input.amount;
    record.balance = Math.max(0, record.amountDue - record.amountPaid - record.discount + record.lateFee);
    record.status = record.balance === 0 ? 'paid' : 'partial';

    await record.save();

    return { payment, updatedRecord: record };
  }

  async listPayments(schoolId: string, studentId?: string): Promise<FeePaymentDocument[]> {
    const filter: Record<string, unknown> = { schoolId: new Types.ObjectId(schoolId) };
    if (studentId) filter.studentId = new Types.ObjectId(studentId);
    return FeePayment.find(filter).sort({ paidAt: -1 }).limit(100);
  }

  // VOID / REVERSAL WITH AUDIT TRAIL
  async voidPayment(
    schoolId: string,
    paymentId: string,
    voidedBy: string,
    voidedByName: string,
    reason: string
  ): Promise<{ payment: FeePaymentDocument; updatedRecord: StudentFeeRecordDocument }> {
    const payment = await FeePayment.findOne({
      _id: new Types.ObjectId(paymentId),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!payment) {
      throw AppError.notFound('Payment receipt not found.');
    }

    if (payment.status === 'voided') {
      throw AppError.badRequest('This payment receipt has already been voided/reversed.');
    }

    const record = await StudentFeeRecord.findOne({
      _id: payment.feeRecordId,
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!record) {
      throw AppError.notFound('Associated student fee record not found.');
    }

    // Mark payment voided with reason and audit timestamp
    payment.status = 'voided';
    payment.voidReason = reason || 'Administrative void / reversal';
    payment.voidedAt = new Date();
    payment.voidedBy = voidedBy;
    payment.voidedByName = voidedByName;
    await payment.save();

    // Reverse payment amount on StudentFeeRecord
    record.amountPaid = Math.max(0, record.amountPaid - payment.amount);
    record.balance = Math.max(0, record.amountDue - record.amountPaid - record.discount + record.lateFee);
    record.status = record.amountPaid === 0 ? 'unpaid' : record.balance === 0 ? 'paid' : 'partial';
    await record.save();

    return { payment, updatedRecord: record };
  }

  // DEFAULTERS
  async listDefaulters(schoolId: string, className?: string): Promise<StudentFeeRecordDocument[]> {
    const filter: Record<string, unknown> = {
      schoolId: new Types.ObjectId(schoolId),
      status: { $in: ['unpaid', 'partial'] },
      dueDate: { $lt: new Date() },
    };
    if (className) filter.class = className;

    return StudentFeeRecord.find(filter).sort({ dueDate: 1 });
  }
}

export const feeService = new FeeService();

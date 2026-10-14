import { Types } from 'mongoose';
import { PromotionBatch, PromotionBatchDocument } from './promotion.model.js';
import { Student } from '../students/student.model.js';
import { auditService } from '../audit/audit.service.js';
import { AppError } from '../../utils/appError.js';
import { IPromotionStudentSnapshot } from '@smart-school/shared-types';

export interface PromoteStudentsInput {
  fromSession: string;
  toSession: string;
  fromClass: string;
  toClass: string;
  students: Array<{
    studentId: string;
    targetSection?: string;
    action?: 'promoted' | 'retained' | 'graduated';
  }>;
}

export class PromotionService {
  async generateBatchNumber(schoolId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await PromotionBatch.countDocuments({ schoolId: new Types.ObjectId(schoolId) });
    return `PROM-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async promoteStudents(
    schoolId: string,
    actorId: string,
    actorName: string,
    input: PromoteStudentsInput
  ): Promise<PromotionBatchDocument> {
    if (!input.students || input.students.length === 0) {
      throw AppError.badRequest('No students selected for promotion.');
    }

    const batchNumber = await this.generateBatchNumber(schoolId);
    const snapshots: IPromotionStudentSnapshot[] = [];

    for (const item of input.students) {
      const student = await Student.findOne({
        _id: new Types.ObjectId(item.studentId),
        schoolId: new Types.ObjectId(schoolId),
      });

      if (!student) continue;

      const action = item.action || 'promoted';
      const targetSection = item.targetSection || student.section || 'A';

      // Record snapshot before mutating
      snapshots.push({
        studentId: student.id,
        studentName: student.fullName || `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        previousClass: student.class,
        previousSection: student.section,
        previousSession: student.academicSession,
        previousStatus: student.status,
        targetClass: action === 'promoted' ? input.toClass : student.class,
        targetSection,
        targetSession: input.toSession,
        action,
      });

      // Mutate student state
      if (action === 'promoted') {
        student.class = input.toClass;
        student.section = targetSection;
        student.academicSession = input.toSession;
        student.status = 'active';
      } else if (action === 'retained') {
        student.class = input.fromClass;
        student.section = targetSection;
        student.academicSession = input.toSession;
        student.status = 'active';
      } else if (action === 'graduated') {
        student.academicSession = input.toSession;
        student.status = 'graduated';
      }

      await student.save();
    }

    const batch = new PromotionBatch({
      schoolId: new Types.ObjectId(schoolId),
      batchNumber,
      fromSession: input.fromSession,
      toSession: input.toSession,
      fromClass: input.fromClass,
      toClass: input.toClass,
      promotedCount: snapshots.length,
      promotedBy: actorId,
      promotedByName: actorName,
      promotedAt: new Date(),
      isUndone: false,
      students: snapshots,
    });

    await batch.save();

    await auditService.record({
      actorId,
      actorEmail: actorName,
      actorRole: 'school_admin',
      action: 'academic.students_promoted',
      targetSchoolId: schoolId,
      details: {
        batchNumber,
        fromClass: input.fromClass,
        toClass: input.toClass,
        fromSession: input.fromSession,
        toSession: input.toSession,
        studentCount: snapshots.length,
      },
    });

    return batch;
  }

  async undoPromotion(
    schoolId: string,
    batchId: string,
    actorId: string,
    actorName: string
  ): Promise<PromotionBatchDocument> {
    const batch = await PromotionBatch.findOne({
      _id: new Types.ObjectId(batchId),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!batch) {
      throw AppError.notFound('Promotion batch record not found.');
    }

    if (batch.isUndone) {
      throw AppError.badRequest('This promotion batch has already been undone.');
    }

    // Rollback every student to their exact previous snapshot
    for (const snap of batch.students) {
      const student = await Student.findOne({
        _id: new Types.ObjectId(snap.studentId),
        schoolId: new Types.ObjectId(schoolId),
      });

      if (!student) continue;

      student.class = snap.previousClass;
      student.section = snap.previousSection;
      student.academicSession = snap.previousSession;
      student.status = snap.previousStatus as any;

      await student.save();
    }

    batch.isUndone = true;
    batch.undoneAt = new Date();
    batch.undoneBy = actorId;
    batch.undoneByName = actorName;
    await batch.save();

    await auditService.record({
      actorId,
      actorEmail: actorName,
      actorRole: 'school_admin',
      action: 'academic.promotion_undone',
      targetSchoolId: schoolId,
      details: {
        batchNumber: batch.batchNumber,
        studentCount: batch.students.length,
      },
    });

    return batch;
  }

  async listBatches(schoolId: string): Promise<PromotionBatchDocument[]> {
    return PromotionBatch.find({ schoolId: new Types.ObjectId(schoolId) })
      .sort({ promotedAt: -1 })
      .limit(50);
  }
}

export const promotionService = new PromotionService();

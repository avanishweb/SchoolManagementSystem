import { Types } from 'mongoose';
import { TimetableSlot, TimetableSlotDocument } from './timetable.model.js';
import { CreateTimetableSlotInput } from '@smart-school/validation';
import { AppError } from '../../utils/appError.js';

export interface ConflictCheckResult {
  hasConflict: boolean;
  type?: 'teacher' | 'room' | 'class';
  message?: string;
}

export class TimetableService {
  /**
   * Conflict Detection Engine
   */
  async checkConflict(
    schoolId: string,
    slot: CreateTimetableSlotInput,
    excludeSlotId?: string
  ): Promise<ConflictCheckResult> {
    const baseFilter: Record<string, unknown> = {
      schoolId: new Types.ObjectId(schoolId),
      dayOfWeek: slot.dayOfWeek,
      periodNumber: slot.periodNumber,
    };

    if (excludeSlotId && Types.ObjectId.isValid(excludeSlotId)) {
      baseFilter._id = { $ne: new Types.ObjectId(excludeSlotId) };
    }

    // 1. Check Class & Section Conflict
    const classConflict = await TimetableSlot.findOne({
      ...baseFilter,
      class: slot.class,
      section: slot.section,
    });

    if (classConflict) {
      return {
        hasConflict: true,
        type: 'class',
        message: `Class ${slot.class}-${slot.section} already has '${classConflict.subject}' scheduled at Period ${slot.periodNumber} on ${slot.dayOfWeek}.`,
      };
    }

    // 2. Check Teacher Conflict
    if (slot.teacherId && Types.ObjectId.isValid(slot.teacherId)) {
      const teacherConflict = await TimetableSlot.findOne({
        ...baseFilter,
        teacherId: new Types.ObjectId(slot.teacherId),
      });

      if (teacherConflict) {
        return {
          hasConflict: true,
          type: 'teacher',
          message: `Teacher ${slot.teacherName || 'assigned'} is already teaching ${teacherConflict.class}-${teacherConflict.section} (${teacherConflict.subject}) during Period ${slot.periodNumber} on ${slot.dayOfWeek}.`,
        };
      }
    }

    // 3. Check Room Conflict
    if (slot.roomNumber && slot.roomNumber.trim()) {
      const roomConflict = await TimetableSlot.findOne({
        ...baseFilter,
        roomNumber: slot.roomNumber.trim(),
      });

      if (roomConflict) {
        return {
          hasConflict: true,
          type: 'room',
          message: `Room ${slot.roomNumber} is already occupied by ${roomConflict.class}-${roomConflict.section} for ${roomConflict.subject} during Period ${slot.periodNumber} on ${slot.dayOfWeek}.`,
        };
      }
    }

    return { hasConflict: false };
  }

  async createSlot(schoolId: string, input: CreateTimetableSlotInput): Promise<TimetableSlotDocument> {
    const conflict = await this.checkConflict(schoolId, input);
    if (conflict.hasConflict) {
      throw AppError.conflict(conflict.message || 'Timetable scheduling conflict detected.');
    }

    const slot = new TimetableSlot({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
      teacherId: input.teacherId ? new Types.ObjectId(input.teacherId) : undefined,
    });

    await slot.save();
    return slot;
  }

  async listClassTimetable(
    schoolId: string,
    className: string,
    section: string
  ): Promise<TimetableSlotDocument[]> {
    return TimetableSlot.find({
      schoolId: new Types.ObjectId(schoolId),
      class: className,
      section,
    }).sort({ periodNumber: 1 });
  }

  async listTeacherTimetable(schoolId: string, teacherId: string): Promise<TimetableSlotDocument[]> {
    return TimetableSlot.find({
      schoolId: new Types.ObjectId(schoolId),
      teacherId: new Types.ObjectId(teacherId),
    }).sort({ periodNumber: 1 });
  }

  async deleteSlot(schoolId: string, slotId: string): Promise<void> {
    const deleted = await TimetableSlot.findOneAndDelete({
      _id: new Types.ObjectId(slotId),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!deleted) {
      throw AppError.notFound('Timetable slot not found.');
    }
  }
}

export const timetableService = new TimetableService();

import { Types } from 'mongoose';
import { DailyDiary, DailyDiaryDocument } from './diary.model.js';
import { AppError } from '../../utils/appError.js';

export interface CreateDailyDiaryInput {
  date: string | Date;
  class: string;
  section: string;
  subject: string;
  topicCovered: string;
  homeworkAssigned?: string;
  remarksNotes?: string;
  signOffStatus?: 'draft' | 'published';
}

export class DailyDiaryService {
  async listEntries(
    schoolId: string,
    className?: string,
    section?: string,
    dateStr?: string
  ): Promise<DailyDiaryDocument[]> {
    const filter: Record<string, unknown> = {
      schoolId: new Types.ObjectId(schoolId),
    };

    if (className) filter.class = className;
    if (section) filter.section = section;
    if (dateStr) {
      const targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: targetDate, $lt: nextDay };
    }

    return DailyDiary.find(filter).sort({ date: -1, subject: 1 });
  }

  async createEntry(
    schoolId: string,
    teacherId: string,
    teacherName: string,
    input: CreateDailyDiaryInput
  ): Promise<DailyDiaryDocument> {
    const targetDate = new Date(input.date);
    targetDate.setHours(0, 0, 0, 0);

    const doc = new DailyDiary({
      schoolId: new Types.ObjectId(schoolId),
      date: targetDate,
      class: input.class,
      section: input.section,
      subject: input.subject,
      teacherId,
      teacherName,
      topicCovered: input.topicCovered,
      homeworkAssigned: input.homeworkAssigned || '',
      remarksNotes: input.remarksNotes || '',
      signOffStatus: input.signOffStatus || 'published',
    });

    await doc.save();
    return doc;
  }

  async updateEntry(
    schoolId: string,
    entryId: string,
    input: Partial<CreateDailyDiaryInput>
  ): Promise<DailyDiaryDocument> {
    const entry = await DailyDiary.findOne({
      _id: new Types.ObjectId(entryId),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!entry) {
      throw AppError.notFound('Daily diary entry not found.');
    }

    if (input.topicCovered !== undefined) entry.topicCovered = input.topicCovered;
    if (input.homeworkAssigned !== undefined) entry.homeworkAssigned = input.homeworkAssigned;
    if (input.remarksNotes !== undefined) entry.remarksNotes = input.remarksNotes;
    if (input.signOffStatus !== undefined) entry.signOffStatus = input.signOffStatus;

    await entry.save();
    return entry;
  }

  async deleteEntry(schoolId: string, entryId: string): Promise<void> {
    const res = await DailyDiary.deleteOne({
      _id: new Types.ObjectId(entryId),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (res.deletedCount === 0) {
      throw AppError.notFound('Daily diary entry not found.');
    }
  }
}

export const dailyDiaryService = new DailyDiaryService();

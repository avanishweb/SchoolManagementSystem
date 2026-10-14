import { Types } from 'mongoose';
import {
  AcademicSession,
  AcademicSessionDocument,
  Classroom,
  ClassroomDocument,
  Section,
  SectionDocument,
  Subject,
  SubjectDocument,
} from './academic.model.js';
import {
  CreateAcademicSessionInput,
  CreateClassroomInput,
  CreateSectionInput,
  CreateSubjectInput,
} from '@smart-school/validation';
import { AppError } from '../../utils/appError.js';

export class AcademicService {
  // SESSIONS
  async listSessions(schoolId: string): Promise<AcademicSessionDocument[]> {
    return AcademicSession.find({ schoolId: new Types.ObjectId(schoolId) }).sort({ startDate: -1 });
  }

  async createSession(schoolId: string, input: CreateAcademicSessionInput): Promise<AcademicSessionDocument> {
    const existing = await AcademicSession.findOne({
      schoolId: new Types.ObjectId(schoolId),
      name: input.name.trim(),
    });

    if (existing) {
      throw AppError.conflict(`Academic session '${input.name}' already exists.`);
    }

    if (input.isCurrent) {
      // Deactivate all other sessions for this school
      await AcademicSession.updateMany(
        { schoolId: new Types.ObjectId(schoolId) },
        { $set: { isCurrent: false } }
      );
    }

    const session = new AcademicSession({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    });

    await session.save();
    return session;
  }

  async setCurrentSession(schoolId: string, sessionId: string): Promise<AcademicSessionDocument> {
    const session = await AcademicSession.findOne({
      _id: new Types.ObjectId(sessionId),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!session) {
      throw AppError.notFound('Academic session not found.');
    }

    await AcademicSession.updateMany(
      { schoolId: new Types.ObjectId(schoolId) },
      { $set: { isCurrent: false } }
    );

    session.isCurrent = true;
    await session.save();
    return session;
  }

  // CLASSROOMS
  async listClassrooms(schoolId: string): Promise<ClassroomDocument[]> {
    return Classroom.find({ schoolId: new Types.ObjectId(schoolId) }).sort({ numericOrder: 1, name: 1 });
  }

  async createClassroom(schoolId: string, input: CreateClassroomInput): Promise<ClassroomDocument> {
    const existing = await Classroom.findOne({
      schoolId: new Types.ObjectId(schoolId),
      name: input.name.trim(),
    });

    if (existing) {
      throw AppError.conflict(`Class '${input.name}' already exists in this school.`);
    }

    const classroom = new Classroom({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
    });

    await classroom.save();

    // Auto-create sections defined in the class
    for (const secName of input.sections || ['A']) {
      await Section.create({
        schoolId: new Types.ObjectId(schoolId),
        classId: classroom._id,
        className: classroom.name,
        name: secName.trim().toUpperCase(),
        maxCapacity: 40,
      });
    }

    return classroom;
  }

  // SECTIONS
  async listSections(schoolId: string, classId?: string): Promise<SectionDocument[]> {
    const filter: Record<string, unknown> = { schoolId: new Types.ObjectId(schoolId) };
    if (classId) filter.classId = new Types.ObjectId(classId);
    return Section.find(filter).sort({ name: 1 });
  }

  async createSection(schoolId: string, input: CreateSectionInput): Promise<SectionDocument> {
    const existing = await Section.findOne({
      schoolId: new Types.ObjectId(schoolId),
      classId: new Types.ObjectId(input.classId),
      name: input.name.trim().toUpperCase(),
    });

    if (existing) {
      throw AppError.conflict(`Section '${input.name}' already exists for class '${input.className}'.`);
    }

    const section = new Section({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
      classId: new Types.ObjectId(input.classId),
      name: input.name.trim().toUpperCase(),
      classTeacherId: input.classTeacherId ? new Types.ObjectId(input.classTeacherId) : undefined,
    });

    await section.save();

    // Also update Classroom sections array
    await Classroom.updateOne(
      { _id: new Types.ObjectId(input.classId), schoolId: new Types.ObjectId(schoolId) },
      { $addToSet: { sections: section.name } }
    );

    return section;
  }

  // SUBJECTS
  async listSubjects(schoolId: string): Promise<SubjectDocument[]> {
    return Subject.find({ schoolId: new Types.ObjectId(schoolId) }).sort({ name: 1 });
  }

  async createSubject(schoolId: string, input: CreateSubjectInput): Promise<SubjectDocument> {
    const existing = await Subject.findOne({
      schoolId: new Types.ObjectId(schoolId),
      code: input.code.trim().toUpperCase(),
    });

    if (existing) {
      throw AppError.conflict(`Subject with code '${input.code}' already exists.`);
    }

    const subject = new Subject({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
      code: input.code.trim().toUpperCase(),
    });

    await subject.save();
    return subject;
  }
}

export const academicService = new AcademicService();

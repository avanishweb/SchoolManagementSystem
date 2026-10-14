import { Types } from 'mongoose';
import {
  Examination,
  ExaminationDocument,
  ExamSchedule,
  ExamScheduleDocument,
  ExamMark,
  ExamMarkDocument,
} from './examination.model.js';
import { Student } from '../students/student.model.js';
import {
  CreateExaminationInput,
  CreateExamScheduleInput,
  RecordExamMarksInput,
} from '@smart-school/validation';
import { AppError } from '../../utils/appError.js';

export function calculateGrade(marks: number, maxMarks: number): string {
  if (maxMarks <= 0) return 'F';
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 33) return 'D';
  return 'F';
}

export class ExaminationService {
  async listExams(schoolId: string): Promise<ExaminationDocument[]> {
    return Examination.find({ schoolId: new Types.ObjectId(schoolId) }).sort({ startDate: -1 });
  }

  async createExam(schoolId: string, input: CreateExaminationInput): Promise<ExaminationDocument> {
    const existing = await Examination.findOne({
      schoolId: new Types.ObjectId(schoolId),
      name: input.name.trim(),
      academicSession: input.academicSession,
    });

    if (existing) {
      throw AppError.conflict(`Examination '${input.name}' already exists for session ${input.academicSession}`);
    }

    const exam = new Examination({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    });

    await exam.save();
    return exam;
  }

  async createSchedule(schoolId: string, input: CreateExamScheduleInput): Promise<ExamScheduleDocument> {
    const schedule = new ExamSchedule({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
      examId: new Types.ObjectId(input.examId),
      examDate: new Date(input.examDate),
    });

    await schedule.save();
    return schedule;
  }

  async listSchedules(schoolId: string, examId: string): Promise<ExamScheduleDocument[]> {
    return ExamSchedule.find({
      schoolId: new Types.ObjectId(schoolId),
      examId: new Types.ObjectId(examId),
    }).sort({ examDate: 1 });
  }

  async recordMarks(schoolId: string, input: RecordExamMarksInput): Promise<ExamMarkDocument[]> {
    const results: ExamMarkDocument[] = [];

    for (const item of input.marks) {
      const student = await Student.findOne({
        _id: new Types.ObjectId(item.studentId),
        schoolId: new Types.ObjectId(schoolId),
      });

      if (!student) continue;

      const totalMarks = item.isAbsent ? 0 : item.theoryMarks + item.practicalMarks;
      const grade = item.isAbsent ? 'AB' : calculateGrade(totalMarks, input.maxMarks);

      const doc = await ExamMark.findOneAndUpdate(
        {
          schoolId: new Types.ObjectId(schoolId),
          examId: new Types.ObjectId(input.examId),
          studentId: new Types.ObjectId(item.studentId),
          subject: input.subject,
        },
        {
          schoolId: new Types.ObjectId(schoolId),
          examId: new Types.ObjectId(input.examId),
          studentId: new Types.ObjectId(item.studentId),
          studentName: student.fullName,
          admissionNumber: student.admissionNumber,
          rollNumber: student.rollNumber,
          class: input.class,
          section: input.section,
          subject: input.subject,
          theoryMarks: item.theoryMarks,
          practicalMarks: item.practicalMarks,
          totalMarks,
          maxMarks: input.maxMarks,
          grade,
          isAbsent: item.isAbsent,
          remarks: item.remarks,
        },
        { upsert: true, new: true }
      );

      results.push(doc);
    }

    return results;
  }

  async getStudentReportCard(schoolId: string, examId: string, studentId: string) {
    const [exam, student, marks] = await Promise.all([
      Examination.findOne({
        _id: new Types.ObjectId(examId),
        schoolId: new Types.ObjectId(schoolId),
      }),
      Student.findOne({
        _id: new Types.ObjectId(studentId),
        schoolId: new Types.ObjectId(schoolId),
      }),
      ExamMark.find({
        schoolId: new Types.ObjectId(schoolId),
        examId: new Types.ObjectId(examId),
        studentId: new Types.ObjectId(studentId),
      }),
    ]);

    if (!exam || !student) {
      throw AppError.notFound('Exam or Student record not found.');
    }

    let totalScored = 0;
    let totalPossible = 0;
    let anyFail = false;

    for (const m of marks) {
      totalScored += m.totalMarks;
      totalPossible += m.maxMarks;
      if (m.grade === 'F' || m.grade === 'AB') anyFail = true;
    }

    const percentage = totalPossible > 0 ? Number(((totalScored / totalPossible) * 100).toFixed(2)) : 0;
    const overallGrade = calculateGrade(totalScored, totalPossible);
    const resultStatus = anyFail ? 'Failed' : 'Passed';

    return {
      exam: {
        id: exam.id,
        name: exam.name,
        academicSession: exam.academicSession,
      },
      student: {
        id: student.id,
        name: student.fullName,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        class: student.class,
        section: student.section,
      },
      marks,
      summary: {
        totalScored,
        totalPossible,
        percentage,
        overallGrade,
        resultStatus,
      },
    };
  }

  async publishResults(schoolId: string, examId: string): Promise<ExaminationDocument> {
    const exam = await Examination.findOne({
      _id: new Types.ObjectId(examId),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!exam) throw AppError.notFound('Examination not found');

    exam.status = 'published';
    await exam.save();
    return exam;
  }
}

export const examinationService = new ExaminationService();

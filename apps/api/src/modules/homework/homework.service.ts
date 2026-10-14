import { Types } from 'mongoose';
import {
  Homework,
  HomeworkDocument,
  HomeworkSubmission,
  HomeworkSubmissionDocument,
} from './homework.model.js';
import { Student } from '../students/student.model.js';
import { CreateHomeworkInput, SubmitHomeworkInput } from '@smart-school/validation';
import { AppError } from '../../utils/appError.js';

export class HomeworkService {
  async createHomework(
    schoolId: string,
    teacherId: string,
    teacherName: string,
    input: CreateHomeworkInput
  ): Promise<HomeworkDocument> {
    const hw = new Homework({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
      teacherId: new Types.ObjectId(teacherId),
      teacherName,
      assignedDate: new Date(input.assignedDate),
      dueDate: new Date(input.dueDate),
    });

    await hw.save();
    return hw;
  }

  async listHomework(
    schoolId: string,
    className?: string,
    section?: string
  ): Promise<HomeworkDocument[]> {
    const filter: Record<string, unknown> = { schoolId: new Types.ObjectId(schoolId) };
    if (className) filter.class = className;
    if (section) filter.section = section;

    return Homework.find(filter).sort({ dueDate: -1 });
  }

  async submitHomework(
    schoolId: string,
    studentId: string,
    input: SubmitHomeworkInput
  ): Promise<HomeworkSubmissionDocument> {
    const hw = await Homework.findOne({
      _id: new Types.ObjectId(input.homeworkId),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!hw) throw AppError.notFound('Homework assignment not found');

    const student = await Student.findOne({
      _id: new Types.ObjectId(studentId),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!student) throw AppError.notFound('Student record not found');

    const now = new Date();
    const isLate = now.getTime() > new Date(hw.dueDate).getTime();

    const submission = await HomeworkSubmission.findOneAndUpdate(
      {
        schoolId: new Types.ObjectId(schoolId),
        homeworkId: new Types.ObjectId(input.homeworkId),
        studentId: new Types.ObjectId(studentId),
      },
      {
        schoolId: new Types.ObjectId(schoolId),
        homeworkId: new Types.ObjectId(input.homeworkId),
        studentId: new Types.ObjectId(studentId),
        studentName: student.fullName,
        content: input.content,
        attachments: input.attachments || [],
        submissionDate: now,
        status: isLate ? 'late' : 'submitted',
      },
      { upsert: true, new: true }
    );

    // Update count
    const count = await HomeworkSubmission.countDocuments({
      schoolId: new Types.ObjectId(schoolId),
      homeworkId: new Types.ObjectId(input.homeworkId),
    });
    hw.submissionCount = count;
    await hw.save();

    return submission;
  }

  async listSubmissions(schoolId: string, homeworkId: string): Promise<HomeworkSubmissionDocument[]> {
    return HomeworkSubmission.find({
      schoolId: new Types.ObjectId(schoolId),
      homeworkId: new Types.ObjectId(homeworkId),
    }).sort({ submissionDate: -1 });
  }

  async gradeSubmission(
    schoolId: string,
    submissionId: string,
    marks: number,
    feedback: string,
    evaluatedBy: string
  ): Promise<HomeworkSubmissionDocument> {
    const submission = await HomeworkSubmission.findOne({
      _id: new Types.ObjectId(submissionId),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!submission) throw AppError.notFound('Submission not found');

    submission.marks = marks;
    submission.feedback = feedback;
    submission.status = 'evaluated';
    submission.evaluatedBy = evaluatedBy;

    await submission.save();
    return submission;
  }
}

export const homeworkService = new HomeworkService();

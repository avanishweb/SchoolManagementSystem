import crypto from 'crypto';
import { Types } from 'mongoose';
import { Student, StudentDocument } from './student.model.js';
import { School } from '../schools/school.model.js';
import {
  CreateStudentInput,
  UpdateStudentInput,
  StudentQueryInput,
} from '@smart-school/validation';
import {
  IStudent,
  PaginatedResult,
  StudentStatus,
} from '@smart-school/shared-types';
import { formatAdmissionNumber } from '@smart-school/shared-utils';
import { AppError } from '../../utils/appError.js';
import { removeFileIfPresent } from './student.upload.js';

export class StudentService {
  /**
   * Generates next admission number for a school with duplicate protection
   */
  async generateNextAdmissionNumber(schoolId: string, sessionYear?: number | string): Promise<string> {
    const year = sessionYear || new Date().getFullYear();
    const prefix = 'ADM';
    const regexPattern = new RegExp(`^${prefix}-${year}-(\\d+)$`, 'i');

    // Find the latest student record matching this year's admission number pattern
    const latestStudent = await Student.findOne({
      schoolId: new Types.ObjectId(schoolId),
      admissionNumber: { $regex: regexPattern },
    })
      .sort({ admissionNumber: -1 })
      .select('admissionNumber');

    let sequence = 1;
    if (latestStudent && latestStudent.admissionNumber) {
      const match = latestStudent.admissionNumber.match(regexPattern);
      if (match && match[1]) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    // Safety loop to ensure uniqueness
    let proposed = formatAdmissionNumber(prefix, year, sequence);
    while (await Student.exists({ schoolId: new Types.ObjectId(schoolId), admissionNumber: proposed })) {
      sequence++;
      proposed = formatAdmissionNumber(prefix, year, sequence);
    }

    return proposed;
  }

  /**
   * List students with filtering, search, and pagination strictly within tenant boundary
   */
  async listStudents(
    schoolId: string,
    query: StudentQueryInput
  ): Promise<PaginatedResult<IStudent>> {
    const filter: Record<string, unknown> = {
      schoolId: new Types.ObjectId(schoolId),
    };

    // Text search filter
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { admissionNumber: searchRegex },
        { rollNumber: searchRegex },
        { 'guardian.guardianName': searchRegex },
        { 'guardian.guardianPhone': searchRegex },
      ];
    }

    if (query.class) {
      filter.class = query.class;
    }

    if (query.section) {
      filter.section = query.section;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.gender) {
      filter.gender = query.gender;
    }

    if (query.academicSession) {
      filter.academicSession = query.academicSession;
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [total, students] = await Promise.all([
      Student.countDocuments(filter),
      Student.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
    ]);

    return {
      items: students.map((s) => s.toJSON() as unknown as IStudent),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve a single student by ID within the authenticated tenant scope
   */
  async getStudentById(schoolId: string, studentId: string): Promise<StudentDocument> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw AppError.badRequest('Invalid student ID format');
    }

    const student = await Student.findOne({
      _id: new Types.ObjectId(studentId),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!student) {
      throw AppError.notFound('Student record not found in this institution');
    }

    return student;
  }

  /**
   * Create a new student admission with validation and duplicate protection
   */
  async createStudent(schoolId: string, input: CreateStudentInput): Promise<StudentDocument> {
    // 1. Enforce Subscription Student Capacity Limits
    const school = await School.findById(schoolId);
    if (school?.subscription?.maxStudents) {
      const currentCount = await Student.countDocuments({ schoolId: new Types.ObjectId(schoolId) });
      if (currentCount >= school.subscription.maxStudents) {
        throw new AppError(
          `Student capacity limit reached (${school.subscription.maxStudents} max students allowed on ${school.subscription.plan} plan). Please upgrade your subscription plan.`,
          403,
          'LICENSE_LIMIT_EXCEEDED'
        );
      }
    }

    let admissionNumber = input.admissionNumber?.trim().toUpperCase();

    if (!admissionNumber) {
      admissionNumber = await this.generateNextAdmissionNumber(schoolId, input.academicSession.split('-')[0]);
    } else {
      // Validate uniqueness within the school
      const existing = await Student.findOne({
        schoolId: new Types.ObjectId(schoolId),
        admissionNumber,
      });

      if (existing) {
        throw AppError.conflict(
          `Admission number '${admissionNumber}' is already registered in this school.`
        );
      }
    }

    const student = new Student({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
      admissionNumber,
      admissionDate: new Date(input.admissionDate),
      dateOfBirth: new Date(input.dateOfBirth),
    });

    await student.save();
    return student;
  }

  /**
   * Update student profile with tenant isolation
   */
  async updateStudent(
    schoolId: string,
    studentId: string,
    input: UpdateStudentInput
  ): Promise<StudentDocument> {
    const student = await this.getStudentById(schoolId, studentId);

    if (input.admissionNumber) {
      const targetAdmissionNumber = input.admissionNumber.trim().toUpperCase();
      if (targetAdmissionNumber !== student.admissionNumber) {
        const existing = await Student.findOne({
          schoolId: new Types.ObjectId(schoolId),
          admissionNumber: targetAdmissionNumber,
          _id: { $ne: student._id },
        });

        if (existing) {
          throw AppError.conflict(
            `Admission number '${targetAdmissionNumber}' is already registered to another student.`
          );
        }
        student.admissionNumber = targetAdmissionNumber;
      }
    }

    // Apply updates
    if (input.firstName !== undefined) student.firstName = input.firstName;
    if (input.lastName !== undefined) student.lastName = input.lastName;
    if (input.dateOfBirth !== undefined) student.dateOfBirth = new Date(input.dateOfBirth);
    if (input.admissionDate !== undefined) student.admissionDate = new Date(input.admissionDate);
    if (input.academicSession !== undefined) student.academicSession = input.academicSession;
    if (input.gender !== undefined) student.gender = input.gender;
    if (input.bloodGroup !== undefined) student.bloodGroup = input.bloodGroup;
    if (input.nationalId !== undefined) student.nationalId = input.nationalId;
    if (input.class !== undefined) student.class = input.class;
    if (input.section !== undefined) student.section = input.section;
    if (input.rollNumber !== undefined) student.rollNumber = input.rollNumber;
    if (input.email !== undefined) student.email = input.email;
    if (input.phone !== undefined) student.phone = input.phone;
    if (input.currentAddress !== undefined) student.currentAddress = input.currentAddress;
    if (input.permanentAddress !== undefined) student.permanentAddress = input.permanentAddress;
    if (input.guardian !== undefined) student.guardian = { ...student.guardian, ...input.guardian };
    if (input.status !== undefined) student.status = input.status;
    if (input.notes !== undefined) student.notes = input.notes;

    await student.save();
    return student;
  }

  /**
   * Update student status (active, inactive, suspended, etc.)
   */
  async updateStudentStatus(
    schoolId: string,
    studentId: string,
    status: StudentStatus,
    reason?: string
  ): Promise<StudentDocument> {
    const student = await this.getStudentById(schoolId, studentId);
    student.status = status;
    if (reason) {
      student.notes = student.notes ? `${student.notes}\n[Status Change]: ${reason}` : `[Status Change]: ${reason}`;
    }
    await student.save();
    return student;
  }

  /**
   * Attach uploaded photo to student record
   */
  async updateStudentPhoto(schoolId: string, studentId: string, photoUrl: string): Promise<StudentDocument> {
    const student = await this.getStudentById(schoolId, studentId);
    if (student.photoUrl && student.photoUrl !== photoUrl) {
      // Clean up previous photo if stored locally
      removeFileIfPresent(student.photoUrl);
    }
    student.photoUrl = photoUrl;
    await student.save();
    return student;
  }

  /**
   * Attach a verified document to student profile
   */
  async addStudentDocument(
    schoolId: string,
    studentId: string,
    docData: {
      title: string;
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }
  ): Promise<StudentDocument> {
    const student = await this.getStudentById(schoolId, studentId);
    const newDoc = {
      id: crypto.randomUUID(),
      title: docData.title,
      fileName: docData.fileName,
      fileUrl: docData.fileUrl,
      fileType: docData.fileType,
      fileSize: docData.fileSize,
      uploadedAt: new Date(),
    };

    student.documents = student.documents || [];
    student.documents.push(newDoc);
    await student.save();
    return student;
  }

  /**
   * Remove a document from student profile
   */
  async removeStudentDocument(
    schoolId: string,
    studentId: string,
    documentId: string
  ): Promise<StudentDocument> {
    const student = await this.getStudentById(schoolId, studentId);
    if (!student.documents || student.documents.length === 0) {
      throw AppError.notFound('No documents found for this student');
    }

    const docIndex = student.documents.findIndex((d) => d.id === documentId);
    if (docIndex === -1) {
      throw AppError.notFound('Document record not found');
    }

    const [removed] = student.documents.splice(docIndex, 1);
    removeFileIfPresent(removed.fileUrl);

    await student.save();
    return student;
  }
}

export const studentService = new StudentService();

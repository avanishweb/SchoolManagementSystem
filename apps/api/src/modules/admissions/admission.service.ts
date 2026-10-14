import { Types } from 'mongoose';
import { AdmissionEnquiry, AdmissionEnquiryDocument } from './admission.model.js';
import { studentService } from '../students/student.service.js';
import { StudentDocument } from '../students/student.model.js';
import {
  CreateAdmissionEnquiryInput,
  UpdateEnquiryStageInput,
} from '@smart-school/validation';
import { AppError } from '../../utils/appError.js';

export class AdmissionService {
  async generateEnquiryNumber(schoolId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await AdmissionEnquiry.countDocuments({ schoolId: new Types.ObjectId(schoolId) });
    return `ENQ-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async listEnquiries(
    schoolId: string,
    stage?: string,
    className?: string
  ): Promise<AdmissionEnquiryDocument[]> {
    const filter: Record<string, unknown> = { schoolId: new Types.ObjectId(schoolId) };
    if (stage) filter.stage = stage;
    if (className) filter.applyingForClass = className;

    return AdmissionEnquiry.find(filter).sort({ createdAt: -1 });
  }

  async createEnquiry(
    schoolId: string,
    input: CreateAdmissionEnquiryInput
  ): Promise<AdmissionEnquiryDocument> {
    const enquiryNumber = await this.generateEnquiryNumber(schoolId);

    const enquiry = new AdmissionEnquiry({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
      enquiryNumber,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : undefined,
    });

    await enquiry.save();
    return enquiry;
  }

  async updateStage(
    schoolId: string,
    enquiryId: string,
    input: UpdateEnquiryStageInput
  ): Promise<AdmissionEnquiryDocument> {
    const enquiry = await AdmissionEnquiry.findOne({
      _id: new Types.ObjectId(enquiryId),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!enquiry) throw AppError.notFound('Admission enquiry not found');

    enquiry.stage = input.stage;
    if (input.notes) enquiry.notes = input.notes;
    if (input.followUpDate) enquiry.followUpDate = new Date(input.followUpDate);

    await enquiry.save();
    return enquiry;
  }

  /**
   * Complete Admission Workflow: Converts approved CRM enquiry into Student record
   */
  async convertToStudent(
    schoolId: string,
    enquiryId: string,
    section: string = 'A',
    gender: 'male' | 'female' | 'other' = 'male',
    dateOfBirth: string = '2015-01-01'
  ): Promise<{ student: StudentDocument; enquiry: AdmissionEnquiryDocument }> {
    const enquiry = await AdmissionEnquiry.findOne({
      _id: new Types.ObjectId(enquiryId),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!enquiry) throw AppError.notFound('Admission enquiry not found');
    if (enquiry.stage === 'enrolled') {
      throw AppError.conflict('Candidate has already been admitted as a student.');
    }

    const candidateName = enquiry.candidateName || enquiry.studentName || 'Student Admitted';
    const nameParts = candidateName.trim().split(' ');
    const firstName = nameParts[0] || 'Student';
    const lastName = nameParts.slice(1).join(' ') || 'Admitted';
    const phone = enquiry.phone || enquiry.parentPhone || '0000000000';
    const applyingClass = enquiry.applyingForClass || enquiry.targetClass || 'Class 1';
    const academicSession = enquiry.academicSession || '2026-2027';

    const student = await studentService.createStudent(schoolId, {
      admissionDate: new Date().toISOString(),
      academicSession,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      class: applyingClass,
      section,
      phone,
      email: enquiry.email || enquiry.parentEmail,
      guardian: {
        guardianName: enquiry.parentName,
        guardianRelation: 'Parent',
        guardianPhone: phone,
        guardianEmail: enquiry.email || enquiry.parentEmail,
      },
      currentAddress: {},
      status: 'active',
      notes: `Admitted from CRM Enquiry #${enquiry.enquiryNumber}`,
    });

    enquiry.stage = 'enrolled';
    await enquiry.save();

    return { student, enquiry };
  }
}

export const admissionService = new AdmissionService();

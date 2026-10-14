import { Types } from 'mongoose';
import { StudentAttendance, StudentAttendanceDocument } from './attendance.model.js';
import { Student } from '../students/student.model.js';
import { notificationService } from '../notifications/notification.service.js';
import { BulkMarkAttendanceInput } from '@smart-school/validation';
import { IAttendanceSummary } from '@smart-school/shared-types';

export class AttendanceService {
  /**
   * Bulk marks or updates student attendance for a given class, section, and date
   */
  async bulkMarkAttendance(
    schoolId: string,
    markedBy: string,
    input: BulkMarkAttendanceInput
  ): Promise<StudentAttendanceDocument[]> {
    const targetDate = new Date(input.date);
    // Normalize to midnight UTC/local
    targetDate.setHours(0, 0, 0, 0);

    const results: StudentAttendanceDocument[] = [];

    for (const record of input.records) {
      const student = await Student.findOne({
        _id: new Types.ObjectId(record.studentId),
        schoolId: new Types.ObjectId(schoolId),
      });

      if (!student) continue;

      const doc = await StudentAttendance.findOneAndUpdate(
        {
          schoolId: new Types.ObjectId(schoolId),
          studentId: new Types.ObjectId(record.studentId),
          date: targetDate,
        },
        {
          schoolId: new Types.ObjectId(schoolId),
          studentId: new Types.ObjectId(record.studentId),
          studentName: student.fullName,
          admissionNumber: student.admissionNumber,
          rollNumber: student.rollNumber,
          class: input.class,
          section: input.section,
          date: targetDate,
          status: record.status,
          remarks: record.remarks,
          markedBy,
        },
        { upsert: true, new: true }
      );

      results.push(doc);
    }

    return results;
  }

  /**
   * Get attendance for class & section on a specific date
   */
  async getClassAttendance(
    schoolId: string,
    className: string,
    section: string,
    dateStr: string
  ): Promise<StudentAttendanceDocument[]> {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    return StudentAttendance.find({
      schoolId: new Types.ObjectId(schoolId),
      class: className,
      section,
      date: targetDate,
    }).sort({ rollNumber: 1, studentName: 1 });
  }

  /**
   * Get student's monthly attendance and summary stats
   */
  async getStudentMonthlyAttendance(
    schoolId: string,
    studentId: string,
    year: number,
    month: number
  ): Promise<{ records: StudentAttendanceDocument[]; summary: IAttendanceSummary }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const records = await StudentAttendance.find({
      schoolId: new Types.ObjectId(schoolId),
      studentId: new Types.ObjectId(studentId),
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    const total = records.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;

    for (const r of records) {
      if (r.status === 'present') present++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'late') late++;
      else if (r.status === 'half_day' || r.status === 'approved_leave') leave++;
    }

    const attendancePercentage = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;

    return {
      records,
      summary: {
        total,
        present,
        absent,
        late,
        leave,
        attendancePercentage,
      },
    };
  }

  /**
   * Dispatches bulk WhatsApp attendance alerts to parents of absent/late students
   */
  async sendBulkAttendanceWhatsAppAlerts(
    schoolId: string,
    className: string,
    section: string,
    dateStr: string
  ): Promise<{
    totalAlerted: number;
    deliveredCount: number;
    recipients: Array<{ studentName: string; phone: string; status: string }>;
  }> {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const attendances = await StudentAttendance.find({
      schoolId: new Types.ObjectId(schoolId),
      class: className,
      section,
      date: targetDate,
      status: { $in: ['absent', 'late', 'half_day'] },
    });

    const recipients: Array<{ studentName: string; phone: string; status: string }> = [];

    for (const record of attendances) {
      const student = await Student.findById(record.studentId);
      if (!student || !student.guardian?.guardianPhone) continue;

      const guardianPhone = student.guardian.guardianPhone;
      const statusTitle = record.status === 'absent' ? 'ABSENT' : record.status === 'late' ? 'LATE' : 'HALF DAY';
      const formattedDate = targetDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const message = `🔔 *Smart School ERP — Attendance Alert*\n\nDear Parent/Guardian,\n\nYour ward *${student.fullName}* (Adm: ${student.admissionNumber}, Class: ${className}-${section}) has been marked *${statusTitle}* today (${formattedDate}).\n\nIf this was unexpected, please contact the class teacher or school administration promptly.`;

      await notificationService.dispatchNotification(schoolId, {
        recipientType: 'parent',
        recipientContact: guardianPhone,
        channel: 'whatsapp',
        title: `Attendance Alert: ${student.fullName} (${statusTitle})`,
        message,
      });

      recipients.push({
        studentName: student.fullName || `${student.firstName} ${student.lastName}`,
        phone: guardianPhone,
        status: record.status,
      });
    }

    return {
      totalAlerted: recipients.length,
      deliveredCount: recipients.length,
      recipients,
    };
  }
}

export const attendanceService = new AttendanceService();


import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { studentService } from './student.service.js';
import { AppError } from '../../utils/appError.js';
import { ApiResponse, IStudent, PaginatedResult } from '@smart-school/shared-types';
import { UPLOAD_ROOT } from './student.upload.js';

export class StudentController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantId) {
        throw AppError.forbidden('Tenant context not identified.');
      }

      const result = await studentService.listStudents(req.tenantId, req.query as any);
      const response: ApiResponse<PaginatedResult<IStudent>> = {
        success: true,
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantId) {
        throw AppError.forbidden('Tenant context not identified.');
      }

      const student = await studentService.getStudentById(req.tenantId, req.params.id);
      const response: ApiResponse<IStudent> = {
        success: true,
        data: student.toJSON() as unknown as IStudent,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getNextAdmissionNumber = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantId) {
        throw AppError.forbidden('Tenant context not identified.');
      }

      const nextNumber = await studentService.generateNextAdmissionNumber(
        req.tenantId,
        req.query.session as string
      );

      const response: ApiResponse<{ admissionNumber: string }> = {
        success: true,
        data: { admissionNumber: nextNumber },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantId) {
        throw AppError.forbidden('Tenant context not identified.');
      }

      const student = await studentService.createStudent(req.tenantId, req.body);
      const response: ApiResponse<IStudent> = {
        success: true,
        message: 'Student admitted successfully',
        data: student.toJSON() as unknown as IStudent,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantId) {
        throw AppError.forbidden('Tenant context not identified.');
      }

      const student = await studentService.updateStudent(req.tenantId, req.params.id, req.body);
      const response: ApiResponse<IStudent> = {
        success: true,
        message: 'Student profile updated successfully',
        data: student.toJSON() as unknown as IStudent,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantId) {
        throw AppError.forbidden('Tenant context not identified.');
      }

      const { status, reason } = req.body;
      const student = await studentService.updateStudentStatus(
        req.tenantId,
        req.params.id,
        status,
        reason
      );

      const response: ApiResponse<IStudent> = {
        success: true,
        message: `Student status updated to '${status}'`,
        data: student.toJSON() as unknown as IStudent,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  uploadPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantId) {
        throw AppError.forbidden('Tenant context not identified.');
      }

      if (!req.file) {
        throw AppError.badRequest('No photo file uploaded.');
      }

      const photoUrl = `/api/students/uploads/photos/${req.file.filename}`;
      const student = await studentService.updateStudentPhoto(
        req.tenantId,
        req.params.id,
        photoUrl
      );

      const response: ApiResponse<{ photoUrl: string; student: IStudent }> = {
        success: true,
        message: 'Student photo uploaded successfully',
        data: {
          photoUrl,
          student: student.toJSON() as unknown as IStudent,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantId) {
        throw AppError.forbidden('Tenant context not identified.');
      }

      if (!req.file) {
        throw AppError.badRequest('No document file uploaded.');
      }

      const title = (req.body.title || req.file.originalname).trim();
      const fileUrl = `/api/students/uploads/documents/${req.file.filename}`;

      const student = await studentService.addStudentDocument(req.tenantId, req.params.id, {
        title,
        fileName: req.file.originalname,
        fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      });

      const response: ApiResponse<IStudent> = {
        success: true,
        message: 'Document uploaded successfully',
        data: student.toJSON() as unknown as IStudent,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantId) {
        throw AppError.forbidden('Tenant context not identified.');
      }

      const student = await studentService.removeStudentDocument(
        req.tenantId,
        req.params.id,
        req.params.docId
      );

      const response: ApiResponse<IStudent> = {
        success: true,
        message: 'Document deleted successfully',
        data: student.toJSON() as unknown as IStudent,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  serveUpload = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { type, filename } = req.params;
      if (type !== 'photos' && type !== 'documents') {
        throw AppError.badRequest('Invalid upload category.');
      }

      // Safe file path resolution preventing directory traversal
      const safePath = path.normalize(filename).replace(/^(\.\.[\/\\])+/, '');
      const fullPath = path.join(UPLOAD_ROOT, type, safePath);

      if (!fs.existsSync(fullPath)) {
        throw AppError.notFound('Requested file does not exist.');
      }

      res.sendFile(fullPath);
    } catch (error) {
      next(error);
    }
  };
}

export const studentController = new StudentController();

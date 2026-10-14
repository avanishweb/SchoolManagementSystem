import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request } from 'express';
import { AppError } from '../../utils/appError.js';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads/students');

// Ensure destination directories exist
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}
const photosDir = path.join(UPLOAD_ROOT, 'photos');
const docsDir = path.join(UPLOAD_ROOT, 'documents');
if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

function sanitizeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const safeRandom = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${safeRandom}${ext}`;
}

// Storage for Photos
const photoStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, photosDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    cb(null, sanitizeFilename(file.originalname));
  },
});

// Storage for Documents
const documentStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, docsDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    cb(null, sanitizeFilename(file.originalname));
  },
});

export const uploadPhoto = multer({
  storage: photoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(AppError.badRequest('Invalid photo format. Only JPG, PNG, and WebP are allowed.'));
    }
  },
});

export const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(AppError.badRequest('Invalid document format. Only PDF, JPG, and PNG are allowed.'));
    }
  },
});

export function removeFileIfPresent(filePath: string): void {
  try {
    const resolved = path.resolve(filePath);
    if (resolved.startsWith(UPLOAD_ROOT) && fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
    }
  } catch {
    // Suppress unlink errors
  }
}

export { UPLOAD_ROOT };

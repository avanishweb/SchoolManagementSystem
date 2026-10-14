import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { User, UserDocument } from '../modules/auth/user.model.js';
import { AppError } from '../utils/appError.js';

// Express Request module augmentation
declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
      tenantId?: string;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Check Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // 2. Check HttpOnly access_token cookie
    else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      throw AppError.unauthorized('Authentication token missing. Please log in.');
    }

    const payload = verifyAccessToken(token);

    // Fetch user from DB and verify still active
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('User account is invalid or deactivated.');
    }

    req.user = user;
    if (user.schoolId) {
      req.tenantId = user.schoolId.toString();
    }

    next();
  } catch (error) {
    next(error);
  }
}

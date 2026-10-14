import { LoginInput } from '@smart-school/validation';
import { User, UserDocument } from './user.model.js';
import { School } from '../schools/school.model.js';
import { AppError } from '../../utils/appError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { JWTPayload, AuthResponse, IUser, ISchool } from '@smart-school/shared-types';

export class AuthService {
  async login(input: LoginInput): Promise<AuthResponse & { refreshToken: string }> {
    const { email, password, schoolSlug } = input;

    // Retrieve user including hidden passwordHash
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      // Intentionally generic error to prevent email enumeration
      throw AppError.unauthorized('Invalid email or password.');
    }

    if (!user.isActive) {
      throw AppError.unauthorized('Account has been deactivated. Please contact your administrator.');
    }

    // Verify password hash
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid email or password.');
    }

    // Resolve School if user is associated with one
    let school = null;
    if (user.schoolId) {
      school = await School.findById(user.schoolId);
      if (!school) {
        throw AppError.forbidden('The school associated with this user was not found.');
      }
      if (school.status === 'suspended') {
        throw AppError.forbidden('School access has been suspended. Please contact platform support.');
      }

      // If user supplied a school slug, verify it matches
      if (schoolSlug && school.slug !== schoolSlug.toLowerCase()) {
        throw AppError.unauthorized('User is not registered under this school domain.');
      }
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate JWT tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId ? user.schoolId.toString() : undefined,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return {
      user: user.toJSON() as unknown as IUser,
      school: (school ? school.toJSON() : null) as unknown as (ISchool | null),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = verifyRefreshToken(token);

    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('User account is invalid or deactivated.');
    }

    const newPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId ? user.schoolId.toString() : undefined,
    };

    const accessToken = signAccessToken(newPayload);
    const refreshToken = signRefreshToken(newPayload);

    return { accessToken, refreshToken };
  }

  async getCurrentUser(userId: string): Promise<{ user: UserDocument; school: unknown }> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.unauthorized('User not found.');
    }

    let school = null;
    if (user.schoolId) {
      school = await School.findById(user.schoolId);
    }

    return {
      user,
      school: school ? school.toJSON() : null,
    };
  }
}

export const authService = new AuthService();

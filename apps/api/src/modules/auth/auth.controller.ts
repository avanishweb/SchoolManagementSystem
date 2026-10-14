import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/appError.js';
import { ApiResponse, AuthResponse } from '@smart-school/shared-types';

export class AuthController {
  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProd = env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: env.COOKIE_SECURE ?? isProd,
      sameSite: env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none',
      domain: env.COOKIE_DOMAIN || undefined,
    };

    // 15-minute access token cookie
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    // 7-day refresh token cookie
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body);

      // Set secure HttpOnly cookies
      this.setAuthCookies(res, result.accessToken, result.refreshToken);

      const response: ApiResponse<AuthResponse> = {
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          school: result.school,
          accessToken: result.accessToken,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clearOptions = {
        httpOnly: true,
        secure: env.COOKIE_SECURE ?? env.NODE_ENV === 'production',
        sameSite: env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none',
        domain: env.COOKIE_DOMAIN || undefined,
      };

      res.clearCookie('access_token', clearOptions);
      res.clearCookie('refresh_token', clearOptions);

      const response: ApiResponse<null> = {
        success: true,
        message: 'Logged out successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.refresh_token || req.body?.refreshToken;
      if (!token) {
        throw AppError.unauthorized('Refresh token is required');
      }

      const { accessToken, refreshToken } = await authService.refreshToken(token);
      this.setAuthCookies(res, accessToken, refreshToken);

      const response: ApiResponse<{ accessToken: string }> = {
        success: true,
        message: 'Token refreshed successfully',
        data: { accessToken },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }

      const result = await authService.getCurrentUser(req.user.id);

      const response: ApiResponse = {
        success: true,
        data: {
          user: result.user.toJSON(),
          school: result.school,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();

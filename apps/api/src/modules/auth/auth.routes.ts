import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { loginSchema, refreshTokenSchema } from '@smart-school/validation';

export const authRouter = Router();

authRouter.post('/login', authLimiter, validateRequest({ body: loginSchema }), authController.login);
authRouter.post('/logout', authController.logout);
authRouter.post('/refresh', validateRequest({ body: refreshTokenSchema }), authController.refresh);
authRouter.get('/me', authenticate, authController.getMe);

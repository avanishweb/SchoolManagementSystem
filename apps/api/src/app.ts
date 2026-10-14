import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { apiRouter } from './routes/api.router.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { standardLimiter } from './middleware/rateLimiter.js';

export function createApp(): Express {
  const app = express();

  // Basic security headers
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or Electron file://)
        if (!origin) return callback(null, true);

        // Allow localhost and configured client URL
        const allowedOrigins = [
          env.CLIENT_URL,
          'http://localhost:5173',
          'http://127.0.0.1:5173',
        ];

        if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
          return callback(null, true);
        }

        callback(new Error(`Origin ${origin} not permitted by CORS policy.`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-School-Id'],
    })
  );

  // Body parsers & cookies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // General rate limiting
  app.use(standardLimiter);

  // API router
  app.use('/api', apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Centralized Error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();

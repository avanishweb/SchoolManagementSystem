import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../config/database.js';
import { env } from '../config/env.js';
import { HealthStatus, ApiResponse } from '@smart-school/shared-types';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  const isHealthy = dbStatus === 'connected';

  const healthData: HealthStatus = {
    status: isHealthy ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    services: {
      database: dbStatus,
      server: 'operational',
    },
  };

  const response: ApiResponse<HealthStatus> = {
    success: true,
    data: healthData,
  };

  // HTTP 200 for healthy, 503 for degraded/unhealthy
  res.status(isHealthy ? 200 : 503).json(response);
});

import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  logger.info(`Starting Smart School API Server in [${env.NODE_ENV}] mode...`);

  // Connect to MongoDB
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 API Server running at http://localhost:${env.PORT}`);
    logger.info(`📡 Health check available at http://localhost:${env.PORT}/api/health`);
    logger.info(`🌐 Allowed client origin: ${env.CLIENT_URL}`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal error during API bootstrap:', err);
  process.exit(1);
});

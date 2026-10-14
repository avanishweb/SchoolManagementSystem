import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export function getDatabaseStatus(): 'connected' | 'disconnected' | 'connecting' {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    default:
      return 'disconnected';
  }
}

export async function connectDatabase(uriOverride?: string): Promise<boolean> {
  const uri = uriOverride || env.MONGODB_URI;

  if (mongoose.connection.readyState === 1) {
    logger.info('MongoDB is already connected.');
    return true;
  }

  try {
    logger.info(`Connecting to MongoDB at: ${uri.replace(/\/\/.*@/, '//<credentials>@')}...`);
    
    mongoose.connection.on('connected', () => {
      isConnected = true;
      logger.info('✅ MongoDB connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected.');
    });

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    return true;
  } catch (error: unknown) {
    isConnected = false;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('❌ Failed to connect to MongoDB:');
    logger.error(`   Error details: ${errorMessage}`);
    logger.error('   Troubleshooting steps:');
    logger.error('   1. Check if MongoDB Community Server is installed on your machine.');
    logger.error('   2. Start the Windows service via PowerShell: Start-Service -Name MongoDB');
    logger.error('   3. Or run mongod directly: "mongod --dbpath <your-data-dir>"');
    logger.error('   4. Verify MONGODB_URI in your .env file.');

    if (env.NODE_ENV === 'development') {
      try {
        logger.info('💡 Local MongoDB service not active. Starting in-memory development database fallback...');
        process.env.TEMP = 'D:\\.tmp';
        process.env.TMP = 'D:\\.tmp';
        const dbPath = path.resolve('D:/.tmp', `mongo-dev-${Date.now()}`);
        if (!fs.existsSync(dbPath)) {
          fs.mkdirSync(dbPath, { recursive: true });
        }
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const memoryServer = await MongoMemoryServer.create({
          instance: {
            dbPath,
            storageEngine: 'ephemeralForTest',
          },
        });
        const memoryUri = memoryServer.getUri();
        await mongoose.connect(memoryUri);
        isConnected = true;
        logger.info('✅ Connected to in-memory development MongoDB successfully!');

        const { seedDemoData } = await import('./devSeed.js');
        await seedDemoData();
        return true;
      } catch (memErr) {
        logger.warn('Could not launch in-memory fallback:', memErr);
      }
    }

    return false;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected cleanly.');
  }
}

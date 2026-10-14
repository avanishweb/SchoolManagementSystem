import { beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';

let mongoServer: MongoMemoryServer;
let currentDbPath: string;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.TEMP = 'D:\\temp';
  process.env.TMP = 'D:\\temp';
  process.env.JWT_ACCESS_SECRET = 'test_jwt_access_secret_key_min_32_characters!';
  process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key_min_32_characters!';

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  currentDbPath = path.resolve('D:/temp', `mongo-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  fs.mkdirSync(currentDbPath, { recursive: true });

  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbPath: currentDbPath,
      storageEngine: 'ephemeralForTest',
    },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
  if (currentDbPath && fs.existsSync(currentDbPath)) {
    try {
      fs.rmSync(currentDbPath, { recursive: true, force: true });
    } catch {
      // Suppress rm error
    }
  }
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

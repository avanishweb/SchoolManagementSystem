import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from current directory or monorepo root
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/smart_school_erp'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(isDev ? 2000 : 500),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(isDev ? 50 : 10),
});

const defaultDevSecrets = {
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_smart_school_min_32_chars_ok!',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_smart_school_min_32_chars_ok!',
};

const parsed = envSchema.safeParse({
  ...process.env,
  ...defaultDevSecrets,
});

if (!parsed.success) {
  console.error('❌ Environment configuration validation failed:');
  parsed.error.errors.forEach((err) => {
    console.error(`  - ${err.path.join('.')}: ${err.message}`);
  });
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment configuration in production.');
  }
}

export const env = parsed.success
  ? parsed.data
  : (envSchema.parse({
      ...process.env,
      ...defaultDevSecrets,
    }) as z.infer<typeof envSchema>);

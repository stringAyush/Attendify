import path from 'path';
import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load .env — try multiple paths so this works locally, in dist/, and on Render.
// On Render, NODE_ENV=production and no .env file exists — vars come from the dashboard.
dotenvConfig({ path: path.resolve(process.cwd(), '.env') });
dotenvConfig({ path: path.resolve(__dirname, '../../.env') }); // fallback for local dist/ run

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform((v) => (v ? Number(v) : 587)),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional().default('noreply@attendify.app'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  BCRYPT_SALT_ROUNDS: z.string().default('12').transform(Number),
});

const parsed = envSchema.safeParse(process.env);


if (!parsed.success) {
  // Use synchronous write — console.error can be lost if process exits too fast
  process.stderr.write('\n❌ SERVER STARTUP FAILED — Invalid or missing environment variables:\n');
  process.stderr.write(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2) + '\n');
  process.stderr.write('\nRequired vars: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET\n');
  process.stderr.write('Set these in your Render dashboard → Environment tab.\n\n');
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;

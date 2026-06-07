import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from '@/config/env';
import { errorHandler, notFound } from '@/middleware/errorHandler';
import { authRouter } from '@/routes/auth.routes';
import { classRouter } from '@/routes/class.routes';
import { studentRouter } from '@/routes/student.routes';
import { attendanceRouter } from '@/routes/attendance.routes';
import { reportRouter } from '@/routes/report.routes';

const app = express();

// ─── Security Middleware ─────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: config.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  })
);

// ─── CORS ────────────────────────────────────────────────────
// Dev: allow localhost + 127.0.0.1 + Android emulator host (10.0.2.2)
// Production: allow only the explicit FRONTEND_URL from env
//
// ⚠️  LAN IPs (192.168.x.x) are intentionally NOT allowed in production.
//     Set FRONTEND_URL to your real deployed domain instead.
const DEV_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'http://10.0.2.2:3000', // Android emulator → host machine
]);

// Parse comma-separated extra origins from env (useful in staging)
const extraOrigins = new Set(
  (process.env.EXTRA_CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin header (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      const isDev = config.NODE_ENV === 'development';

      // Always allow configured frontend URL
      if (origin === config.FRONTEND_URL) return callback(null, true);

      // Support Vercel deployments/previews
      if (origin.endsWith('.vercel.app')) return callback(null, true);

      // Allow any extra origins added via env
      if (extraOrigins.has(origin)) return callback(null, true);

      // In development — allow all localhost variants and local network IPs
      if (isDev) {
        if (DEV_ORIGINS.has(origin)) return callback(null, true);
        if (/^http:\/\/(192\.168|172\.(1[6-9]|2[0-9]|3[0-1])|10)\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
      }

      // Capacitor Android apps call from capacitor:// origin
      if (origin === 'capacitor://localhost') return callback(null, true);

      callback(new Error(`CORS policy: origin "${origin}" not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 86400,
  })
);

// Handle OPTIONS preflight explicitly before rate limiting
app.options('*', cors());

// ─── Rate Limiting ────────────────────────────────────────────
// In development: completely disabled to prevent 429s during dev
// In production: strict limits apply
const isDev = config.NODE_ENV === 'development';
const isTest = config.NODE_ENV === 'test';

const globalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,    // 15 minutes (default)
  max: isDev ? 10_000 : config.RATE_LIMIT_MAX, // 500 in production, unlimited in dev
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest || isDev,              // Skip entirely in dev & test
  message: { success: false, error: 'Too many requests, please try again in a few minutes' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 15,                  // Raised from 10 → 15 to allow login retries
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest || isDev,
  message: { success: false, error: 'Too many authentication attempts, please try again in 15 minutes' },
});

app.use(globalLimiter);

// ─── General Middleware ──────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (!isTest) {
  app.use(
    morgan(
      isDev
        ? ':method :url :status :response-time ms'
        : 'combined'
    )
  );
}

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
  });
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/classes', classRouter);
app.use('/api/students', studentRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/reports', reportRouter);

// ─── Error Handling ──────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export { app };

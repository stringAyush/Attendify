# Attendify: Production-Grade Attendance Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)

Attendify is a full-stack SaaS application built for schools, colleges, and other educational institutions to manage student attendance. It provides automated workflows for instructors, detailed analytics, offline support, and compliance reporting.

---

## Features

### Authentication and Authorization
- Secure JWT-based auth with automatic access/refresh token rotation.
- Google OAuth 2.0 integration for fast sign-in.
- Self-service password resets via email.
- Role-based permissions supporting Teacher and Admin access levels.
- Persistent login sessions.

### Dashboard and Analytics
- Real-time dashboard showing core attendance metrics and alerts.
- Interactive 30-day trends and history charts using Recharts.
- Subject-wise performance tracking.
- Actionable shortcuts for quick access to frequent workflows.

### Class and Student Management
- Structured class management supporting sections, academic years, and semesters.
- Subjects setup with customizable weekly schedules.
- Bulk student enrollment via CSV file upload.
- Class-level demographic and attendance data.

### Attendance Tracking
- Simple interface for marking student status: Present, Absent, Late, or Half-Day.
- Batch options to quickly mark all students at once.
- Manual attendance session logging with built-in duplicate prevention.
- Finalization locking to secure records after attendance is marked.
- Historical record edits with audit logs.

### Reporting
- Student and class report generators.
- Dynamic data filtering by date range, subject, and classroom.
- PDF downloads with a professional layout powered by PDFKit.
- Raw CSV exports for further data analysis.

### Progressive Web App (PWA) & Offline Mode
- Fully installable application bundle.
- Service worker configured for offline page loads.
- Smart API caching strategy (network-first, falling back to cached cache).
- Support for queueing changes locally during offline periods, with auto-sync when connection resumes.

---

## Repository Architecture

```
attendify/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   └── api/          # Express.js API backend
└── packages/
    ├── types/        # Shared TypeScript types
    └── config/       # Shared tooling configurations
```

- **Frontend Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand, React Hook Form, Zod, and Recharts.
- **Backend Stack**: Node.js, Express.js, TypeScript, Prisma, and PostgreSQL.
- **Security Protocols**: Helmet headers, custom CORS rules, Express rate limiting, bcrypt password hashing, and Zod input validation schemas.

---

## Local Setup

### Prerequisites
- Node.js 18 or newer
- PostgreSQL 14 or newer
- npm 9 or newer

### 1. Clone the Repository
```bash
git clone <repo-url>
cd attendify
npm install
```

### 2. Configure Environment Variables

```bash
# Backend Setup
cp apps/api/.env.example apps/api/.env
# Open and update apps/api/.env with your local DATABASE_URL and secrets

# Frontend Setup
cp apps/web/.env.local.example apps/web/.env.local
# Open and update apps/web/.env.local with your backend API URL
```

### 3. Generate Encryption Secrets
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run this script twice to generate random strings for both `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in your `.env` file.

### 4. Initialize the Database
```bash
cd apps/api
npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

### 5. Start the Development Servers
From the root workspace directory, run:
```bash
npm run dev
```

Alternatively, you can run the services individually:
- **Backend**: `cd apps/api && npm run dev` (running on port 5000)
- **Frontend**: `cd apps/web && npm run dev` (running on port 3000)

### 6. Verification
- **Web App**: http://localhost:3000
- **API Server**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

#### Seed Account Credentials
- **Teacher**: `teacher@demoschool.edu` / `Teacher@123`
- **Admin**: `admin@attendify.app` / `Admin@123456`

---

## Project Structure

```
apps/api/src/
├── config/           # Database client and environment configuration
├── middleware/       # Authentication, validation, and error handlers
├── routes/           # Endpoint handlers (auth, classes, students, attendance, reports)
├── services/         # Core business logic
├── validators/       # Request validation schemas
└── utils/            # JWT, crypto, emailing, and response formatting helpers

apps/web/
├── app/
│   ├── (auth)/       # Authentication pages
│   └── (dashboard)/  # Main panels (settings, reporting, classes, etc.)
├── components/
│   ├── ui/           # Generic interface primitives
│   └── shared/       # Navbar, sidebar, and layout systems
├── lib/
│   ├── api/          # Axios HTTP client configuration
│   ├── store/        # Zustand global state (auth/sessions)
│   └── utils.ts      # Shared UI utilities
└── public/
    ├── manifest.json
    └── sw.js
```

---

## API Reference

### Authentication
| Method | Endpoint | Description | Requires Auth |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register a new user | No |
| POST | `/api/auth/login` | Authenticate credentials | No |
| POST | `/api/auth/google` | Exchange Google OAuth code | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | Revoke session tokens | Yes |
| GET | `/api/auth/me` | Fetch active user profile | Yes |
| POST | `/api/auth/forgot-password` | Initiate password reset email | No |
| POST | `/api/auth/reset-password` | Set new password with token | No |

### Classes & Subjects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes` | Retrieve classes managed by the user |
| POST | `/api/classes` | Create a new class |
| GET | `/api/classes/:id` | Fetch class details |
| PUT | `/api/classes/:id` | Update class parameters |
| DELETE | `/api/classes/:id` | Soft delete a class |
| GET | `/api/classes/:id/subjects` | List subjects associated with a class |
| POST | `/api/classes/subjects/create` | Register a new subject |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | Search and paginate students |
| POST | `/api/students` | Enroll a single student |
| GET | `/api/students/:id` | Fetch student details and statistics |
| PUT | `/api/students/:id` | Update student profile details |
| DELETE | `/api/students/:id` | Soft delete a student |
| GET | `/api/students/:id/attendance` | Get detailed attendance log for a student |
| POST | `/api/students/bulk-import` | Upload a list of students via CSV |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance/dashboard` | Fetch dashboard stats |
| GET | `/api/attendance/sessions` | Query logged attendance sessions |
| POST | `/api/attendance/sessions` | Initialize a new session |
| GET | `/api/attendance/sessions/:id` | Get details and student list for a session |
| PUT | `/api/attendance/sessions/:id/finalize` | Finalize session and lock records |
| POST | `/api/attendance/mark` | Record status for a list of students |
| PUT | `/api/attendance/records/:id` | Edit specific attendance records |
| GET | `/api/attendance/analytics` | Fetch class-level metric summaries |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/student/:id` | Get metrics summary for student report |
| GET | `/api/reports/class/:id` | Get metrics summary for class report |
| POST | `/api/reports/export/csv` | Download class report as CSV |
| POST | `/api/reports/export/pdf` | Download class report as PDF |

---

## Testing

Backend test suites are written using Jest and Supertest.

```bash
# Run unit and integration tests
cd apps/api
npm test

# Generate test coverage reports
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

---

## Deployment Configuration

### Frontend (Vercel)
1. Link your repository in the Vercel dashboard.
2. Target the `apps/web` directory as the project root.
3. Configure the environment variables shown in `apps/web/.env.local.example`.
4. Deploy. Subsequent pushes to your main branch will trigger auto-deployments.

### Backend (Railway/Render)
1. Add a PostgreSQL resource instance.
2. Link the repository, setting the root directory to `apps/api`.
3. Provide the environment values from `apps/api/.env.example`.
4. Configure the build command: `npm install && npx prisma migrate deploy && npm run build`.
5. Set the startup run script command to: `npm start`.

---

## Security Practices

- **Token Rotation**: 15-minute expiration on access tokens paired with 7-day refresh tokens.
- **Password Hashing**: Strong bcrypt passwords using 12 salt rounds.
- **Request Protection**: CORS filters, Helmet headers, and IP rate-limiting guards on endpoints.
- **SQL Protection**: Parametrization by default through Prisma.
- **Payload Verification**: Strong input validation on both frontend and backend using Zod.
- **Soft Deletion**: Class and student removals flag a `deletedAt` field to preserve reporting history.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

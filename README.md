# 🎓 Attendify — Production-Grade Attendance Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)

Attendify is a **production-ready**, full-stack EdTech SaaS platform for attendance management — built for schools, colleges, coaching institutes, and universities.

---

## ✨ Features

### 🔐 Authentication
- JWT access + refresh token rotation
- Google OAuth 2.0
- Password reset via email
- Role-based access (Teacher / Admin)
- Session persistence

### 📊 Dashboard
- Real-time attendance stats
- 30-day trend charts (Recharts)
- Subject-wise analytics
- Quick action shortcuts

### 🏫 Class Management
- Create classes with sections, academic years, semesters
- Subject management with schedules
- CSV bulk student import
- Class-wise analytics

### ✅ Attendance System
- One-tap marking: Present / Absent / Late / Half-Day
- Mark-all bulk action
- Session creation with QR/PIN/Manual mode
- Finalize sessions (lock edits)
- Edit previous attendance
- Duplicate session prevention

### 📈 Analytics & Reports
- Area charts, bar charts, pie charts, radar charts
- Filter by class, subject, date range
- Export to PDF (styled with PDFKit)
- Export to CSV
- Student attendance summaries

### 📱 PWA & Offline
- Installable PWA with manifest
- Service worker caching
- Network-first API, cache-first static assets
- Push notification support

---

## 🏗️ Architecture

```
attendify/
├── apps/
│   ├── web/          # Next.js 15 frontend (Vercel)
│   └── api/          # Express.js backend (Railway/Render)
└── packages/
    ├── types/        # Shared TypeScript types
    └── config/       # Shared configs
```

**Frontend Stack:** Next.js 15 · TypeScript · Tailwind CSS · Framer Motion · Zustand · React Hook Form · Zod · Recharts

**Backend Stack:** Node.js · Express.js · TypeScript · Prisma · PostgreSQL

**Security:** Helmet · CORS · Rate Limiting · bcrypt · JWT · Zod validation

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm 9+

### 1. Clone & Install
```bash
git clone <repo-url>
cd attendify
npm install
```

### 2. Configure Environment

```bash
# Backend
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — fill in DATABASE_URL and JWT secrets

# Frontend
cp apps/web/.env.local.example apps/web/.env.local
# Edit apps/web/.env.local — fill in NEXT_PUBLIC_API_URL
```

### 3. Generate JWT Secrets
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run twice — one for `JWT_ACCESS_SECRET`, one for `JWT_REFRESH_SECRET`.

### 4. Setup Database
```bash
# Install backend dependencies
cd apps/api && npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed with demo data
npx ts-node prisma/seed.ts
```

### 5. Install Frontend Dependencies
```bash
cd ../web && npm install
```

### 6. Start Development Servers
```bash
# From root — starts both frontend and backend
cd ../..
npm run dev

# Or individually:
# Backend: cd apps/api && npm run dev  (port 5000)
# Frontend: cd apps/web && npm run dev  (port 3000)
```

### 7. Access the App
- **Frontend:** http://localhost:3000
- **API:** http://localhost:5000
- **API Health:** http://localhost:5000/health

### Demo Credentials
```
Teacher: teacher@demoschool.edu / Teacher@123
Admin:   admin@attendify.app / Admin@123456
```

---

## 📁 File Structure

```
apps/api/src/
├── config/          # env.ts, database.ts
├── middleware/       # auth.ts, validate.ts, errorHandler.ts
├── routes/          # auth, class, student, attendance, report
├── services/        # Business logic layer
├── validators/      # Zod schemas
└── utils/           # jwt.ts, crypto.ts, email.ts, response.ts

apps/web/
├── app/
│   ├── (auth)/      # login, signup, forgot-password
│   └── (dashboard)/ # dashboard, classes, students, attendance, analytics, reports
├── components/
│   ├── ui/          # Reusable UI components
│   └── shared/      # Layout, Sidebar, Header
├── lib/
│   ├── api/         # Typed API client + endpoints
│   ├── store/       # Zustand stores (auth, attendance)
│   └── utils.ts     # Helpers
└── public/
    ├── manifest.json
    └── sw.js
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/signup` | — |
| POST | `/api/auth/login` | — |
| POST | `/api/auth/google` | — |
| POST | `/api/auth/refresh` | — |
| POST | `/api/auth/logout` | ✅ |
| GET | `/api/auth/me` | ✅ |
| POST | `/api/auth/forgot-password` | — |
| POST | `/api/auth/reset-password` | — |

### Classes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes` | List classes |
| POST | `/api/classes` | Create class |
| GET | `/api/classes/:id` | Get class |
| PUT | `/api/classes/:id` | Update class |
| DELETE | `/api/classes/:id` | Delete (soft) |
| GET | `/api/classes/:id/subjects` | List subjects |
| POST | `/api/classes/subjects/create` | Add subject |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List (paginated) |
| POST | `/api/students` | Create |
| GET | `/api/students/:id` | Get profile |
| PUT | `/api/students/:id` | Update |
| DELETE | `/api/students/:id` | Delete (soft) |
| GET | `/api/students/:id/attendance` | Attendance history |
| POST | `/api/students/bulk-import` | CSV import |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance/dashboard` | Dashboard stats |
| GET | `/api/attendance/sessions` | List sessions |
| POST | `/api/attendance/sessions` | Create session |
| GET | `/api/attendance/sessions/:id` | Get session |
| PUT | `/api/attendance/sessions/:id/finalize` | Finalize |
| POST | `/api/attendance/mark` | Mark attendance |
| PUT | `/api/attendance/records/:id` | Update record |
| GET | `/api/attendance/analytics` | Analytics |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/student/:id` | Student report |
| GET | `/api/reports/class/:id` | Class report |
| POST | `/api/reports/export/csv` | Export CSV |
| POST | `/api/reports/export/pdf` | Export PDF |

---

## 🧪 Testing

```bash
# Backend unit + integration tests
cd apps/api
npm test
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 🚢 Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import to Vercel
3. Set environment variables from `.env.local.example`
4. Deploy — automatic on every push

### Backend (Railway)
1. Create new Railway project
2. Add PostgreSQL database plugin
3. Connect GitHub repo, set root to `apps/api`
4. Set all env variables from `.env.example`
5. Set build command: `npm install && npx prisma migrate deploy && npm run build`
6. Set start command: `npm start`

### Database Migrations (Production)
```bash
npx prisma migrate deploy
```

---

## 🔒 Security

- JWT tokens with 15-minute access + 7-day refresh rotation
- bcrypt with 12 salt rounds
- Helmet for HTTP security headers
- CORS restricted to frontend domain
- Rate limiting: 100 req/15min global, 10 req/15min for auth
- Zod validation on all inputs
- SQL injection prevention via Prisma parameterized queries
- Soft deletes preserve data integrity

---

## 🌟 Performance

- Prisma connection pooling
- Database indexes on all foreign keys and search fields
- Pagination on all list endpoints
- React Server Components for initial data
- Code splitting per route
- Image optimization with Next.js Image
- Service worker caching

---

## 📄 License

MIT © Attendify

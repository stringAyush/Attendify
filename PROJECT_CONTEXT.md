# Attendify — Master Project Context

> **For AI assistants:** Read this file first before any task. It contains the complete architecture, all decisions made, all bugs fixed, all env vars, and all commands needed to work on this project.

---

## 1. Project Overview

**Attendify** is a full-stack SaaS EdTech platform for managing student attendance in schools, colleges, and coaching institutes. It runs as a **web app** and a **native Android APK** (via Capacitor).

- **Target users:** Teachers, instructors, school administrators
- **Core features:** Class management, student enrollment, session-based attendance marking, analytics, CSV/PDF report exports
- **Mobile:** Capacitor wraps the Next.js static export into a native Android WebView

---

## 2. Monorepo Structure

```
attendify/                          ← root workspace (npm workspaces)
├── apps/
│   ├── api/                        ← Express.js REST API (TypeScript)
│   │   ├── src/
│   │   │   ├── app.ts              ← Express app, CORS, middleware setup
│   │   │   ├── index.ts            ← Server entry point, graceful shutdown
│   │   │   ├── config/
│   │   │   │   ├── env.ts          ← Zod-validated environment config
│   │   │   │   └── database.ts     ← Prisma client singleton
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts         ← JWT Bearer token guard
│   │   │   │   ├── errorHandler.ts ← Global error + asyncHandler wrapper
│   │   │   │   └── validate.ts     ← Zod body/query validation middleware
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── class.routes.ts
│   │   │   │   ├── student.routes.ts
│   │   │   │   ├── attendance.routes.ts
│   │   │   │   └── report.routes.ts
│   │   │   ├── services/           ← Business logic + Prisma queries
│   │   │   ├── utils/
│   │   │   │   └── response.ts     ← ApiSuccessResponse helper
│   │   │   └── validators/
│   │   │       └── schemas.ts      ← All Zod validation schemas
│   │   ├── tests/
│   │   │   └── integration/
│   │   │       └── auth.test.ts    ← Jest + Supertest integration tests
│   │   ├── .env                    ← Local secrets (gitignored)
│   │   ├── .env.example            ← Template — copy to .env
│   │   └── package.json
│   └── web/                        ← Next.js 16 App Router frontend
│       ├── app/
│       │   ├── layout.tsx          ← Root layout (ThemeInitializer, OfflineBanner, SW)
│       │   ├── page.tsx            ← Root redirect → /dashboard
│       │   ├── offline/page.tsx    ← Offline fallback page (served by SW)
│       │   ├── (auth)/             ← Login, signup, forgot-password, google callback
│       │   └── (dashboard)/        ← All protected pages
│       │       ├── layout.tsx      ← Dashboard shell (sidebar, topbar)
│       │       ├── dashboard/      ← Overview + Quick Actions
│       │       ├── classes/
│       │       │   ├── page.tsx    ← Class list
│       │       │   └── detail/     ← Class detail (query param: ?id=X)
│       │       ├── students/
│       │       │   ├── page.tsx    ← Student list
│       │       │   └── detail/     ← Student detail (query param: ?id=X)
│       │       ├── attendance/     ← Session management + marking
│       │       ├── analytics/      ← Charts and stats
│       │       └── reports/        ← Report generation + export
│       ├── android/                ← Capacitor native Android project
│       ├── components/
│       │   ├── shared/
│       │   │   ├── Layout.tsx      ← DashboardLayout wrapper
│       │   │   ├── ThemeInitializer.tsx ← Dark/light mode on mount
│       │   │   └── OfflineBanner.tsx    ← Animated offline status bar
│       │   └── ui/                 ← Button, Card, Badge, Modal, Input, etc.
│       ├── lib/
│       │   ├── api/
│       │   │   ├── client.ts       ← Axios instance, offline queue, token refresh
│       │   │   └── index.ts        ← All API call functions
│       │   ├── hooks/
│       │   │   └── useNetworkStatus.ts ← online/offline React hook
│       │   ├── store/
│       │   │   ├── auth.store.ts   ← Zustand auth state + session recovery
│       │   │   └── attendance.store.ts
│       │   └── utils.ts            ← formatDate, getAttendanceBg, etc.
│       ├── public/
│       │   ├── manifest.json       ← PWA manifest
│       │   ├── sw.js               ← Service worker (offline caching)
│       │   └── sw-register.js      ← Registers the SW on load
│       ├── .env.local              ← Local env (gitignored)
│       ├── .env.production.local   ← Production URL template (gitignored)
│       ├── capacitor.config.ts     ← Capacitor configuration
│       ├── next.config.ts          ← Next.js config (static export toggle)
│       └── package.json
├── packages/
│   └── config/
│       └── tsconfig.base.json      ← Shared TS compiler settings
├── docker-compose.yml              ← PostgreSQL container
├── package.json                    ← Root workspace + shared scripts
├── turbo.json                      ← Turborepo pipeline
└── PROJECT_CONTEXT.md              ← This file
```

---

## 3. Technology Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript + TSX |
| Styling | Tailwind CSS v4 + Vanilla CSS |
| Animations | Framer Motion |
| State | Zustand v5 (with `persist` middleware) |
| Forms | React Hook Form + Zod resolvers |
| HTTP | Axios with interceptors |
| Charts | Recharts |
| UI Primitives | Radix UI |
| Mobile | Capacitor v8 (Android WebView) |
| Offline DB | Dexie (IndexedDB — installed, not yet wired) |

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js (TypeScript) |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan |
| Compression | compression middleware |
| File upload | Multer (CSV bulk import) |
| Reports | pdfkit (PDF), fast-csv (CSV) |
| Testing | Jest + Supertest |
| Build | tsc + tsc-alias (resolves `@/` path aliases) |

---

## 4. Authentication Flow

```
User → POST /api/auth/login
         ↓
    AuthService.login()
    - bcrypt verify password
    - sign short-lived accessToken (15m, JWT_ACCESS_SECRET)
    - sign long-lived refreshToken (7d, JWT_REFRESH_SECRET)
         ↓
    Response: { user, accessToken, refreshToken }
         ↓
    Client (auth.store.ts):
    - setAccessToken(accessToken)        ← in-memory only (never persisted)
    - localStorage.set('refreshToken')   ← persisted for session recovery
    - Zustand persist: { user, isAuthenticated } → localStorage
```

### Session Recovery (on app start / page reload)
```
loadUser() called in dashboard layout:
  1. Read refreshToken from localStorage
  2. POST /api/auth/refresh → { accessToken, refreshToken }
  3. setAccessToken(newToken) in memory
  4. Store new refreshToken in localStorage
  5. Set isAuthenticated = true → user sees dashboard
  If refresh fails → clear all tokens → redirect to /auth/login
```

### Token Auto-Refresh (Axios interceptor in client.ts)
```
Any 401 response →
  1. Queue all pending requests
  2. POST /api/auth/refresh with stored refreshToken
  3. On success: update in-memory token, retry all queued requests
  4. On failure: clear tokens, redirect to /auth/login?reason=session_expired
```

---

## 5. Full API Reference

All routes are prefixed with `/api`. All protected routes require:
`Authorization: Bearer <accessToken>`

All responses follow this shape:
```json
{ "success": true, "data": {}, "message": "", "pagination": {} }
```

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/signup` | ✗ | Create account → returns user + tokens |
| POST | `/login` | ✗ | Login → returns user + tokens |
| POST | `/google` | ✗ | Google OAuth code exchange |
| POST | `/refresh` | ✗ | Refresh access token |
| POST | `/logout` | ✓ | Revoke refresh token |
| POST | `/forgot-password` | ✗ | Send password reset email |
| POST | `/reset-password` | ✗ | Reset password with token |
| GET | `/me` | ✓ | Get current user profile |

### Classes — `/api/classes`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List teacher's classes (paginated, searchable) |
| POST | `/` | Create a new class |
| GET | `/:id` | Get class by ID |
| PUT | `/:id` | Update class |
| DELETE | `/:id` | Soft-delete class |
| GET | `/:id/subjects` | List subjects for a class |
| POST | `/subjects/create` | Create a subject |
| PUT | `/subjects/:id` | Update subject |
| DELETE | `/subjects/:id` | Delete subject |

### Students — `/api/students`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List students (paginated, filter by classId) |
| POST | `/` | Create single student |
| GET | `/:id` | Get student by ID |
| PUT | `/:id` | Update student |
| DELETE | `/:id` | Soft-delete student |
| GET | `/:id/attendance` | Student attendance history (paginated) |
| POST | `/bulk-import` | CSV bulk import (multipart/form-data, field: `file`) |

### Attendance — `/api/attendance`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Dashboard stats for teacher |
| GET | `/sessions` | List sessions (filter: classId, subjectId, dates) |
| POST | `/sessions` | Create new attendance session |
| GET | `/sessions/:id` | Get session with all records |
| PUT | `/sessions/:id/finalize` | Lock session from further edits |
| POST | `/mark` | Mark attendance for multiple students |
| PUT | `/records/:id` | Update individual attendance record |
| GET | `/analytics` | Attendance analytics (filter by class/subject/date) |

### Reports — `/api/reports`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/student/:id?startDate=&endDate=` | Student attendance report |
| GET | `/class/:id?startDate=&endDate=` | Class attendance report |
| POST | `/export/csv` | Download CSV report (streaming) |
| POST | `/export/pdf` | Download PDF report (pdfkit, branded) |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server status, environment, version |

---

## 6. Environment Variables

### Backend — `apps/api/.env`
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/attendify?schema=public
JWT_ACCESS_SECRET=<64-char-random>     # openssl rand -hex 64
JWT_REFRESH_SECRET=<64-char-random>    # openssl rand -hex 64
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000     # production: https://attendify.app
EXTRA_CORS_ORIGINS=                    # comma-separated staging/preview URLs
GOOGLE_CLIENT_ID=optional
GOOGLE_CLIENT_SECRET=optional
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=app_password
SMTP_FROM=noreply@attendify.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
BCRYPT_SALT_ROUNDS=12
```

### Frontend — `apps/web/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000   # production: https://your-api.onrender.com
NEXT_PUBLIC_APP_URL=http://localhost:3000   # production: https://attendify.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=optional
```

> **Android Emulator:** Change `NEXT_PUBLIC_API_URL` to `http://10.0.2.2:5000`
> **Production APK:** Set `NEXT_PUBLIC_API_URL` to the deployed HTTPS API URL before running `npm run cap:build` — the URL is baked into the JS bundle at build time.

---

## 7. Setup Instructions

### Prerequisites
- Node.js v18 or v20
- Docker (for PostgreSQL)
- Android Studio + JDK 17 (for APK only)

### First-time Setup
```bash
# 1. Clone and install all dependencies from root
cd "attendify"
npm install

# 2. Copy and fill environment files
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your values

# 3. Start PostgreSQL
docker compose up -d

# 4. Push database schema
cd apps/api
npx prisma generate
npx prisma db push

# 5. Run both services (from root)
cd ..
npm run dev
```

### Services after `npm run dev`
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health check:** http://localhost:5000/health

---

## 8. All Build & Run Commands

### Root Workspace
```bash
npm run dev          # run frontend + backend concurrently
npm run build        # build all packages
npm run lint         # lint all packages
npm run db:generate  # prisma generate
npm run db:push      # prisma db push (dev)
npm run db:migrate   # prisma migrate deploy (production)
```

### Backend (`apps/api`)
```bash
npm run dev          # ts-node with watch
npm run build        # tsc && tsc-alias → /dist
npm run start        # node dist/index.js
npm run test         # jest integration tests
npm run test:watch   # jest in watch mode
```

### Frontend (`apps/web`)
```bash
npm run dev          # next dev (localhost:3000)
npm run build        # next build (SSR mode)
npm run start        # next start
npm run cap:build    # CAPACITOR=true next build && npx cap sync android
npm run cap:open     # npx cap open android (opens Android Studio)
```

---

## 9. Networking Architecture

### Problem (Fixed)
The app previously used hardcoded LAN IPs (`192.168.31.108`) in:
- `apps/web/.env.local`
- `apps/api/src/app.ts` CORS config
- `apps/web/capacitor.config.ts`

This caused the app to **fail on any other network, mobile data, or physical device on a different WiFi**.

### Solution (Current)
- All URLs are environment-variable-driven — no IPs in source code
- CORS allows: configured `FRONTEND_URL` + `EXTRA_CORS_ORIGINS` + `capacitor://localhost` + localhost variants (dev only)
- Production API URL is set at deploy time in the hosting platform dashboard
- For Capacitor APK: URL is baked in at `npm run cap:build` time via `NEXT_PUBLIC_API_URL`

### How Frontend ↔ Backend Communication Works
```
apps/web/lib/api/client.ts
  ↳ axios baseURL = process.env.NEXT_PUBLIC_API_URL + '/api'
  ↳ Request interceptor → attaches Authorization: Bearer <token>
  ↳ Offline interceptor → queues mutations to localStorage if offline
  ↳ Response interceptor → auto-refreshes on 401, retries original request
```

---

## 10. Offline Support

### Architecture
```
window.online / window.offline events
  ↓
useNetworkStatus hook → OfflineBanner component (shown/hidden)
  ↓
client.ts interceptor:
  - GET requests: allowed through (SW serves cache)
  - POST/PUT/PATCH/DELETE: saved to localStorage queue (attendify_offline_queue)
  ↓
window.online fires → flushOfflineQueue() replays all queued mutations
```

### Service Worker Strategy (`public/sw.js`)
| Request type | Strategy |
|-------------|---------|
| Static assets (`/_next/static/*`, images, fonts) | Cache-First |
| API calls (`/api/*`) | Network-First → cache fallback |
| Page navigation | Network-First → `/offline` page fallback |

### What Works Offline
| Feature | Offline Behaviour |
|---------|-------------------|
| Previously visited pages | ✅ Served from SW cache |
| Viewing loaded attendance data | ✅ SW API cache |
| Marking attendance (new) | 🟡 Queued → auto-syncs on reconnect |
| Creating classes/students | 🟡 Queued → auto-syncs |
| Login / signup | ❌ Network required |

---

## 11. Android APK Build Guide

### Step 1 — Set Production API URL
```bash
# In apps/web/.env.local — set your DEPLOYED backend URL:
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
```

### Step 2 — Build and Sync
```bash
cd apps/web
npm run cap:build    # compiles static export → syncs to android/
npm run cap:open     # opens Android Studio
```

### Step 3 — Android Studio
1. Let Gradle sync finish
2. **Build → Generate Signed Bundle / APK → APK → Next**
3. Create or select keystore → set alias + passwords
4. Choose `release` build variant → **Create**
5. APK output: `android/app/release/app-release.apk`

### Important Android Config
- `apps/web/android/app/src/main/AndroidManifest.xml`
  - `android:usesCleartextTraffic="false"` for production HTTPS
  - `android:usesCleartextTraffic="true"` only if testing against local HTTP API
- `capacitor.config.ts` — `allowMixedContent: false` for production

### Dynamic Routing Fix (Critical)
Next.js `output: 'export'` does not support dynamic path segments (e.g. `/classes/[id]`). These were migrated to **static routes with query parameters**:
- `/classes/[id]` → `/classes/detail?id=<ID>` (`app/(dashboard)/classes/detail/page.tsx`)
- `/students/[id]` → `/students/detail?id=<ID>` (`app/(dashboard)/students/detail/page.tsx`)
- Components use `useSearchParams()` instead of `useParams()`
- All links updated in `classes/page.tsx` and `students/page.tsx`

---

## 12. Production Deployment

### Recommended Free Stack
| Service | Provider | Notes |
|---------|----------|-------|
| Backend API | Render.com | Free tier, auto-deploys from GitHub |
| Database | Neon.tech | Free serverless PostgreSQL |
| Frontend Web | Vercel | Free tier, auto-detects Next.js |

### Backend on Render
1. New **Web Service** → connect GitHub repo
2. Root Directory: `apps/api`
3. Build Command: `npm install && npm run build`
4. Start Command: `node dist/index.js`
5. Add all env vars from `.env.example` in Render dashboard
6. Set `NODE_ENV=production`, `FRONTEND_URL=https://your-app.vercel.app`

### Database on Neon
1. Create project → copy connection string
2. Set as `DATABASE_URL` in Render env vars
3. Run once: `npx prisma migrate deploy`

### Frontend on Vercel
1. Connect repo → Root Directory: `apps/web`
2. Add env vars:
   - `NEXT_PUBLIC_API_URL=https://your-api.onrender.com`
   - `NEXT_PUBLIC_APP_URL=https://your-app.vercel.app`
3. Deploy automatically on push

---

## 13. Testing

```bash
# Run integration tests (requires running PostgreSQL)
cd apps/api
npm run test

# Tests use NODE_ENV=test which skips rate limiting
```

### Test Coverage (`tests/integration/auth.test.ts`)
- `POST /api/auth/signup` — creates account, rejects duplicate email, validates password strength
- `POST /api/auth/login` — valid credentials, rejects wrong password
- `POST /api/auth/refresh` — issues new access token, rejects invalid token
- `GET /api/auth/me` — returns profile when authenticated, rejects unauthenticated

Test cleanup: deletes the test user from DB in `afterAll`.

---

## 14. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| JWT in Authorization header (not cookies) | Avoids `SameSite`/`Secure` cookie complexity in Capacitor WebViews |
| Access token in memory only | Never written to localStorage — stolen tokens can't survive page close |
| Refresh token in localStorage | Required for session recovery across app restarts in Android WebView |
| Dynamic routes → query params | Next.js `output: 'export'` cannot serve `file:///...[id]/index.html` — fixed 404s in Capacitor |
| CAPACITOR env var toggle | `next.config.ts` switches between SSR mode (web) and static export (APK) |
| tsc-alias for backend build | Resolves `@/` path aliases that `tsc` alone leaves as-is in compiled output |
| Soft deletes (`deletedAt`) | Students/classes are never hard-deleted — attendance history preserved |

---

## 15. Completed Features

- [x] JWT auth with auto-refresh and session recovery
- [x] Google OAuth (code exchange flow)
- [x] Password reset via email (SMTP)
- [x] Class CRUD + subject management
- [x] Student CRUD + CSV bulk import
- [x] Attendance session creation and marking
- [x] Session finalization (lock from edits)
- [x] Attendance analytics + dashboard stats
- [x] Student attendance history with pagination
- [x] PDF and CSV report generation and download
- [x] Dark / light mode with ThemeInitializer
- [x] Responsive mobile-first UI
- [x] Quick Actions (Take Attendance, Add Class, Import Students) — fixed via query params
- [x] Capacitor Android project setup and build pipeline
- [x] Dynamic route → query param migration (Capacitor 404 fix)
- [x] Offline banner (OfflineBanner component)
- [x] Offline request queue with auto-sync on reconnect
- [x] Service worker (Cache-First static, Network-First API)
- [x] PWA manifest (installable)
- [x] LAN IP dependency removed — production-ready networking
- [x] CORS hardened (no 192.168.x.x regex, capacitor:// origin added, wildcard .vercel.app support)

## 16. Recent Stability & Production Fixes (May 2026)

| Component | Issue | Fix | Rationale |
| :--- | :--- | :--- | :--- |
| **API Tsconfig** | `Invalid value for '--ignoreDeprecations'` | Set `ignoreDeprecations` compiler option to `"5.0"` | Silences Node module resolution deprecation warnings correctly under TS 5.x. |
| **API Build (Render)** | Missing build types on Render | Moved all `@types/*` devDependencies to standard `dependencies` | Render production builds prune devDependencies, causing compilation to fail due to missing type definitions. |
| **Prisma Engine (Render)** | Native database engine crash | Added `binaryTargets = ["native", "debian-openssl-3.0.x", "linux-musl-openssl-3.0.x"]` | Ensures the compiled database client has the correct Linux engine binary target for Render containers. |
| **Web Build (Vercel)** | Turbopack PostCSS resolution error | Moved `@tailwindcss/postcss` and other build dependencies to `dependencies` | Prevents Vercel production prune from omitting packages needed to process Tailwind v4. |
| **CORS policy** | Dynamic Vercel previews blocked | Added dynamic check for `.vercel.app` suffixes | Allows all pull request and branch deployments on Vercel to securely connect to Render database endpoints without manual config updates. |
| **Auth / Signup** | Validation failed on optional institution | Added `.or(z.literal(''))` to `institutionName` in `signupSchema` | Allows blank input on optional form fields from frontend serializers. |
| **Auth / Google OAuth** | First Google login redirects user back to `/auth/login`; works only on second attempt | 3-part fix: **(1)** `auth.store.ts` — `loadUser()` early-return guard now calls `set({ isLoading: false })` before returning when already authenticated (previously skipped silently, leaving dashboard stuck in loading state). **(2)** `(dashboard)/layout.tsx` — Added `hasHydrated` state flag (set via `useEffect`) so the redirect-to-login check waits for Zustand `persist` async rehydration to complete. **(3)** `login/page.tsx` — Added `access_type: 'offline'` to Google OAuth redirect URL params so the authorization code exchange always returns a usable refresh token. | `loadUser()` called `return` without setting `isLoading: false`; Zustand `persist` rehydrates async so `isAuthenticated` was `false` on first render even with valid localStorage; Google auth code needed `access_type: 'offline'` to reliably exchange for tokens. |


---

## 17. Important Files Quick Reference

| File | Purpose |
|------|---------|
| `apps/api/src/app.ts` | Express app, CORS config (including *.vercel.app check), middleware order |
| `apps/api/src/config/env.ts` | All env vars parsed + validated with Zod (including strict DATABASE_URL check) |
| `apps/api/src/config/database.ts` | Prisma client singleton |
| `apps/api/src/middleware/auth.ts` | JWT Bearer guard — sets `req.user` |
| `apps/web/lib/api/client.ts` | Axios client, token attach, offline queue, auto-refresh |
| `apps/web/lib/store/auth.store.ts` | Login, logout, loadUser, session recovery |
| `apps/web/next.config.ts` | SSR vs static export toggle (CAPACITOR env var) |
| `apps/web/capacitor.config.ts` | Android app ID, webDir, plugins |
| `apps/web/public/sw.js` | Service worker — offline caching strategies |
| `apps/web/components/shared/OfflineBanner.tsx` | Animated offline UI bar |
| `apps/web/lib/hooks/useNetworkStatus.ts` | React online/offline hook |
| `apps/web/app/(dashboard)/classes/detail/page.tsx` | Static class detail (replaces dynamic `[id]`) |
| `apps/web/app/(dashboard)/students/detail/page.tsx` | Static student detail (replaces dynamic `[id]`) |
| `apps/web/app/offline/page.tsx` | SW offline fallback page |
| `docker-compose.yml` | PostgreSQL container definition |
| `apps/web/components/ui/index.tsx` | All shared UI primitives (Button, Input, Card, Badge, Modal, Toast, etc.) |
| `apps/web/components/shared/Layout.tsx` | DashboardLayout, Sidebar, MobileBottomNav, Header |
| `apps/web/app/globals.css` | Design system tokens, base styles, safe-area utilities |

---

## 18. UI / Design System Architecture (June 2026)

### Design Language
- **Minimal & professional** — no glassmorphism, no heavy gradients, no oversized radii
- **Spacing**: base unit 4px. All spacing uses Tailwind scale (p-3=12px, p-4=16px, p-5=20px)
- **Typography**: Inter via `next/font`. Label text: `text-xs tracking-wide font-medium`. Body: `text-sm`. Page titles: `text-lg font-semibold`
- **Colors**: indigo-600 as primary accent. Semantic status colors: emerald/amber/red/sky
- **Border radius**: `rounded-lg` (8px) for buttons/inputs/cards. `rounded-xl` (12px) for modals/page cards
- **Shadows**: Minimal — `shadow-sm` on cards only, no colored shadows
- **Dark mode**: Consistent `dark:` variants on all components. Background: `slate-950`, Cards: `slate-900`, Borders: `slate-800`

### Component Rules
| Component | Size system | Notes |
|-----------|-------------|-------|
| `Button` | `h-7/h-9/h-10` (sm/md/lg) | No `active:scale-95` animation |
| `Input` | `h-9` fixed | Label: `text-xs tracking-wide` |
| `Card` | border only, no shadow by default | `clickable` prop for hover states (NOT `hover`) |
| `Badge` | `rounded-md` | No `rounded-full` |
| `Avatar` | Semantic bg colors (not gradients) | 6 color variants based on name charCode |
| `Toast` | SVG icons (not emoji) | Left border accent, slides up from bottom |
| `Modal` | Bottom-sheet on mobile, centered on desktop | `rounded-t-2xl sm:rounded-xl` |

### Navigation
- **Desktop**: Fixed left sidebar, 224px wide (`w-56`), no icon-only state
- **Mobile**: Top header (menu hamburger) + fixed bottom tab bar with 5 primary nav items
- **Bottom nav offset**: All page `main` has `pb-24 lg:pb-7` to account for mobile bottom nav
- **Safe areas**: `.safe-bottom` class on `MobileBottomNav` for Capacitor notch handling

### Authentication Pages (Login, Signup, Forgot Password)
- **Visual Reference Alignment**: Implemented a modern, high-fidelity split layout inspired by premium SaaS visual references.
- **Left Panel**: Features a vibrant gradient (`from-indigo-750 via-indigo-900 to-purple-950`) with a 2x2 grid of semi-transparent feature cards (`border-white/[0.08] bg-white/[0.04]`). Copy highlights real platform features (One-Tap Workflows, Compliance Reports, Insights, Multi-device Sync) rather than placeholder metrics. Includes a professional "Designed for" tag track at the bottom.
- **Right Panel (Dark Form Style)**: Forced dark theme wrapper (`dark`) so inputs, buttons, and OAuth flows render in premium dark mode (`bg-slate-950`, dark inputs, outlines).
- **Google OAuth**: Clean outlined OAuth button with official Google Workspace branding.


### Iconography & Emojis
- **Eradication of Emojis**: Removed all raw emojis throughout the application (headers, badges, status notifications, buttons) and replaced them with vector iconography
- **Unified Icon System (`components/ui/icons.tsx`)**: Consistent stroke-based SVG icons (`strokeWidth={1.75}`, `viewBox="0 0 24 24"`) wrapping Lucide-inspired clean styles

### Key Files Changed
| File | What Changed |
|------|-------------|
| `globals.css` | Full rewrite — design tokens, professional CSS reset, safe-area utilities |
| `components/ui/index.tsx` | All primitives rewritten — new sizing system, better accessibility |
| `components/ui/icons.tsx` | Created unified vector icon library containing all stroke-based interface icons and the official Attendify branding/mark |
| `components/shared/Layout.tsx` | Added `MobileBottomNav`, narrowed sidebar, integrated the official logo |
| `components/shared/OfflineBanner.tsx` | Replaced raw SVG with unified WifiOff icon and set subtle amber tint banner |
| `app/(auth)/auth/login/page.tsx` | Dual-panel layout, features features list with new icons, password visibility toggle |
| `app/(auth)/auth/signup/page.tsx` | Dual-panel layout, matching branding and input styles, clean institution name helper |
| `app/(auth)/auth/forgot-password/page.tsx` | Dual-panel layout matching Login/Signup, no checkmark emoji, clear confirmation message |
| `app/(dashboard)/dashboard/page.tsx` | Minimal stat cards, trending icons, no emoji quick actions |
| `app/(dashboard)/attendance/page.tsx` | Redesigned Attendance page and student marking touch targets using custom Select, Input, and Modal primitives |
| `app/(dashboard)/classes/page.tsx` | Redesigned Classes list card interactions, academic years list, and modals |
| `app/(dashboard)/classes/detail/ClassDetailClient.tsx` | Polished Class Detail visual layout, subject management, and recent session links |
| `app/(dashboard)/students/page.tsx` | Standardized bulk import CSV dropzone design, clean action buttons, unified table spacing and search |
| `app/(dashboard)/students/detail/StudentDetailClient.tsx` | Replaced status emojis and text pagination markers with proper icon chevron buttons and structured stats |
| `app/offline/page.tsx` | Replaced raw SVG with new WifiOff icon |




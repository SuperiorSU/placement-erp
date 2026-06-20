@AGENTS.md

# Placement ERP — Project Reference

**Stack:** Next.js 16 (App Router) · TypeScript strict · PostgreSQL · Prisma 7 · NextAuth v5 · Zod · Tailwind CSS v4 · Google Drive API

---

## Module Completion

| # | Module | Status | Progress |
|---|--------|--------|----------|
| 1 | Foundation — Auth, DB schema, middleware, seed | Complete | 100% |
| 2 | Company Module — CRUD, pagination, filters | Complete | 100% |
| 3 | Drive & Enrollment — funnel, offer letters, bulk enroll | Complete | 100% |
| 4 | Internship Tracker + Consent Forms | Complete | 100% |
| 5 | Super Admin Dashboard + Analytics | Complete | 100% |
| 6 | Student Portal + Excel Reports | Complete | 100% |
| 7 | Security Hardening + Tests + Deploy | Complete | 100% |
| 6b | Company Drive Analytics + Advanced Reports | Complete | 100% |

**Overall: 100% complete**

---

### Module 1 Complete
- ✅ Next.js project scaffolded with TypeScript strict
- ✅ Prisma 7 + PostgreSQL configured (with `@prisma/adapter-pg`, `PrismaPg` adapter)
- ✅ Complete Prisma schema with all models (User, Admin, Student, Company, Drive, DriveApplication, Placement, ManualPlacement, Internship, ConsentForm, ConsentSignature, AuditLog)
- ✅ NextAuth v5 JWT authentication — uses `auth()`, not `getServerSession()`
- ✅ Auth routes: `/api/v1/auth/login`, `/api/v1/auth/logout`, `/api/v1/auth/refresh`, `/api/v1/auth/register`
- ✅ Root middleware with RBAC protection
- ✅ Rate limiting middleware with Upstash Redis (graceful no-op when Redis not configured)
- ✅ Audit logging middleware (`logActivity` — always non-blocking: `.catch(() => {})`)
- ✅ `createRoute` wrapper pattern enforcing auth/RBAC/rate-limit/validation
- ✅ Standardized `ApiResponse` format (success / error / paginated)
- ✅ Zod schemas for auth + shared pagination (`PaginationSchema` in `shared.schema.ts`)
- ✅ Auth service: bcrypt 12 rounds, timing-safe login, register with profile creation
- ✅ Error class hierarchy (`AuthError`, `NotFoundError`, `ConflictError`, `ForbiddenError`, `ValidationError`)
- ✅ Database seed: 1 super-admin + 1 admin + 5 students
- ✅ Auth layout + login page (design-system compliant)

### Module 2 Complete
- ✅ `src/lib/validations/company.schema.ts` — CreateCompany, UpdateCompany, CompanyListQuery
- ✅ `src/lib/services/company.service.ts` — list (paginated+filtered), getById, create, update, soft-delete
- ✅ `GET/POST /api/v1/admin/companies` · `GET/PATCH/DELETE /api/v1/admin/companies/[id]`
- ✅ Dashboard shell: `src/app/(dashboard)/layout.tsx` + `Sidebar` + `NavItem` + `SignOutButton`
- ✅ Admin layout guard: `src/app/(dashboard)/admin/layout.tsx`
- ✅ `src/components/ui/Badge.tsx` — category + status badges (PRIME, AVERAGE, BELOW_AVERAGE, ACTIVE, UPCOMING, COMPLETED, CANCELLED, REGISTERED, SHORTLISTED, INTERVIEWED, OFFERED, NOT_SELECTED)
- ✅ Company list / create / detail+edit pages (URL-state filters, soft-delete dialog)
- ✅ `src/types/api.types.ts` — typed response shapes

### Module 3 Complete
- ✅ `src/lib/validations/drive.schema.ts` — CreateDrive, UpdateDrive, DriveListQuery, BulkEnrollSchema
- ✅ `src/lib/services/drive.service.ts` — funnel stage transitions (forward-only), bulk enroll via XLSX, offer letter Google Drive upload
- ✅ `GET/POST /api/v1/admin/drives` · `GET/PATCH/DELETE /api/v1/admin/drives/[id]`
- ✅ `POST /api/v1/admin/drives/[id]/enroll` · `POST /api/v1/admin/drives/[id]/bulk-enroll`
- ✅ `GET/PATCH /api/v1/admin/drives/[id]/applications/[appId]` — stage advance + offer letter upload
- ✅ `GET /api/v1/admin/drives/[id]/eligible-students` — students meeting branch + CGPA criteria
- ✅ Admin drives list / detail / create pages + `BulkEnrollUpload` client component
- ✅ `src/lib/google-drive/drive.client.ts` — `uploadFile`, `getDownloadUrl`, `deleteFile` (graceful no-op if env not set)

### Module 6b Complete — Company Drive Analytics + Advanced Reports
- ✅ `DriveParticipantQuerySchema` + `CompanyDriveHistoryQuerySchema` added to `drive.schema.ts`
- ✅ `src/lib/validations/report.schema.ts` — 4 new schemas: CompanyReport, BranchReport, DriveReport, YearlyCompanies
- ✅ `CompanyService.getDriveHistory(id, params)` — paginated, year/status filter, stageCounts in-memory
- ✅ `DriveService.getDriveSummary(driveId)` — stageCounts + branchBreakdown + avgCtcOffered, all in-memory
- ✅ `DriveService.getParticipants(driveId, params)` — filterable by branch/stage/q/jobRole/minCtc/maxCtc, paginated
- ✅ `ReportService.companyAllDrives/companyFiltered/yearAllCompanies/branchDetail/driveParticipants` — 5 new multi-tab xlsx generators
- ✅ `GET /api/v1/admin/drives/[id]/summary` · `GET /api/v1/admin/drives/[id]/participants`
- ✅ `GET /api/v1/admin/companies/[id]/drives`
- ✅ 5 new report routes: company-all-drives, company-filtered, yearly-companies, branch-detail, drive-participants
- ✅ Drive detail page: summary stats strip + branch breakdown card + `DriveParticipantsTable` client component
- ✅ Company detail page: full-width `CompanyDriveHistory` table (year/status filter + per-row stage counts + download)
- ✅ Reports page: new "Advanced reports" section with 4 interactive download cards (company selector, year/month pickers, branch input)

### Module 4 Complete
- ✅ `src/lib/validations/internship.schema.ts` — CreateInternship, UpdateInternship, InternshipListQuery
- ✅ `src/lib/validations/consent.schema.ts` — CreateConsentForm, UpdateConsentForm, SignConsentForm
- ✅ `src/lib/services/internship.service.ts` — `endDate = startDate + durationMonths`, ending-soon filter
- ✅ `src/lib/services/consent.service.ts` — DOMPurify sanitize, sign/upsert, delete guard (no signed sigs)
- ✅ `src/lib/email/mailer.ts` — nodemailer (graceful no-op if SMTP not set)
- ✅ `GET/POST /api/v1/admin/internships` · `GET/PATCH /api/v1/admin/internships/[id]`
- ✅ `GET/POST /api/v1/admin/consent-forms` · `GET/PATCH/DELETE /api/v1/admin/consent-forms/[id]`
- ✅ `POST /api/v1/cron/internship-alerts` — plain handler (no createRoute), Bearer CRON_SECRET auth
- ✅ Admin internships page (outcome filter, ending-soon highlight, UpdateOutcomeButton)
- ✅ Admin consent-forms list / create / edit+signatures pages
- ✅ Admin students page (search + branch filter)
- ✅ Admin placements page (`/admin/placements` — stats grid, type/year filter, ManualPlacementModal)
- ✅ Admin reports page (6 xlsx downloads: branch-wise, company-wise, monthly, yearly, internship-conversion, manual-placements)

### Module 5 Complete
- ✅ `src/lib/validations/placement.schema.ts` — CreateManualPlacement, PlacementList
- ✅ `src/lib/services/placement.service.ts` — createManual (Intern/Full-time → MANUAL, PPO → PPO), list, getStats
- ✅ `src/lib/services/report.service.ts` — 6 ExcelJS workbook generators (return `Promise<Buffer>`, wrap in `new Uint8Array()` in routes)
- ✅ `src/lib/services/super-admin.service.ts` — createAdmin (bcrypt 12), deleteAdmin (soft-deactivate), getAnalytics, getDashboardStats
- ✅ `GET /api/v1/super-admin/dashboard` · `GET /api/v1/super-admin/analytics`
- ✅ `GET/POST /api/v1/super-admin/admins` · `PATCH/DELETE /api/v1/super-admin/admins/[id]`
- ✅ `GET /api/v1/admin/placements/manual` · `POST /api/v1/admin/placements/manual`
- ✅ `GET /api/v1/admin/reports/{branch-wise,company-wise,monthly,yearly,internship-conversion,manual-placements}`
- ✅ Super-admin layout guard: `src/app/(dashboard)/super-admin/layout.tsx`
- ✅ Super-admin dashboard (KPI grid, active drives list, internship outcome breakdown)
- ✅ Super-admin analytics page (year filter, branch-wise + company + monthly tables)
- ✅ Super-admin admins management (search, CreateAdminModal, AdminActions activate/deactivate)

### Module 6 Complete
- ✅ `src/lib/validations/student.schema.ts` — UpdateStudentProfile
- ✅ `src/lib/services/student.service.ts` — browseDrives (with appliedSet), getConsentForms (in-memory status filter), signConsentForm
- ✅ Student layout guard: `src/app/(dashboard)/student/layout.tsx`
- ✅ `GET /api/v1/student/profile` · `GET /api/v1/student/dashboard`
- ✅ `GET /api/v1/student/companies` (browse active drives) · `POST /api/v1/student/companies/[id]/register`
- ✅ `GET /api/v1/student/applications`
- ✅ `GET /api/v1/student/consent-forms` · `POST /api/v1/student/consent-forms/[id]/sign` · `GET /api/v1/student/consent-forms/[id]/download`
- ✅ Student dashboard (welcome, KPI cards, open drives, recent applications)
- ✅ Student companies page (drive card grid, DriveStatusFilter, DriveSearch)
- ✅ Student applications page (table, StageFilter, offer letter download link)
- ✅ Student consent-forms page (ConsentStatusFilter, SignatureModal — Draw canvas + Typed tabs)

### Module 7 Complete
- ✅ Security audit: CSP headers already in `next.config.ts` (X-Frame-Options, HSTS, CSP, Permissions-Policy)
- ✅ Cookie security: explicit `httpOnly`, `secure` (prod-only), `sameSite: "lax"` flags in `src/lib/auth/config.ts`
- ✅ `trustHost: true` added to NextAuth config for Vercel reverse-proxy deployment
- ✅ `/api/v1/auth/register` already returns 403 in production (guarded by `process.env.NODE_ENV` check)
- ✅ DB performance: `@@index([driveId, stage])` compound index on `DriveApplication` for participants queries
- ✅ `vercel.json` — cron at `0 9 * * *` for internship alerts + `maxDuration: 30` for all API routes
- ✅ `vitest.config.ts` — configured with `@/` alias, node environment, v8 coverage
- ✅ Unit tests (45 passing): `ApiResponse`, error classes, `createRoute` wrapper (auth/RBAC/validation/rate-limit/error handling), `AuthService` (timing-safe login, bcrypt, register)
- ✅ Playwright config (`playwright.config.ts`) — `webServer` auto-start in dev, CI-safe (retries, single worker)
- ✅ E2E tests: `tests/e2e/auth.spec.ts` (login/logout/RBAC), `tests/e2e/admin-drive.spec.ts` (drives, companies, reports), `tests/e2e/student.spec.ts` (portal, companies, applications, consent)
- ✅ Test scripts: `npm test`, `npm run test:watch`, `npm run test:coverage`, `npm run test:e2e`

---

## Architecture Rules (enforce always)

- All API routes live under `src/app/api/v1/` — never break this versioning.
- Every API route **must** use the `createRoute` wrapper from `src/lib/utils/route-handler.ts`. Exception: cron routes use a plain `async function POST` with manual `Bearer ${CRON_SECRET}` check.
- No Prisma calls in route files — business logic goes in `src/lib/services/`.
- Zod schemas go in `src/lib/validations/` — one file per domain.
- UI tokens come from `src/app/globals.css` under `@theme` (Tailwind v4) — use `surface`, `accent`, `ink`, `prime`, `average`, `below` token names.
- Never spread `req.body` directly into Prisma — always destructure named fields.
- Never use `prisma.$queryRaw` with template literals containing user input.
- Sanitize HTML consent form content with `isomorphic-dompurify` before storing.
- All `logActivity(...)` calls must be non-blocking: `.catch(() => {})`.
- Prisma Decimal fields (`ctc`, `cgpa`, `minCgpa`) must be wrapped in `Number()` in service return values.
- Dynamic route params (`params`) and page `searchParams` are `Promise<...>` in Next.js 16 — always `await` them.

---

## Source Layout

```
src/
├── app/
│   ├── (auth)/                    # login page, auth layout
│   ├── (dashboard)/
│   │   ├── super-admin/           # SUPER_ADMIN pages (dashboard, analytics, admins)
│   │   ├── admin/                 # ADMIN pages (companies, drives, internships, consent-forms, students, placements, reports)
│   │   └── student/               # STUDENT pages (dashboard, companies, applications, consent-forms)
│   └── api/v1/
│       ├── auth/                  # login, logout, refresh, register
│       ├── super-admin/           # dashboard, analytics, admins CRUD
│       ├── admin/                 # companies, drives, placements, internships, consent-forms, reports, students
│       ├── student/               # profile, dashboard, companies, applications, consent-forms
│       └── cron/                  # internship-alerts (Vercel Cron, daily 9am)
├── lib/
│   ├── auth/         config.ts · rbac.ts
│   ├── db/           prisma.ts (singleton)
│   ├── services/     company · student · drive · internship · consent · placement · report · super-admin
│   ├── validations/  auth · shared · company · student · drive · internship · consent · placement
│   ├── middleware/   auth · ratelimit · audit
│   ├── google-drive/ drive.client.ts
│   ├── email/        mailer.ts
│   └── utils/        api-response · errors · route-handler
├── components/
│   ├── ui/           Badge.tsx (base design system)
│   └── layout/       Sidebar · NavItem · SignOutButton
└── types/            api.types · auth.types
```

Root: `middleware.ts` · `vercel.json` · `.env.local`
Prisma: `prisma/schema.prisma` · `prisma/migrations/`

---

## Key Patterns

**Route wrapper (standard):**
```ts
export const POST = createRoute(
  { roles: ["ADMIN"], rateLimit: "api", bodySchema: CreateXSchema, action: "CREATE_X" },
  async (req, { session, body }) => { ... }
);
```

**Dynamic route params (Next.js 16 — params is a Promise):**
```ts
export const GET = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  createRoute({ roles: ["ADMIN"], rateLimit: "api" }, async () => {
    const { id } = await params;
    ...
  })(req);
```

**Cron route (no createRoute):**
```ts
export async function POST(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  ...
}
```

**Report routes (ExcelJS Buffer → Uint8Array for Response):**
```ts
const buffer = await ReportService.branchWise(year);
return new Response(new Uint8Array(buffer), {
  headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
});
```

**Client search with URL state (no useSearchParams — React 19 + Next.js 16):**
```ts
function setParam(key: string, value: string | null) {
  const params = new URLSearchParams(window.location.search);
  if (value) { params.set(key, value); } else { params.delete(key); }
  params.delete("page");
  router.push(`?${params.toString()}`);
}
```

**useRef in React 19 (initial value required):**
```ts
const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
```

**Standardized responses:** `ApiResponse.success(data)` · `ApiResponse.error(code, msg)` · `ApiResponse.paginated(data, total, page, limit)`

**Rate limiters:** `"auth"` (5/15min) · `"api"` (100/min) · `"upload"` (10/min)

**RBAC roles:** `SUPER_ADMIN` > `ADMIN` > `STUDENT`

---

## Environment Variables Required

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_SERVICE_ACCOUNT_JSON
GDRIVE_OFFER_LETTERS_FOLDER
GDRIVE_CONSENT_FORMS_FOLDER
REDIS_URL
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
CRON_SECRET
```

All Google Drive / SMTP / Redis vars are optional for local dev — services degrade gracefully to no-ops.

---

## Design Tokens (Tailwind v4 — defined in `src/app/globals.css` under `@theme`)

| Token | Value | Use |
|-------|-------|-----|
| `surface` | `#0F1117` | Page background |
| `surface-50` | `#1C1F2A` | Card background |
| `accent` | `#4F7CFF` | Primary action |
| `ink` | `#F0F2F8` | Body text |
| `ink-muted` | `#8B90A7` | Secondary text |
| `prime` | `#22D3A0` | PRIME company badge |
| `average` | `#F59E0B` | AVERAGE company badge |
| `below` | `#F43F5E` | BELOW_AVERAGE badge |

Fonts: `font-display` (Cabinet Grotesk) · `font-body` (DM Sans) · `font-mono` (JetBrains Mono)

Transition: use `duration-80` (not `duration-[80ms]` — Tailwind v4 syntax).

---

## API Endpoints (All Implemented)

### Auth
| Endpoint | Method | Roles | Notes |
|----------|--------|-------|-------|
| `/api/v1/auth/register` | POST | Public | Dev-only; gate in prod |
| `/api/v1/auth/login` | POST | Public | Returns JWT cookie |
| `/api/v1/auth/logout` | POST | Any auth | Clears cookie |
| `/api/v1/auth/refresh` | POST | Any auth | Rotates token |

### Super Admin
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/v1/super-admin/dashboard` | GET | KPI stats |
| `/api/v1/super-admin/analytics` | GET | `?year=2024-2025` |
| `/api/v1/super-admin/admins` | GET, POST | List + create admin |
| `/api/v1/super-admin/admins/[id]` | PATCH, DELETE | Update + deactivate |

### Admin — Companies & Drives
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/v1/admin/companies` | GET, POST | |
| `/api/v1/admin/companies/[id]` | GET, PATCH, DELETE | Soft-delete |
| `/api/v1/admin/drives` | GET, POST | |
| `/api/v1/admin/drives/[id]` | GET, PATCH, DELETE | |
| `/api/v1/admin/drives/[id]/enroll` | POST | Single student enroll |
| `/api/v1/admin/drives/[id]/bulk-enroll` | POST | XLSX upload |
| `/api/v1/admin/drives/[id]/applications` | GET | List applications |
| `/api/v1/admin/drives/[id]/applications/[appId]` | GET, PATCH | Stage advance + offer letter |
| `/api/v1/admin/drives/[id]/eligible-students` | GET | Branch + CGPA filter |
| `/api/v1/admin/drives/[id]/summary` | GET | Stats + branch breakdown |
| `/api/v1/admin/drives/[id]/participants` | GET | Paginated participants with filters |
| `/api/v1/admin/companies/[id]/drives` | GET | Paginated company drive history |

### Admin — Advanced Reports
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/v1/admin/reports/company-all-drives` | GET | `?companyId=` → multi-tab workbook |
| `/api/v1/admin/reports/company-filtered` | GET | `?companyId=&year=&month=` |
| `/api/v1/admin/reports/yearly-companies` | GET | `?year=YYYY-YYYY` all companies in year |
| `/api/v1/admin/reports/branch-detail` | GET | `?branch=&year=` branch drill-down |
| `/api/v1/admin/reports/drive-participants` | GET | `?driveId=&branch=&stage=&minCtc=&maxCtc=` |

### Admin — Internships & Consent
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/v1/admin/internships` | GET, POST | |
| `/api/v1/admin/internships/[id]` | GET, PATCH | Update outcome |
| `/api/v1/admin/consent-forms` | GET, POST | |
| `/api/v1/admin/consent-forms/[id]` | GET, PATCH, DELETE | |

### Admin — Placements & Reports
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/v1/admin/placements/manual` | POST | Record manual/PPO |
| `/api/v1/admin/reports/branch-wise` | GET | `?year=` xlsx |
| `/api/v1/admin/reports/company-wise` | GET | |
| `/api/v1/admin/reports/monthly` | GET | |
| `/api/v1/admin/reports/yearly` | GET | |
| `/api/v1/admin/reports/internship-conversion` | GET | |
| `/api/v1/admin/reports/manual-placements` | GET | |
| `/api/v1/admin/dashboard` | GET | |

### Student
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/v1/student/profile` | GET | |
| `/api/v1/student/dashboard` | GET | |
| `/api/v1/student/companies` | GET | Browse active drives |
| `/api/v1/student/companies/[id]/register` | POST | Apply to drive |
| `/api/v1/student/applications` | GET | |
| `/api/v1/student/consent-forms` | GET | |
| `/api/v1/student/consent-forms/[id]/sign` | POST | Draw or typed signature |
| `/api/v1/student/consent-forms/[id]/download` | GET | Signature data |

### Cron
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/v1/cron/internship-alerts` | POST | Bearer CRON_SECRET; Vercel daily 9am |

---

## Known Pre-existing TypeScript Errors (not regressions)

These existed before Module 3 and are non-blocking at runtime:
- `prisma.config.ts(24)` — `directUrl` key not in Prisma v7 type
- `src/lib/auth/config.ts(38)` — `NEXTAUTH_URL` possibly `undefined`
- `src/lib/middleware/audit.middleware.ts(12)` — `Record<string, unknown>` not assignable to Prisma JSON input
- `src/lib/utils/route-handler.ts(57,101)` — `req.ip` removed from Next.js 16 `NextRequest` types
- `src/app/api/v1/auth/login/route.ts(41)` — same `req.ip` issue

---

## Local Dev Setup

```bash
# 1. Copy and fill env
cp .env.example .env.local

# 2. Install dependencies
npm install

# 3. Run migrations
npx prisma migrate dev

# 4. Seed database
npx prisma db seed

# 5. Start dev server
npm run dev
```

Seed credentials:
- Super Admin: `superadmin@erp.local` / `SuperAdmin@123`
- Admin: `admin@erp.local` / `Admin@123`
- Students: `student1@erp.local` … `student5@erp.local` / `Student@123`

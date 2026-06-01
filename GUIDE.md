# Placement ERP — Master Build Plan
**Next.js · PostgreSQL · Google Drive · Production-Grade**
*Version 1.0 — May 2026*

---

## Table of Contents

1. [Tooling Strategy — How to Use Every Resource](#1-tooling-strategy)
2. [Tech Stack Decisions](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [API Design — Versioning, Routes, Security](#5-api-design)
6. [Authentication & RBAC](#6-authentication--rbac)
7. [Security Layers](#7-security-layers)
8. [Google Drive Integration](#8-google-drive-integration)
9. [UI Design System — impeccable.style](#9-ui-design-system)
10. [Day-by-Day Execution Plan](#10-day-by-day-execution-plan)
11. [Deployment & CI/CD](#11-deployment--cicd)
12. [Prompt Templates for Each AI Tool](#12-prompt-templates)

---

## 1. Tooling Strategy

### The Three-Tool System

You have three distinct tools. Use them for distinct **jobs** — never overlap their roles.

---

### Claude Code (Terminal Agent)
**Role: Architect + Scaffolder + Security Auditor + Refactorer**

Claude Code runs agentic, multi-file, long-context tasks. It should own work that requires reading/writing many files at once or running commands.

| Task Type | Use Claude Code For |
|-----------|---------------------|
| Initial scaffold | `npx create-next-app`, Prisma init, folder structure, all base config files |
| Migrations | Writing and running Prisma migrations (`prisma migrate dev`) |
| Complex backend logic | Multi-file features: auth middleware + route + schema + type together |
| Security audit | "Read all API routes and find missing auth checks, rate limits, input validation" |
| Refactoring | "Extract all inline SQL into service layer", "Add Zod schemas to all routes" |
| Test generation | "Write Jest tests for all auth flows based on existing route files" |
| Debugging | "Read the error log and trace through the codebase to find the bug" |
| Pre-commit sweep | "Check for console.logs, hardcoded secrets, missing error handling" |

**Claude Code Workflow:**
```bash
# Start a session with context
claude "Read the entire /src/app/api directory and audit every route for: 
missing auth, missing rate limiting, missing input validation, SQL injection risk"

# Feature implementation
claude "Implement the full consent form feature: 
- Prisma schema (consent_forms, consent_signatures tables)
- API routes: POST /api/v1/admin/consent-forms, GET, PATCH
- Zod validation schemas
- Service layer functions
- Follow the pattern in /src/lib/services/company.service.ts"
```

---

### 3 Free Claude Accounts (claude.ai)
**Role: Thinking Partner + Code Reviewer + Parallel Design Work**

Free accounts have context limits but excel at focused, single-topic tasks. Rotate them to stay within limits.

**Account Assignment (rotate daily):**

| Account | Primary Job |
|---------|------------|
| Account 1 | Frontend: UI component design, Tailwind class decisions, layout feedback |
| Account 2 | Backend: Logic review, schema design, API contract design |
| Account 3 | Security & testing: Prompt injection, attack vector review, test case generation |

**How to rotate without losing context:**
- Keep a `CONTEXT_SNAPSHOT.md` file in the repo root (update it daily)
- At the start of each claude.ai session, paste the snapshot + your question
- The snapshot should contain: current schema, current API routes list, today's task

**CONTEXT_SNAPSHOT.md template:**
```markdown
## Project: Placement ERP (Next.js 14, PostgreSQL, Prisma, Google Drive)
## Current Day: [Day X]
## Completed modules: [list]
## Today's module: [module name]
## Key files relevant to today: [list]
## Current question: [your question]
```

**What to ask each account:**

Account 1 (UI): 
> "Here is my current Tailwind component for the company card. The design system uses: [paste tokens]. Review and improve the visual hierarchy, spacing, and micro-interactions."

Account 2 (Backend):
> "Here is my Prisma schema for the drives/funnel system. Review for: normalization, missing indexes, cascade rules, and any N+1 query risks."

Account 3 (Security):
> "Here are my 3 auth middleware functions. Find every possible bypass, missing check, or privilege escalation vector."

---

### GitHub Copilot (Student Pack — VS Code/JetBrains)
**Role: Inline Autocomplete + Boilerplate Eliminator + Test Filler**

Copilot excels at short, repetitive, pattern-based code. Never ask it to architect.

| Good Copilot Tasks | Bad Copilot Tasks |
|-------------------|------------------|
| Filling out Zod schema fields | Designing auth flow |
| Writing the 10th similar API route once the pattern is set | Security logic |
| Completing Prisma query boilerplate | Complex business logic |
| Writing repetitive test cases | Database schema design |
| JSDoc comments | Anything requiring project-wide context |

**Copilot Usage Tips:**
- Write a detailed comment before a function, then let Copilot autocomplete the body
- Write one complete example (e.g. one API route), then use Copilot to fill out the next 5 similar ones
- Use Copilot Chat (sidebar) for quick explanations of unfamiliar packages
- Accept Copilot for boilerplate only — always review security-critical code yourself

---

### The Collaboration Loop (Daily Rhythm)
```
Morning:
  1. Claude Code: scaffold today's module (creates files, schema, base routes)
  2. Copilot: fill in repetitive fields while writing (inline autocomplete)

Afternoon:
  3. Account 2 (Backend): review service logic and schema
  4. Account 1 (UI): review component designs and layouts

Evening:
  5. Account 3 (Security): attack surface review of today's routes
  6. Claude Code: fix everything found, run tests, commit
```

---

## 2. Tech Stack

### Why Next.js over React + Express

| Concern | Express.js | Next.js API Routes |
|---------|-----------|-------------------|
| Routing boilerplate | Manual | Filesystem-based |
| Middleware | Manual | `middleware.ts` at root |
| Security headers | Manual (helmet) | `next.config.js` headers |
| Type safety | Opt-in | Built-in with App Router |
| Deployment | Separate server | Single Vercel/Railway deploy |
| API versioning | Express Router | `/api/v1/` folder structure |

### Final Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | Next.js 14 (App Router) | RSC, API routes, middleware, single deploy |
| Language | TypeScript (strict) | Type safety end-to-end |
| Database | PostgreSQL | Relational, ACID, strong typing |
| ORM | Prisma | Type-safe queries, migrations, no raw SQL |
| Auth | NextAuth.js v5 (JWT strategy) | RBAC, session management, built-in CSRF |
| Validation | Zod | Runtime + compile-time validation |
| UI | Tailwind CSS + shadcn/ui base + custom design tokens | impeccable.style compatible |
| File Storage | Google Drive API v3 | Per spec, replaces S3 |
| Email | Nodemailer + Gmail SMTP | Free, reliable |
| Rate Limiting | `@upstash/ratelimit` + Upstash Redis (free tier) | Edge-compatible rate limiting |
| Excel Export | ExcelJS | .xlsx generation |
| E-Sign | `react-signature-canvas` | Canvas-based draw/type |
| Charts | Recharts | Lightweight, SSR-safe |
| Jobs/Cron | Vercel Cron Jobs | Free, built-in for internship alerts |
| Deployment | Vercel (frontend+API) + Supabase (PostgreSQL free) | Free tier covers 1-week build |

---

## 3. Project Structure

```
placement-erp/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── super-admin/
│   │   │   │   ├── layout.tsx           # Auth guard: SUPER_ADMIN only
│   │   │   │   ├── page.tsx             # Dashboard
│   │   │   │   ├── analytics/page.tsx
│   │   │   │   └── admins/page.tsx
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx           # Auth guard: ADMIN only
│   │   │   │   ├── page.tsx
│   │   │   │   ├── companies/
│   │   │   │   ├── students/
│   │   │   │   ├── internships/
│   │   │   │   ├── consent-forms/
│   │   │   │   └── reports/
│   │   │   └── student/
│   │   │       ├── layout.tsx           # Auth guard: STUDENT only
│   │   │       ├── page.tsx
│   │   │       ├── companies/
│   │   │       ├── applications/
│   │   │       └── consent-forms/
│   │   └── api/
│   │       └── v1/                      # ALL API routes versioned under /api/v1/
│   │           ├── auth/
│   │           │   ├── login/route.ts
│   │           │   └── refresh/route.ts
│   │           ├── super-admin/
│   │           │   ├── dashboard/route.ts
│   │           │   ├── analytics/route.ts
│   │           │   └── admins/route.ts
│   │           ├── admin/
│   │           │   ├── companies/
│   │           │   │   ├── route.ts     # GET list, POST create
│   │           │   │   └── [id]/route.ts# GET, PATCH, DELETE
│   │           │   ├── drives/
│   │           │   ├── students/
│   │           │   ├── placements/
│   │           │   ├── internships/
│   │           │   ├── consent-forms/
│   │           │   └── reports/
│   │           ├── student/
│   │           │   ├── profile/route.ts
│   │           │   ├── companies/route.ts
│   │           │   ├── applications/route.ts
│   │           │   └── consent-forms/route.ts
│   │           └── cron/
│   │               └── internship-alerts/route.ts
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── config.ts               # NextAuth config
│   │   │   └── rbac.ts                 # Role checks, permission map
│   │   ├── db/
│   │   │   └── prisma.ts               # Prisma singleton
│   │   ├── services/                   # Business logic layer
│   │   │   ├── company.service.ts
│   │   │   ├── student.service.ts
│   │   │   ├── drive.service.ts
│   │   │   ├── internship.service.ts
│   │   │   ├── consent.service.ts
│   │   │   └── report.service.ts
│   │   ├── validations/               # Zod schemas
│   │   │   ├── company.schema.ts
│   │   │   ├── student.schema.ts
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts      # JWT verification
│   │   │   ├── ratelimit.middleware.ts # Per-route rate limiting
│   │   │   └── audit.middleware.ts     # Activity logging
│   │   ├── google-drive/
│   │   │   └── drive.client.ts        # Google Drive API wrapper
│   │   ├── email/
│   │   │   └── mailer.ts              # Nodemailer wrapper
│   │   └── utils/
│   │       ├── api-response.ts        # Standardized API responses
│   │       ├── errors.ts              # Custom error classes
│   │       └── excel.ts               # ExcelJS report builders
│   ├── components/
│   │   ├── ui/                        # Base design system components
│   │   ├── super-admin/
│   │   ├── admin/
│   │   ├── student/
│   │   └── shared/
│   └── types/
│       ├── api.types.ts
│       └── auth.types.ts
├── middleware.ts                       # Root Next.js middleware (auth guard)
├── next.config.js                      # Security headers, CORS
└── .env.local
```

---

## 4. Database Schema

Full Prisma schema to paste into `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  SUPER_ADMIN
  ADMIN
  STUDENT
}

enum DriveStatus {
  UPCOMING
  ACTIVE
  COMPLETED
  CANCELLED
}

enum FunnelStage {
  REGISTERED
  SHORTLISTED
  INTERVIEWED
  OFFERED
  NOT_SELECTED
}

enum CompanyCategory {
  PRIME
  AVERAGE
  BELOW_AVERAGE
}

enum PlacementType {
  CAMPUS
  MANUAL
  PPO
}

enum InternshipOutcome {
  CONVERTED
  EXTENDED
  NOT_CONVERTED
  ONGOING
}

enum ConsentStatus {
  PENDING
  SIGNED
  DECLINED
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String   // bcrypt hashed
  role        Role
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  lastLoginAt DateTime?
  
  adminProfile   Admin?
  studentProfile Student?
  activityLogs   ActivityLog[]
  
  @@index([email])
  @@index([role])
}

model Admin {
  id          String  @id @default(cuid())
  userId      String  @unique
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  phone       String?
  department  String?
  createdBy   String  // Super Admin user ID
  
  drives           Drive[]
  consentForms     ConsentForm[]
  manualPlacements ManualPlacement[]
}

model Student {
  id             String  @id @default(cuid())
  userId         String  @unique
  user           User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  name           String
  rollNumber     String  @unique
  branch         String
  cgpa           Decimal @db.Decimal(4, 2)
  graduationYear Int
  phone          String?
  
  applications       DriveApplication[]
  internships        Internship[]
  consentSignatures  ConsentSignature[]
  placements         Placement[]
  
  @@index([branch])
  @@index([graduationYear])
  @@index([cgpa])
}

model Company {
  id           String          @id @default(cuid())
  name         String
  industry     String
  hrName       String
  hrEmail      String
  hrPhone      String?
  website      String?
  category     CompanyCategory
  description  String?
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  
  drives Drive[]
  
  @@index([category])
}

model Drive {
  id              String      @id @default(cuid())
  companyId       String
  company         Company     @relation(fields: [companyId], references: [id])
  adminId         String
  admin           Admin       @relation(fields: [adminId], references: [id])
  
  jobRole         String
  ctc             Decimal     @db.Decimal(10, 2)
  jobLocation     String
  eligibleBranches String[]   // array of branch names
  minCgpa         Decimal     @db.Decimal(4, 2)
  driveDate       DateTime
  applicationDeadline DateTime?
  status          DriveStatus @default(UPCOMING)
  
  academicYear    String      // e.g. "2025-2026"
  description     String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  applications DriveApplication[]
  consentForms ConsentForm[]
  
  @@index([status])
  @@index([academicYear])
  @@index([companyId])
}

model DriveApplication {
  id        String      @id @default(cuid())
  driveId   String
  drive     Drive       @relation(fields: [driveId], references: [id])
  studentId String
  student   Student     @relation(fields: [studentId], references: [id])
  stage     FunnelStage @default(REGISTERED)
  
  appliedAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  notes       String?
  
  // Offer details (filled when stage = OFFERED)
  offerLetterUrl  String?   // Google Drive file ID
  offerLetterName String?
  joiningDate     DateTime?
  
  placement Placement?
  
  @@unique([driveId, studentId])
  @@index([stage])
  @@index([studentId])
}

model Placement {
  id            String        @id @default(cuid())
  studentId     String
  student       Student       @relation(fields: [studentId], references: [id])
  type          PlacementType
  
  // For CAMPUS placements — linked to application
  applicationId String?       @unique
  application   DriveApplication? @relation(fields: [applicationId], references: [id])
  
  // Common fields
  company       String
  jobRole       String
  ctc           Decimal       @db.Decimal(10, 2)
  joiningDate   DateTime?
  academicYear  String
  
  // Manual placement extras
  referralSource String?
  
  createdAt DateTime @default(now())
  
  internship Internship?
  
  @@index([studentId])
  @@index([academicYear])
  @@index([type])
}

model Internship {
  id          String            @id @default(cuid())
  studentId   String
  student     Student           @relation(fields: [studentId], references: [id])
  placementId String            @unique
  placement   Placement         @relation(fields: [placementId], references: [id])
  
  startDate   DateTime
  durationMonths Int
  endDate     DateTime          // calculated: startDate + durationMonths
  
  outcome     InternshipOutcome @default(ONGOING)
  followUpNotes String?
  
  alertSent   Boolean @default(false)
  alertSentAt DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([endDate])
  @@index([outcome])
}

model ConsentForm {
  id          String    @id @default(cuid())
  adminId     String
  admin       Admin     @relation(fields: [adminId], references: [id])
  driveId     String?
  drive       Drive?    @relation(fields: [driveId], references: [id])
  
  title       String
  content     String    // Rich text / HTML content
  isGeneric   Boolean   @default(false)
  isActive    Boolean   @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  signatures ConsentSignature[]
  
  @@index([driveId])
  @@index([isActive])
}

model ConsentSignature {
  id            String        @id @default(cuid())
  consentFormId String
  consentForm   ConsentForm   @relation(fields: [consentFormId], references: [id])
  studentId     String
  student       Student       @relation(fields: [studentId], references: [id])
  
  status        ConsentStatus @default(PENDING)
  signatureData String?       // base64 canvas data or typed name
  signatureType String?       // "draw" | "typed"
  signedAt      DateTime?
  
  pdfUrl        String?       // Google Drive file ID of the saved PDF
  
  @@unique([consentFormId, studentId])
  @@index([status])
}

model ActivityLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String   // e.g. "CREATE_COMPANY", "UPDATE_FUNNEL_STAGE"
  resource  String   // e.g. "Company", "DriveApplication"
  resourceId String?
  metadata  Json?    // extra context
  ipAddress String?
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([createdAt])
}

model ManualPlacement {
  id           String   @id @default(cuid())
  adminId      String
  admin        Admin    @relation(fields: [adminId], references: [id])
  studentId    String
  company      String
  jobRole      String
  ctc          Decimal  @db.Decimal(10, 2)
  referralSource String
  joiningDate  DateTime?
  type         String   // "Intern" | "Full-time" | "PPO"
  academicYear String
  createdAt    DateTime @default(now())
  
  @@index([studentId])
  @@index([academicYear])
}
```

---

## 5. API Design

### Versioning Strategy
All routes under `/api/v1/`. When v2 is needed, create `/api/v2/` folder alongside — no breaking changes to existing clients.

### Standardized Response Format

```typescript
// src/lib/utils/api-response.ts
export const ApiResponse = {
  success: <T>(data: T, meta?: object) => ({
    success: true,
    data,
    meta: meta ?? null,
    timestamp: new Date().toISOString(),
  }),
  error: (code: string, message: string, details?: unknown) => ({
    success: false,
    error: { code, message, details: details ?? null },
    timestamp: new Date().toISOString(),
  }),
  paginated: <T>(data: T[], total: number, page: number, limit: number) => ({
    success: true,
    data,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    timestamp: new Date().toISOString(),
  }),
};
```

### Error Codes

```typescript
export const ErrorCodes = {
  UNAUTHORIZED:        'AUTH_001',
  FORBIDDEN:           'AUTH_002',
  TOKEN_EXPIRED:       'AUTH_003',
  VALIDATION_ERROR:    'VAL_001',
  NOT_FOUND:           'RES_001',
  CONFLICT:            'RES_002',
  RATE_LIMITED:        'RATE_001',
  INTERNAL_ERROR:      'SRV_001',
  DRIVE_UPLOAD_FAILED: 'DRIVE_001',
};
```

### Route Reference

```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh

GET    /api/v1/super-admin/dashboard
GET    /api/v1/super-admin/analytics?year=&branch=&month=
GET    /api/v1/super-admin/admins
POST   /api/v1/super-admin/admins
PATCH  /api/v1/super-admin/admins/[id]
DELETE /api/v1/super-admin/admins/[id]
GET    /api/v1/super-admin/admins/[id]/activity

GET    /api/v1/admin/dashboard
GET    /api/v1/admin/companies?page=&limit=&category=&status=
POST   /api/v1/admin/companies
GET    /api/v1/admin/companies/[id]
PATCH  /api/v1/admin/companies/[id]
DELETE /api/v1/admin/companies/[id]

GET    /api/v1/admin/drives
POST   /api/v1/admin/drives
GET    /api/v1/admin/drives/[id]
PATCH  /api/v1/admin/drives/[id]
POST   /api/v1/admin/drives/[id]/enroll           # enroll students
POST   /api/v1/admin/drives/[id]/bulk-enroll      # Excel upload
PATCH  /api/v1/admin/drives/[id]/applications/[appId] # move funnel stage

GET    /api/v1/admin/placements
POST   /api/v1/admin/placements/manual

GET    /api/v1/admin/internships
POST   /api/v1/admin/internships
PATCH  /api/v1/admin/internships/[id]

GET    /api/v1/admin/consent-forms
POST   /api/v1/admin/consent-forms
GET    /api/v1/admin/consent-forms/[id]
PATCH  /api/v1/admin/consent-forms/[id]
GET    /api/v1/admin/consent-forms/[id]/signatures

GET    /api/v1/admin/reports/branch-wise?year=&branch=
GET    /api/v1/admin/reports/company-wise?year=&company=
GET    /api/v1/admin/reports/monthly?month=&year=&branch=
GET    /api/v1/admin/reports/yearly?year=&branch=
GET    /api/v1/admin/reports/internship-conversion?year=&branch=
GET    /api/v1/admin/reports/manual-placements?year=&branch=

GET    /api/v1/student/profile
GET    /api/v1/student/dashboard
GET    /api/v1/student/companies?status=live|upcoming|past
GET    /api/v1/student/companies/[id]
POST   /api/v1/student/companies/[id]/register
GET    /api/v1/student/applications
GET    /api/v1/student/consent-forms
POST   /api/v1/student/consent-forms/[id]/sign
GET    /api/v1/student/consent-forms/[id]/download

POST   /api/v1/cron/internship-alerts  # Vercel Cron: daily at 9am
```

---

## 6. Authentication & RBAC

### JWT Configuration

```typescript
// src/lib/auth/config.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.isActive) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.password);
        if (!valid) return null;
        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) { token.role = user.role; token.id = user.id; }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.role = token.role;
      session.user.id = token.id;
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8 hours
  pages: { signIn: "/login" },
});
```

### RBAC Middleware (root `middleware.ts`)

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

const ROUTE_PERMISSIONS = {
  "/super-admin": ["SUPER_ADMIN"],
  "/admin": ["ADMIN"],
  "/student": ["STUDENT"],
  "/api/v1/super-admin": ["SUPER_ADMIN"],
  "/api/v1/admin": ["ADMIN"],
  "/api/v1/student": ["STUDENT"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  for (const [prefix, roles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(prefix)) {
      if (!session) return NextResponse.redirect(new URL("/login", req.url));
      if (!roles.includes(session.user.role)) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login).*)"],
};
```

---

## 7. Security Layers

### Layer 1: HTTP Security Headers (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",  // tighten after build
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://api.anthropic.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
```

### Layer 2: Rate Limiting

```typescript
// src/lib/middleware/ratelimit.middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";
import { ApiResponse, ErrorCodes } from "@/lib/utils/api-response";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Different limits for different route types
export const rateLimiters = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 login attempts / 15 min
    prefix: "rl:auth",
  }),
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 req/min per user
    prefix: "rl:api",
  }),
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 uploads/min
    prefix: "rl:upload",
  }),
};

export async function withRateLimit(
  req: NextRequest,
  limiterKey: keyof typeof rateLimiters,
  identifier?: string
) {
  const id = identifier ?? req.ip ?? "anonymous";
  const { success, remaining } = await rateLimiters[limiterKey].limit(id);
  
  if (!success) {
    return Response.json(
      ApiResponse.error(ErrorCodes.RATE_LIMITED, "Too many requests"),
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  return null; // null = not rate limited, continue
}
```

### Layer 3: Input Validation (Zod)

```typescript
// src/lib/validations/company.schema.ts
import { z } from "zod";

export const CreateCompanySchema = z.object({
  name:     z.string().min(1).max(200).trim(),
  industry: z.string().min(1).max(100).trim(),
  hrName:   z.string().min(1).max(100).trim(),
  hrEmail:  z.string().email().toLowerCase(),
  hrPhone:  z.string().regex(/^\+?[0-9\s\-()]{7,20}$/).optional(),
  website:  z.string().url().optional().or(z.literal("")),
  category: z.enum(["PRIME", "AVERAGE", "BELOW_AVERAGE"]),
  description: z.string().max(2000).optional(),
});

export const UpdateCompanySchema = CreateCompanySchema.partial();
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
```

### Layer 4: Route Wrapper Pattern

Use this pattern for every API route — it enforces auth, RBAC, rate limit, validation, and error handling in one place:

```typescript
// src/lib/utils/route-handler.ts
import { auth } from "@/lib/auth/config";
import { withRateLimit } from "@/lib/middleware/ratelimit.middleware";
import { logActivity } from "@/lib/middleware/audit.middleware";
import { ZodSchema } from "zod";
import { ApiResponse, ErrorCodes } from "./api-response";
import { NextRequest } from "next/server";

interface RouteConfig {
  roles: string[];
  rateLimit?: keyof typeof rateLimiters;
  bodySchema?: ZodSchema;
  querySchema?: ZodSchema;
  action?: string; // for audit log
}

export function createRoute(
  config: RouteConfig,
  handler: (req: NextRequest, ctx: { session: any; body?: any; query?: any }) => Promise<Response>
) {
  return async (req: NextRequest) => {
    try {
      // 1. Auth
      const session = await auth();
      if (!session) return Response.json(ApiResponse.error(ErrorCodes.UNAUTHORIZED, "Unauthorized"), { status: 401 });

      // 2. RBAC
      if (!config.roles.includes(session.user.role)) {
        return Response.json(ApiResponse.error(ErrorCodes.FORBIDDEN, "Forbidden"), { status: 403 });
      }

      // 3. Rate limit
      if (config.rateLimit) {
        const limited = await withRateLimit(req, config.rateLimit, session.user.id);
        if (limited) return limited;
      }

      // 4. Body validation
      let body;
      if (config.bodySchema && req.method !== "GET") {
        const raw = await req.json().catch(() => ({}));
        const result = config.bodySchema.safeParse(raw);
        if (!result.success) {
          return Response.json(
            ApiResponse.error(ErrorCodes.VALIDATION_ERROR, "Invalid input", result.error.flatten()),
            { status: 400 }
          );
        }
        body = result.data;
      }

      // 5. Query validation
      let query;
      if (config.querySchema) {
        const params = Object.fromEntries(req.nextUrl.searchParams);
        const result = config.querySchema.safeParse(params);
        if (!result.success) {
          return Response.json(
            ApiResponse.error(ErrorCodes.VALIDATION_ERROR, "Invalid query params", result.error.flatten()),
            { status: 400 }
          );
        }
        query = result.data;
      }

      // 6. Execute handler
      const response = await handler(req, { session, body, query });

      // 7. Audit log (non-blocking)
      if (config.action) {
        logActivity(session.user.id, config.action, req).catch(() => {});
      }

      return response;
    } catch (err) {
      console.error("[API Error]", err);
      return Response.json(ApiResponse.error(ErrorCodes.INTERNAL_ERROR, "Internal server error"), { status: 500 });
    }
  };
}
```

**Example route using the wrapper:**
```typescript
// src/app/api/v1/admin/companies/route.ts
import { createRoute } from "@/lib/utils/route-handler";
import { CreateCompanySchema } from "@/lib/validations/company.schema";
import { CompanyService } from "@/lib/services/company.service";
import { ApiResponse } from "@/lib/utils/api-response";

export const POST = createRoute(
  { roles: ["ADMIN"], rateLimit: "api", bodySchema: CreateCompanySchema, action: "CREATE_COMPANY" },
  async (req, { session, body }) => {
    const company = await CompanyService.create(body!, session.user.id);
    return Response.json(ApiResponse.success(company), { status: 201 });
  }
);
```

### Layer 5: Additional Security Measures

```typescript
// Password hashing (always 12+ rounds)
const hash = await bcrypt.hash(password, 12);

// File upload validation (before sending to Google Drive)
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Invalid file type");
if (file.size > MAX_SIZE) throw new Error("File too large");

// Prevent Mass Assignment: never spread req.body directly into Prisma
// BAD:  prisma.company.create({ data: body })
// GOOD: prisma.company.create({ data: { name: body.name, industry: body.industry, ... } })

// SQL injection: impossible with Prisma parameterized queries — never use prisma.$queryRaw with template strings
// BAD:  prisma.$queryRaw`SELECT * FROM users WHERE email = '${email}'`
// GOOD: prisma.user.findUnique({ where: { email } })

// XSS: sanitize any HTML stored to DB (consent form content)
import DOMPurify from "isomorphic-dompurify";
const sanitized = DOMPurify.sanitize(rawHtml);

// CSRF: handled automatically by NextAuth for state-changing routes
```

---

## 8. Google Drive Integration

### Setup

1. Go to Google Cloud Console → create a project → enable **Drive API**
2. Create a **Service Account** → download JSON key
3. Create a shared folder in Google Drive → share it with the service account email
4. Store the folder ID in `.env.local`

### Drive Client

```typescript
// src/lib/google-drive/drive.client.ts
import { google } from "googleapis";
import { Readable } from "stream";

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

const FOLDER_IDS = {
  offerLetters:       process.env.GDRIVE_OFFER_LETTERS_FOLDER!,
  consentForms:       process.env.GDRIVE_CONSENT_FORMS_FOLDER!,
};

export const DriveClient = {
  async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: keyof typeof FOLDER_IDS
  ): Promise<{ fileId: string; webViewLink: string }> {
    const stream = Readable.from(buffer);
    const res = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [FOLDER_IDS[folder]],
      },
      media: { mimeType, body: stream },
      fields: "id,webViewLink",
    });
    return { fileId: res.data.id!, webViewLink: res.data.webViewLink! };
  },

  async getDownloadUrl(fileId: string): Promise<string> {
    // Generate a short-lived signed URL (or use direct Drive link)
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  },

  async deleteFile(fileId: string): Promise<void> {
    await drive.files.delete({ fileId });
  },
};
```

---

## 9. UI Design System

### impeccable.style Direction

The aesthetic is **Refined Institutional** — clean, authoritative, and modern. Think Bloomberg Terminal meets Notion: dark neutral base with sharp accent colors, strong typographic hierarchy, and subtle depth.

### Design Tokens (`tailwind.config.ts`)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base
        surface:   { DEFAULT: "#0F1117", 50: "#1C1F2A", 100: "#252836", 200: "#2E3244" },
        border:    { DEFAULT: "#2A2D3A", strong: "#3D4155" },
        
        // Text
        ink:       { DEFAULT: "#F0F2F8", muted: "#8B90A7", subtle: "#5A5F78" },
        
        // Brand
        accent:    { DEFAULT: "#4F7CFF", hover: "#6B94FF", soft: "#1A2B5E" },
        
        // Status colors
        prime:     { DEFAULT: "#22D3A0", soft: "#0D3028" },
        average:   { DEFAULT: "#F59E0B", soft: "#2D2000" },
        below:     { DEFAULT: "#F43F5E", soft: "#2D0A12" },
        
        // Funnel stages
        stage: {
          registered:  "#6366F1",
          shortlisted: "#F59E0B",
          interviewed: "#3B82F6",
          offered:     "#22D3A0",
          rejected:    "#F43F5E",
        },
      },
      fontFamily: {
        display: ["'Cabinet Grotesk'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        card: "12px",
        pill: "9999px",
      },
      boxShadow: {
        card:  "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
        modal: "0 24px 48px rgba(0,0,0,0.6)",
        glow:  "0 0 20px rgba(79,124,255,0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
```

### Global CSS (`src/app/globals.css`)

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

/* Cabinet Grotesk from fontshare or similar */
@import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,600,700,800&display=swap');

/* Subtle grid background for dashboard pages */
.bg-grid {
  background-image: 
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* Card hover state */
.card-interactive {
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,124,255,0.2);
}
```

### Component Patterns to Implement

**Funnel Stage Badge:**
```tsx
const stageBadge = {
  REGISTERED:  { label: "Registered",  bg: "bg-[#6366F1]/15", text: "text-[#6366F1]", dot: "bg-[#6366F1]" },
  SHORTLISTED: { label: "Shortlisted", bg: "bg-[#F59E0B]/15", text: "text-[#F59E0B]", dot: "bg-[#F59E0B]" },
  INTERVIEWED: { label: "Interviewed", bg: "bg-[#3B82F6]/15", text: "text-[#3B82F6]", dot: "bg-[#3B82F6]" },
  OFFERED:     { label: "Offered",     bg: "bg-[#22D3A0]/15", text: "text-[#22D3A0]", dot: "bg-[#22D3A0]" },
  NOT_SELECTED:{ label: "Not Selected",bg: "bg-[#F43F5E]/15", text: "text-[#F43F5E]", dot: "bg-[#F43F5E]" },
};
```

**Drive Status Badge:**
```tsx
const driveStatus = {
  UPCOMING:  { label: "Upcoming",  color: "text-[#F59E0B] bg-[#F59E0B]/10" },
  ACTIVE:    { label: "Live 🔴",   color: "text-[#22D3A0] bg-[#22D3A0]/10 animate-pulse" },
  COMPLETED: { label: "Completed", color: "text-ink-muted bg-surface-50" },
  CANCELLED: { label: "Cancelled", color: "text-[#F43F5E] bg-[#F43F5E]/10" },
};
```

---

## 10. Day-by-Day Execution Plan

### Day 1 — Foundation (Auth + DB + Scaffold)

**Claude Code tasks:**
```bash
claude "Scaffold a Next.js 14 App Router project with TypeScript strict mode. 
Install: prisma, @prisma/client, next-auth@beta, bcryptjs, zod, @upstash/ratelimit, @upstash/redis, googleapis, nodemailer, exceljs, isomorphic-dompurify.
Create the full folder structure as specified in the plan.
Initialize Prisma with the complete schema provided."
```

**Deliverables:** Login pages (3 roles), JWT auth, role-based redirect after login, middleware.ts, all DB tables migrated, seed script with 1 super admin + 1 admin + 5 students.

---

### Day 2 — Company Module

**Claude Code:**
```bash
claude "Implement the full Company module:
- Zod schemas (CreateCompany, UpdateCompany)  
- company.service.ts (CRUD + pagination + filtering)
- All API routes under /api/v1/admin/companies using createRoute wrapper
- Admin UI: company list page, company form, company detail page with empty funnel
- Use the design system tokens from tailwind.config.ts"
```

**Account 2 review prompt:**
> "Review this company.service.ts. Check: N+1 query risks (are includes efficient?), missing indexes, edge cases in filters, pagination correctness."

---

### Day 3 — Student Tracking + Manual Placements

**Claude Code:**
```bash
claude "Implement drive enrollment and funnel management:
- DriveApplication CRUD in service layer
- Funnel stage movement API with validation (can only move forward, not backward arbitrarily)
- Offer letter upload to Google Drive via DriveClient
- Manual placement form and API
- Excel bulk enrollment: parse .xlsx, validate each row against student DB, enroll valid ones, return error report for invalid rows"
```

---

### Day 4 — Internship Tracker + Consent Forms

**Claude Code:**
```bash
claude "Implement internship tracker:
- Auto-calculate endDate on create (startDate + durationMonths)
- Cron route: /api/v1/cron/internship-alerts — query internships where endDate is within 7 days and alertSent=false, send email via Nodemailer, mark alertSent=true
- Vercel cron config in vercel.json

Implement consent form system:
- Admin: rich text editor form builder (use react-quill or tiptap), assign to drive or make generic
- Student: view form, sign via react-signature-canvas (draw mode) or typed name
- On sign: generate PDF (use jsPDF or puppeteer-html-to-pdf), upload to Google Drive, email copy to student, update ConsentSignature record"
```

**Account 3 security review:**
> "Review the consent form signing endpoint. Attack vectors to check: Can student A sign on behalf of student B? Can a student sign the same form twice? Is the signature data sanitized before PDF generation? Can a student access a form not assigned to them?"

---

### Day 5 — Super Admin Dashboard + Analytics

**Claude Code:**
```bash
claude "Build Super Admin portal:
- Dashboard: live drives (DriveStatus=ACTIVE), pipeline (UPCOMING), completed (COMPLETED)
- Branch-wise funnel: for a given drive, group DriveApplications by stage, filter by branch — efficient Prisma groupBy query
- Analytics: monthly/yearly stats using Prisma aggregations, not raw SQL
- Charts: Recharts — BarChart for placements over months, PieChart for placed/unplaced, LineChart for companies per month
- Admin account management CRUD"
```

---

### Day 6 — Student Portal + Reports

**Claude Code:**
```bash
claude "Build Student portal:
- Dashboard with live drives, upcoming drives, own applications, consent form count
- Company browser with Live/Upcoming/Past tabs
- Register interest (creates DriveApplication with stage=REGISTERED, pending admin approval)
- Consent form viewer and signer
- Profile page: read-only, offer letter downloads

Build all 6 Excel reports using ExcelJS:
- Each report function in src/lib/utils/excel.ts
- Styled headers, auto-column widths, number formatting for CTC
- Response as application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
```

---

### Day 7 — Testing + Security Hardening + Deploy

**Claude Code (morning):**
```bash
claude "Read all API routes and perform a complete security audit:
1. Every route uses createRoute wrapper (auth + RBAC + rate limit + validation)
2. No route leaks data from another role's data
3. File uploads validate type and size before Drive upload
4. No console.log statements with sensitive data
5. All environment variables accessed via process.env (not hardcoded)
6. Prisma queries never use $queryRaw with user input
7. HTML content is DOMPurify-sanitized before storage
List every issue found with file:line references."
```

**Account 3 (afternoon):**
> "Here are my complete API routes. Perform a privilege escalation test: can a STUDENT call any ADMIN or SUPER_ADMIN endpoint? Can an ADMIN call SUPER_ADMIN endpoints? Walk through each possible bypass."

**Deployment checklist:**
- [ ] All secrets in Vercel env vars (never in code)
- [ ] `DATABASE_URL` points to Supabase production connection string with `?pgbouncer=true&connection_limit=1`
- [ ] Vercel cron configured in `vercel.json`
- [ ] `NEXTAUTH_SECRET` is a 32+ character random string (`openssl rand -base64 32`)
- [ ] Google Service Account JSON stored as env var (JSON-stringified)
- [ ] Upstash Redis URL and token configured
- [ ] SMTP credentials configured
- [ ] Test all 3 role logins end-to-end on production

---

## 11. Deployment & CI/CD

### `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/v1/cron/internship-alerts",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Cron Route Security
```typescript
// Protect cron routes from external calls
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  // ... run internship alert logic
}
```

### `.env.local` (template — never commit)
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GDRIVE_OFFER_LETTERS_FOLDER=<folder-id>
GDRIVE_CONSENT_FORMS_FOLDER=<folder-id>

UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=<gmail app password>

CRON_SECRET=<random string>
```

---

## 12. Prompt Templates

### For Claude Code — Daily Opening
```
Context: Placement ERP (Next.js 14 App Router, TypeScript strict, Prisma + PostgreSQL, NextAuth v5, Zod validation, createRoute wrapper pattern).

Today is Day [X]. Completed modules: [list].

Current task: [describe feature].

Key constraints:
- All API routes must use the createRoute wrapper from src/lib/utils/route-handler.ts
- Zod schemas go in src/lib/validations/
- Business logic goes in src/lib/services/ (no Prisma in route files)
- UI uses tokens from tailwind.config.ts (surface, accent, ink, prime, average, below colors)
- Follow the Google Drive upload pattern from src/lib/google-drive/drive.client.ts

Please implement [feature].
```

### For Claude.ai Account 2 — Backend Review
```
Project: Placement ERP. Stack: Next.js 14 App Router, Prisma, PostgreSQL.

Review this [service/schema/route] for:
- Correctness of business logic
- N+1 query risks (check .include() chains)  
- Missing database indexes
- Edge cases and error handling gaps
- Any Prisma anti-patterns

[Paste code]
```

### For Claude.ai Account 3 — Security Review
```
Project: Placement ERP. Roles: SUPER_ADMIN > ADMIN > STUDENT.

Security audit this [route/middleware/feature]:
- Can a lower-privileged role access this?
- Are there IDOR (Insecure Direct Object Reference) vulnerabilities? 
  (e.g. can student A access student B's data by changing an ID?)
- Is user input validated before use in queries?
- Are file uploads validated for type and size?
- Can this endpoint be abused (rate limit bypass, mass assignment)?

[Paste code]
```

### For Claude.ai Account 1 — UI Review
```
Project: Placement ERP. Design direction: Refined Institutional (dark theme).
Design tokens: surface (#0F1117), accent (#4F7CFF), ink (#F0F2F8), fonts: Cabinet Grotesk (display) + DM Sans (body).

Review this component for:
- Visual hierarchy: is the most important info most prominent?
- Spacing consistency (use 4/8/16/24/32px grid)
- Interactive states: hover, focus, loading, empty state
- Any impeccable.style improvements

[Paste component code]
```

---

*This plan gives you everything needed to build in 7 days with maximal AI leverage. Follow the collaboration loop daily and use the prompt templates to maintain context across all three tools.*
@AGENTS.md

# Placement ERP — Project Reference

**Stack:** Next.js 14 (App Router) · TypeScript strict · PostgreSQL · Prisma · NextAuth v5 · Zod · Tailwind CSS · Google Drive API

---

## Module Completion

| # | Module | Status | Progress |
|---|--------|--------|----------|
| 1 | Foundation — Auth, DB schema, middleware, seed | Not started | 0% |
| 2 | Company Module — CRUD, pagination, filters | Not started | 0% |
| 3 | Drive & Enrollment — funnel, offer letters, bulk enroll | Not started | 0% |
| 4 | Internship Tracker + Consent Forms | Not started | 0% |
| 5 | Super Admin Dashboard + Analytics | Not started | 0% |
| 6 | Student Portal + Excel Reports | Not started | 0% |
| 7 | Security Hardening + Tests + Deploy | Not started | 0% |

**Overall: 0% complete**

---

## Architecture Rules (enforce always)

- All API routes live under `src/app/api/v1/` — never break this versioning.
- Every API route **must** use the `createRoute` wrapper from `src/lib/utils/route-handler.ts`. No naked route handlers.
- No Prisma calls in route files — business logic goes in `src/lib/services/`.
- Zod schemas go in `src/lib/validations/` — one file per domain.
- UI tokens come from `tailwind.config.ts` — use `surface`, `accent`, `ink`, `prime`, `average`, `below` color names.
- Never spread `req.body` directly into Prisma — always destructure named fields.
- Never use `prisma.$queryRaw` with template literals containing user input.
- Sanitize HTML consent form content with `isomorphic-dompurify` before storing.

---

## Source Layout

```
src/
├── app/
│   ├── (auth)/                    # login page, auth layout
│   ├── (dashboard)/
│   │   ├── super-admin/           # SUPER_ADMIN pages
│   │   ├── admin/                 # ADMIN pages
│   │   └── student/               # STUDENT pages
│   └── api/v1/
│       ├── auth/                  # login, logout, refresh
│       ├── super-admin/           # dashboard, analytics, admin CRUD
│       ├── admin/                 # companies, drives, placements, internships, consent-forms, reports
│       ├── student/               # profile, companies, applications, consent-forms
│       └── cron/                  # internship-alerts (Vercel Cron, daily 9am)
├── lib/
│   ├── auth/         config.ts · rbac.ts
│   ├── db/           prisma.ts (singleton)
│   ├── services/     company · student · drive · internship · consent · report
│   ├── validations/  auth · company · student · drive · internship · consent · placement
│   ├── middleware/   auth · ratelimit · audit
│   ├── google-drive/ drive.client.ts
│   ├── email/        mailer.ts
│   └── utils/        api-response · errors · excel · route-handler
├── components/
│   ├── ui/           base design system
│   ├── super-admin/
│   ├── admin/
│   ├── student/
│   └── shared/
└── types/            api.types · auth.types
```

Root: `middleware.ts` · `vercel.json` · `.env.local`
Prisma: `prisma/schema.prisma` · `prisma/migrations/`

---

## Key Patterns

**Route wrapper (every POST/GET/PATCH/DELETE):**
```ts
export const POST = createRoute(
  { roles: ["ADMIN"], rateLimit: "api", bodySchema: CreateXSchema, action: "CREATE_X" },
  async (req, { session, body }) => { ... }
);
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
UPSTASH_REDIS_URL
UPSTASH_REDIS_TOKEN
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
CRON_SECRET
```

---

## Design Tokens (Tailwind)

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

---
name: placement-erp-backend
description: >
  Full-stack backend engineering skill for the Placement ERP system built on
  Next.js 14 App Router API routes, Prisma ORM, PostgreSQL, and Google Drive.
  Invoke whenever implementing or reviewing any API route, service function,
  database query, middleware, caching strategy, pagination, compression,
  rate limiting, security measure, or edge-case handler for this project.
  Always load this skill when the user asks about: adding a new API endpoint,
  fixing a backend bug, improving query performance, handling errors, adding
  indexes, implementing cron jobs, or reviewing any file under src/app/api/,
  src/lib/services/, src/lib/middleware/, or prisma/.
triggers:
  - API route
  - service layer
  - Prisma query
  - database migration
  - rate limiting
  - caching
  - pagination
  - compression
  - edge case
  - audit log
  - Google Drive upload
  - cron job
  - internship alert
  - consent form
  - funnel stage
  - placement report
  - Excel export
  - backend security
  - input validation
  - Zod schema
role: senior-backend-engineer
scope: implementation
output-format: typescript
related-skills:
  - frontend-directive
  - placement-erp-master-plan
version: "1.0.0"
---

# Placement ERP — Backend Engineering Skill

**Stack:** Next.js 14 App Router · TypeScript Strict · Prisma · PostgreSQL · Upstash Redis · Google Drive API · Nodemailer · ExcelJS

> Account 2: Backend specialist. This skill owns every decision between the HTTP boundary and the database. The frontend directive owns everything above the HTTP boundary.

---

## Core Principles

1. **Service layer owns logic. Routes own nothing.** API routes call services; services call Prisma. Zero business logic in route files.
2. **Validate at the boundary.** Zod schemas run before any service is called. Invalid input never reaches the DB.
3. **Fail loudly in dev, fail gracefully in prod.** Detailed errors in development; standardised `ApiResponse.error()` in production.
4. **Every query is a potential N+1.** Audit every `.include()` chain. If you're loading relations in a loop, you have a bug.
5. **Indexes before queries.** If a field appears in a `WHERE`, `ORDER BY`, or `JOIN`, it must be indexed.

---

## Workflow

When implementing a new feature, always follow this order:

```
1. Schema  →  2. Migration  →  3. Zod schema  →  4. Service  →  5. Route  →  6. Index audit
```

Never write a route before the service. Never write a service before the schema. Never skip the index audit.

### Step 1 — Schema
Check `prisma/schema.prisma`. Add fields, new models, and relations. Add `@@index()` for every field that will be filtered or sorted.

### Step 2 — Migration
```bash
npx prisma migrate dev --name <descriptive-name>
npx prisma generate
```
Confirm the migration file makes sense before proceeding.

### Step 3 — Zod Schema
Write in `src/lib/validations/<module>.schema.ts`. Export both the schema and the inferred type. Keep schemas strict — no `.passthrough()`.

### Step 4 — Service
Write in `src/lib/services/<module>.service.ts`. All Prisma calls live here. Return typed objects, never raw Prisma results if the shape differs from what the route needs.

### Step 5 — Route
Write in `src/app/api/v1/<role>/<resource>/route.ts`. Use the `createRoute()` wrapper. No try/catch — the wrapper handles it. No Prisma — call the service.

### Step 6 — Index Audit
Run `EXPLAIN ANALYZE` on the generated queries (check Prisma query logs in dev). If a sequential scan appears on a large table, add an index.

---

## Route Wrapper Contract

Every route MUST use `createRoute()`. This enforces the full security stack in one call. Read `src/lib/utils/route-handler.ts` before writing any route.

```typescript
// Minimum viable route
export const GET = createRoute(
  { roles: ["ADMIN"], rateLimit: "api" },
  async (req, { session }) => {
    const result = await SomeService.getAll(session.user.id);
    return Response.json(ApiResponse.success(result));
  }
);

// Route with body validation
export const POST = createRoute(
  { roles: ["ADMIN"], rateLimit: "api", bodySchema: CreateSchema, action: "CREATE_RESOURCE" },
  async (req, { session, body }) => {
    const result = await SomeService.create(body!, session.user.id);
    return Response.json(ApiResponse.success(result), { status: 201 });
  }
);

// Route with query validation + pagination
export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api", querySchema: ListQuerySchema },
  async (req, { session, query }) => {
    const result = await SomeService.list(query!);
    return Response.json(ApiResponse.paginated(result.items, result.total, query!.page, query!.limit));
  }
);
```

---

## Reference Files

Load these when implementing the relevant domain. **Do not load all at once** — only load what the current task requires.

| File | Load When |
|------|-----------|
| `references/service-patterns.md` | Writing any service function: CRUD, pagination, filtering, aggregation |
| `references/edge-cases.md` | Completing a feature — before marking it done, audit against this list |
| `references/optimization.md` | Query is slow / adding caching / implementing compression / building reports |
| `references/security.md` | Auth middleware, file uploads, RBAC checks, audit logs, cron protection |

---

## Module Ownership Map

| Module | Service File | Route Prefix | Edge Case File Section |
|--------|-------------|--------------|----------------------|
| Auth | `auth.service.ts` | `/api/v1/auth/` | §1 Auth |
| Super Admin | `super-admin.service.ts` | `/api/v1/super-admin/` | §2 Super Admin |
| Companies | `company.service.ts` | `/api/v1/admin/companies/` | §3 Companies |
| Drives & Funnel | `drive.service.ts` | `/api/v1/admin/drives/` | §4 Drives |
| Students | `student.service.ts` | `/api/v1/admin/students/` | §5 Students |
| Placements | `placement.service.ts` | `/api/v1/admin/placements/` | §6 Placements |
| Internships | `internship.service.ts` | `/api/v1/admin/internships/` | §7 Internships |
| Consent Forms | `consent.service.ts` | `/api/v1/admin/consent-forms/` | §8 Consent |
| Reports | `report.service.ts` | `/api/v1/admin/reports/` | §9 Reports |
| Cron | `cron.service.ts` | `/api/v1/cron/` | §7 Internships |
| Student Portal | delegates to above | `/api/v1/student/` | §10 Student Portal |

---

## Constraints

### MUST DO
- Every public route uses `createRoute()` — no exceptions
- Every service function has an explicit TypeScript return type
- Every `findMany()` that could return >100 rows uses `take` + `skip` + `orderBy`
- Every relation load audited for N+1 before shipping
- Every `@@index()` added alongside the field that needs it
- Zod `safeParse()` — never `parse()` in routes (throws unhandled)
- `bcrypt` with minimum 12 rounds for any password operation
- Activity log written for every CREATE / UPDATE / DELETE action
- AbortController / cleanup for every async operation that could be cancelled
- `EXPLAIN ANALYZE` run on any query touching >1000 rows

### MUST NOT DO
- Business logic in route files
- Raw SQL with user input (use Prisma parameterised queries only)
- `prisma.$queryRaw` with template literals containing user data
- Returning full DB objects when only subset of fields is needed (use `select`)
- `console.log` with user data in any environment
- Storing passwords in plain text or with <12 bcrypt rounds
- Skipping rate limit on auth routes
- Cron routes without `CRON_SECRET` header verification
- File uploads without MIME type + size validation

---

## Standard Pagination Query Schema

Reuse this for all list endpoints:

```typescript
// src/lib/validations/shared.schema.ts
export const PaginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort:  z.string().optional(),
  dir:   z.enum(["asc", "desc"]).default("desc"),
});

export const SearchSchema = PaginationSchema.extend({
  q: z.string().max(200).optional(),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
```

---

## Standard Response Shapes

Always use `ApiResponse` from `src/lib/utils/api-response.ts`. Never construct response JSON manually.

```typescript
// Success
Response.json(ApiResponse.success(data))                        // 200
Response.json(ApiResponse.success(data), { status: 201 })      // 201 Created
Response.json(ApiResponse.paginated(items, total, page, limit)) // 200 + pagination meta

// Errors (inside createRoute handler — route wrapper catches thrown errors)
// For domain errors that need specific codes:
return Response.json(
  ApiResponse.error(ErrorCodes.CONFLICT, "Student already registered for this drive"),
  { status: 409 }
);
```

---

## Compression

Apply HTTP response compression globally in `next.config.js`:

```javascript
const nextConfig = {
  compress: true,  // Next.js built-in gzip/brotli — enabled by default on Vercel
  // For self-hosted: ensure your reverse proxy (nginx/caddy) handles compression
};
```

For large report responses (Excel, JSON analytics):
- Excel: stream directly to response with correct `Content-Type`, do not buffer in memory
- JSON analytics: compress at service layer for cached results using `zlib.gzip` before storing in Redis
- Apply `Cache-Control: no-store` on all personalised routes; `Cache-Control: public, max-age=300` only on truly public, non-sensitive data

---

## When You're Stuck

If a query feels wrong, read `references/service-patterns.md §Prisma Query Patterns`.
If a feature feels incomplete, read `references/edge-cases.md §<module>`.
If a query is slow, read `references/optimization.md`.
If auth feels uncertain, read `references/security.md`.

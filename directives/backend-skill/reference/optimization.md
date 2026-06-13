# Optimization Reference
*Load this when a query is slow, when implementing caching, or when building reports.*

## Table of Contents
1. [Database Indexes](#1-database-indexes)
2. [Query Optimization Checklist](#2-query-optimization-checklist)
3. [Redis Caching](#3-redis-caching)
4. [Response Compression](#4-response-compression)
5. [Excel Report Streaming](#5-excel-report-streaming)
6. [Connection Pooling](#6-connection-pooling)
7. [Rate Limiting Config](#7-rate-limiting-config)
8. [HTTP Cache Headers](#8-http-cache-headers)

---

## 1. Database Indexes

### Complete Index Strategy for the Placement ERP Schema

Add these to `prisma/schema.prisma`. The comments explain the query that requires each index.

```prisma
model User {
  @@index([email])       // Auth: findUnique on login
  @@index([role])        // RBAC: filtering admins/students
  @@index([isActive])    // Middleware: checking account status
}

model Student {
  @@index([branch])              // Reports: GROUP BY branch
  @@index([graduationYear])      // Filtering by batch
  @@index([cgpa])                // Drive enrollment eligibility check
  @@index([rollNumber])          // Bulk import: upsert on rollNumber
  @@index([branch, cgpa])        // Composite: eligibility filter (branch IN [...] AND cgpa >= X)
  @@index([graduationYear, branch]) // Report: batch + branch cross-filter
}

model Company {
  @@index([category])            // Filter: company list by category
  @@index([deletedAt])           // Soft delete: WHERE deletedAt IS NULL
  @@index([category, deletedAt]) // Composite: filtered list + soft delete
}

model Drive {
  @@index([status])              // Dashboard: WHERE status = 'ACTIVE'
  @@index([academicYear])        // Reports: filter by year
  @@index([companyId])           // JOIN: drives per company
  @@index([driveDate])           // Sorting: ORDER BY driveDate
  @@index([status, academicYear]) // Composite: dashboard + year filter
  @@index([adminId])             // Activity: drives created by admin
}

model DriveApplication {
  @@index([stage])               // Funnel: GROUP BY stage
  @@index([studentId])           // Student portal: my applications
  @@index([driveId])             // Drive detail: all applications for a drive
  @@index([driveId, stage])      // Funnel with drive context
  @@index([driveId, studentId])  // Already unique, but explicit index helps planner
  @@unique([driveId, studentId]) // Prevents duplicate enrollment
}

model Placement {
  @@index([studentId])           // Student profile: all placements
  @@index([academicYear])        // Reports: yearly summaries
  @@index([type])                // Report: CAMPUS vs MANUAL vs PPO
  @@index([academicYear, type])  // Report cross-filter
}

model Internship {
  @@index([endDate])             // Cron: WHERE endDate BETWEEN X AND Y
  @@index([outcome])             // Report: conversion rates
  @@index([alertSent])           // Cron: WHERE alertSent = false
  @@index([endDate, alertSent])  // Composite: cron query (the hot path)
}

model ConsentForm {
  @@index([driveId])             // Drive-specific forms lookup
  @@index([isActive])            // Student portal: only active forms
  @@index([isActive, driveId])   // Composite: active forms for a drive
}

model ConsentSignature {
  @@index([status])              // Admin: pending signatures list
  @@index([studentId])           // Student portal: my signatures
  @@index([consentFormId])       // Admin: all signatures for a form
  @@unique([consentFormId, studentId])
}

model ActivityLog {
  @@index([userId])              // Admin activity view
  @@index([createdAt])           // Time-range queries
  @@index([resource, resourceId]) // "All actions on Company X"
  @@index([userId, createdAt])   // Composite: activity by user over time
}
```

### Running EXPLAIN ANALYZE in Development

```typescript
// Enable Prisma query logging in development:
// prisma/prisma.ts
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development"
    ? [{ emit: "event", level: "query" }]
    : [],
});

prisma.$on("query", (e) => {
  console.log("[Prisma]", e.query, "→", e.duration + "ms");
});

// Then in PostgreSQL directly:
// EXPLAIN ANALYZE SELECT * FROM "DriveApplication" WHERE "driveId" = '...' AND "stage" = 'SHORTLISTED';
// Look for "Seq Scan" on large tables — that's a missing index.
// "Index Scan" = good.
```

---

## 2. Query Optimization Checklist

Before shipping any service function that hits a large table:

```
□ Does the WHERE clause use indexed fields only?
□ Is there a composite index for multi-field WHERE clauses?
□ Does findMany() have a take limit? (Never return unbounded results)
□ Are relations loaded with include in the same query (not in a loop)?
□ Is select used to fetch only needed fields?
□ Does the query use orderBy on an indexed field?
□ For aggregation: is groupBy used instead of fetching all rows and aggregating in JS?
□ For count: is count() used instead of findMany().length?
□ For existence check: is findFirst({ select: { id: true } }) used instead of findUnique() with full select?
```

### Anti-Patterns to Eliminate

```typescript
// ❌ Unbounded findMany
await prisma.driveApplication.findMany({ where: { driveId } });
// ✅ Always paginate or limit
await prisma.driveApplication.findMany({ where: { driveId }, take: 100, skip: offset });

// ❌ Counting by fetching all records
const count = (await prisma.student.findMany()).length;
// ✅ Use count()
const count = await prisma.student.count();

// ❌ JS-level aggregation
const total = students.reduce((sum, s) => sum + s.ctc, 0);
// ✅ DB-level aggregation
const { _sum } = await prisma.placement.aggregate({ _sum: { ctc: true }, where });

// ❌ Sorting after fetching
const sorted = students.sort((a, b) => b.cgpa - a.cgpa);
// ✅ Sort in DB
await prisma.student.findMany({ orderBy: { cgpa: "desc" } });
```

---

## 3. Redis Caching

### Cache Client Setup

```typescript
// src/lib/cache/redis.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Generic cache wrapper
export async function withCache<T>(
  key:     string,
  ttlSecs: number,
  fn:      () => Promise<T>
): Promise<T> {
  const cached = await redis.get<T>(key).catch(() => null);
  if (cached !== null) return cached;

  const fresh = await fn();
  await redis.setex(key, ttlSecs, JSON.stringify(fresh)).catch(() => {}); // non-blocking, best-effort
  return fresh;
}

// Cache invalidation
export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
}
```

### What to Cache and TTLs

| Data Type | Cache Key Pattern | TTL | Invalidate On |
|-----------|------------------|-----|--------------|
| Branch-wise summary | `report:branch:{year}:{branch}` | 5 min | Any placement created/updated |
| Monthly analytics | `report:monthly:{year}:{month}` | 5 min | Any drive/placement change |
| Yearly consolidated | `report:yearly:{year}` | 10 min | Any placement change |
| Company list (no filters) | `companies:list:p{page}:l{limit}` | 2 min | Company create/update/delete |
| Drive dashboard counts | `dashboard:admin:{adminId}` | 60 sec | Drive status change |
| User `isActive` check | `user:active:{userId}` | 60 sec | Admin deactivates account |
| Eligible students for drive | `drive:eligible:{driveId}` | 5 min | Student CGPA/branch update |

```typescript
// Usage in report.service.ts
async function getBranchWiseSummary(year: string, branch?: string): Promise<BranchSummary[]> {
  const cacheKey = `report:branch:${year}:${branch ?? "all"}`;
  return withCache(cacheKey, 300, async () => {
    // expensive DB query
    return prisma.$queryRaw`...`;
  });
}

// Invalidate on placement create (in placement.service.ts after creating):
await invalidateCache(`report:*`); // broad invalidation on write
await invalidateCache(`dashboard:admin:${adminId}`);
```

### Session-Level Caching (User Active Status)

```typescript
// src/lib/middleware/auth.middleware.ts
// Cache user isActive status to avoid DB hit on every request

export async function isUserActive(userId: string): Promise<boolean> {
  const cacheKey = `user:active:${userId}`;
  const cached = await redis.get<boolean>(cacheKey).catch(() => null);
  if (cached !== null) return cached;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true },
  });

  const active = user?.isActive ?? false;
  await redis.setex(cacheKey, 60, active).catch(() => {}); // 60-second TTL
  return active;
}
```

---

## 4. Response Compression

### Next.js Built-in (Vercel)

```javascript
// next.config.js
const nextConfig = {
  compress: true, // Vercel applies gzip/brotli automatically — this enables it for self-hosted
};
```

### Manual Compression for Large Payloads

For analytics responses >50KB that are cached in Redis:

```typescript
import { gzip, gunzip } from "zlib";
import { promisify } from "util";

const gzipAsync   = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// Compress before storing in Redis
const compressed = await gzipAsync(JSON.stringify(largeResult));
await redis.setex(cacheKey, 300, compressed.toString("base64"));

// Decompress on read
const stored = await redis.get<string>(cacheKey);
if (stored) {
  const decompressed = await gunzipAsync(Buffer.from(stored, "base64"));
  return JSON.parse(decompressed.toString());
}
```

### Cache-Control Headers Per Route Type

```typescript
// src/lib/utils/route-handler.ts — set headers in createRoute()

// Admin/Student data routes: never cache (personalised)
headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }

// Static reference data (industry list, branch list): short public cache
headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" }

// Report downloads: no cache (large + personalised)
headers: { "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="report.xlsx"` }

// Cron routes: no cache, private
headers: { "Cache-Control": "no-store, private" }
```

---

## 5. Excel Report Streaming

For reports with >1000 rows, never buffer the entire dataset in memory. Use ExcelJS streaming.

```typescript
// src/lib/utils/excel.ts

import ExcelJS from "exceljs";
import { PassThrough } from "stream";

export async function generateBranchWiseExcel(
  data: BranchSummaryRow[]
): Promise<Buffer> {
  const workbook   = new ExcelJS.Workbook();
  const worksheet  = workbook.addWorksheet("Branch-wise Summary");

  // Styled headers
  worksheet.columns = [
    { header: "Branch",          key: "branch",       width: 20 },
    { header: "Total Students",  key: "total",        width: 15, style: { numFmt: "#,##0" } },
    { header: "Registered",      key: "registered",   width: 15, style: { numFmt: "#,##0" } },
    { header: "Placed",          key: "placed",       width: 15, style: { numFmt: "#,##0" } },
    { header: "Unplaced",        key: "unplaced",     width: 15, style: { numFmt: "#,##0" } },
    { header: "Placement %",     key: "pct",          width: 15, style: { numFmt: "0.00%" } },
    { header: "Avg CTC (LPA)",   key: "avgCtc",       width: 15, style: { numFmt: "#,##0.00" } },
    { header: "Median CTC (LPA)",key: "medianCtc",    width: 16, style: { numFmt: "#,##0.00" } },
  ];

  // Header row styling
  worksheet.getRow(1).eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A2B5E" } };
    cell.alignment = { horizontal: "center" };
  });

  // Add data in batches — avoid blocking event loop
  for (let i = 0; i < data.length; i += 500) {
    const batch = data.slice(i, i + 500);
    batch.forEach((row) => {
      const excelRow = worksheet.addRow({
        branch:    row.branch,
        total:     row.total,
        registered:row.registered,
        placed:    row.placed,
        unplaced:  row.total - row.placed,
        pct:       row.total > 0 ? row.placed / row.total : 0, // store as decimal for numFmt
        avgCtc:    row.avgCtc,
        medianCtc: row.medianCtc,
      });
      // Alternate row background
      if (i % 2 === 0) {
        excelRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
        });
      }
    });
    // Yield to event loop between batches
    await new Promise((r) => setImmediate(r));
  }

  // Summary tab
  const summary = workbook.addWorksheet("Summary");
  summary.addRow(["Total Placed", data.reduce((s, r) => s + r.placed, 0)]);
  summary.addRow(["Overall Placement %",
    data.reduce((s, r) => s + r.total, 0) > 0
      ? data.reduce((s, r) => s + r.placed, 0) / data.reduce((s, r) => s + r.total, 0)
      : 0
  ]);

  // Return buffer
  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}

// In the route handler: stream directly to response
export const GET = createRoute(
  { roles: ["ADMIN"], rateLimit: "api" },
  async (req, { session, query }) => {
    const data   = await ReportService.getBranchWise(query!.year, query!.branch);
    const buffer = await generateBranchWiseExcel(data);

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="branch-report-${query!.year}.xlsx"`,
        "Content-Length":   String(buffer.byteLength),
        "Cache-Control":    "no-store",
      },
    });
  }
);
```

---

## 6. Connection Pooling

Prisma on serverless (Vercel) requires connection pooling to avoid exhausting PostgreSQL connections.

```typescript
// src/lib/db/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // Prevent multiple instances during hot-reload in dev
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") globalThis.__prisma = prisma;
```

```env
# .env — Supabase connection string with pgBouncer for serverless
DATABASE_URL="postgresql://user:pass@db.project.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
# Note: connection_limit=1 is correct for serverless — each function invocation gets one connection
# pgBouncer handles pooling at the Supabase level
```

---

## 7. Rate Limiting Config

```typescript
// src/lib/middleware/ratelimit.middleware.ts

// Per-limiter config (already defined in master plan — this adds the internship alert context)
export const rateLimiters = {
  auth:        Ratelimit.slidingWindow(5,   "15 m"), // 5 attempts/15min — brute force protection
  api:         Ratelimit.slidingWindow(100, "1 m"),  // 100 req/min/user — standard API
  upload:      Ratelimit.slidingWindow(10,  "1 m"),  // 10 uploads/min — file abuse protection
  report:      Ratelimit.slidingWindow(5,   "1 m"),  // 5 report downloads/min — heavy queries
  superAdmin:  Ratelimit.slidingWindow(200, "1 m"),  // Higher limit for dashboard polling
  cron:        Ratelimit.slidingWindow(1,   "1 m"),  // Cron should fire at most once/minute
};

// Apply per route type in createRoute() config:
// auth routes:    rateLimit: "auth"
// upload routes:  rateLimit: "upload"
// report routes:  rateLimit: "report"
// all others:     rateLimit: "api"
```

---

## 8. HTTP Cache Headers

```typescript
// Helpers to set cache headers consistently

export const CacheHeaders = {
  noStore: {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma":        "no-cache",
  },
  // For static reference lists (branches, industry sectors)
  shortPublic: {
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
  },
  // For file downloads
  download: (filename: string) => ({
    "Cache-Control":        "no-store",
    "Content-Disposition":  `attachment; filename="${encodeURIComponent(filename)}"`,
    "X-Content-Type-Options": "nosniff",
  }),
};

// Apply in route:
return new Response(data, {
  headers: { ...CacheHeaders.noStore, "Content-Type": "application/json" },
});
```

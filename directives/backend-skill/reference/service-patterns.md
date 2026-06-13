# Service Patterns Reference
*Load this when writing any service function.*

## Table of Contents
1. [Service File Anatomy](#1-service-file-anatomy)
2. [Prisma Query Patterns](#2-prisma-query-patterns)
3. [Pagination Pattern](#3-pagination-pattern)
4. [Filtering Pattern](#4-filtering-pattern)
5. [Aggregation Pattern](#5-aggregation-pattern)
6. [Transaction Pattern](#6-transaction-pattern)
7. [Soft Delete Pattern](#7-soft-delete-pattern)
8. [Activity Log Pattern](#8-activity-log-pattern)
9. [Module-by-Module Service Reference](#9-module-by-module-service-reference)

---

## 1. Service File Anatomy

```typescript
// src/lib/services/company.service.ts

import { prisma } from "@/lib/db/prisma";
import { ActivityLogger } from "@/lib/middleware/audit.middleware";
import type { CreateCompanyInput, UpdateCompanyInput } from "@/lib/validations/company.schema";
import type { Company, Prisma } from "@prisma/client";

// ── TYPES ──────────────────────────────────────────────────────────────
// Define return shapes explicitly. Never return a raw Prisma model
// when you only need a subset of fields.
export type CompanyListItem = Pick<Company, "id" | "name" | "category" | "industry"> & {
  _count: { drives: number };
};

export type CompanyDetail = Company & {
  drives: Array<{
    id: string;
    jobRole: string;
    status: string;
    driveDate: Date;
    _count: { applications: number };
  }>;
};

// ── SERVICE ────────────────────────────────────────────────────────────
export const CompanyService = {

  async list(params: {
    page: number;
    limit: number;
    category?: string;
    q?: string;
    sort?: string;
    dir?: "asc" | "desc";
  }): Promise<{ items: CompanyListItem[]; total: number }> {
    // See §3 Pagination Pattern and §4 Filtering Pattern
  },

  async getById(id: string): Promise<CompanyDetail | null> {
    // See §2 Prisma Query Patterns — relation loading
  },

  async create(data: CreateCompanyInput, actorId: string): Promise<Company> {
    // See §8 Activity Log Pattern
  },

  async update(id: string, data: UpdateCompanyInput, actorId: string): Promise<Company> {
    // See §8 Activity Log Pattern
  },

  async delete(id: string, actorId: string): Promise<void> {
    // See §7 Soft Delete Pattern
  },
};
```

---

## 2. Prisma Query Patterns

### Selecting Only Required Fields (Always)

```typescript
// ❌ BAD: Returns all 20 fields including sensitive ones
const companies = await prisma.company.findMany();

// ✅ GOOD: Select only what the client needs
const companies = await prisma.company.findMany({
  select: {
    id:       true,
    name:     true,
    category: true,
    industry: true,
    _count:   { select: { drives: true } },
  },
});
```

### Loading Relations (N+1 Prevention)

```typescript
// ❌ BAD: N+1 — loads drives in a loop
const companies = await prisma.company.findMany();
for (const company of companies) {
  company.drives = await prisma.drive.findMany({ where: { companyId: company.id } });
}

// ✅ GOOD: Single query with include
const companies = await prisma.company.findMany({
  include: {
    drives: {
      select: { id: true, status: true, driveDate: true, _count: { select: { applications: true } } },
      orderBy: { driveDate: "desc" },
      take: 5, // Limit nested relations — don't load all drives for a list view
    },
  },
});
```

### Conditional Includes

```typescript
// Only include drives when fetching detail, not list
async function getCompany(id: string, detail = false) {
  return prisma.company.findUnique({
    where: { id },
    include: detail
      ? { drives: { select: { id: true, status: true, jobRole: true } } }
      : undefined,
  });
}
```

### Cursor-Based Pagination (large datasets)

```typescript
// Use for: student lists (potentially thousands), activity logs
async function getStudentsCursor(cursor?: string, limit = 20) {
  const items = await prisma.student.findMany({
    take: limit + 1, // Fetch one extra to detect hasMore
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, rollNumber: true, branch: true, cgpa: true },
  });

  const hasMore = items.length > limit;
  return {
    items: hasMore ? items.slice(0, -1) : items,
    nextCursor: hasMore ? items[items.length - 2].id : null,
  };
}
```

---

## 3. Pagination Pattern

All list endpoints use this exact pattern. Offset pagination for admin lists; cursor pagination for large student/log datasets.

```typescript
// Offset pagination — reusable helper
export async function paginatedQuery<T>(
  countQuery: () => Promise<number>,
  dataQuery:  (skip: number, take: number) => Promise<T[]>,
  page: number,
  limit: number
): Promise<{ items: T[]; total: number; page: number; pages: number }> {
  const [total, items] = await prisma.$transaction([
    countQuery() as any,  // run count and data in same transaction
    dataQuery((page - 1) * limit, limit) as any,
  ]);

  return {
    items:  items as T[],
    total:  total as number,
    page,
    pages:  Math.ceil((total as number) / limit),
  };
}

// Usage in CompanyService.list():
async list(params) {
  const where = buildCompanyWhere(params); // see §4

  return paginatedQuery(
    () => prisma.company.count({ where }),
    (skip, take) => prisma.company.findMany({
      where,
      skip,
      take,
      orderBy: buildOrderBy(params.sort, params.dir),
      select: { id: true, name: true, category: true, industry: true, _count: { select: { drives: true } } },
    }),
    params.page,
    params.limit
  );
}
```

---

## 4. Filtering Pattern

Build `where` objects dynamically — never use string interpolation.

```typescript
// src/lib/services/company.service.ts

function buildCompanyWhere(params: CompanyListParams): Prisma.CompanyWhereInput {
  const where: Prisma.CompanyWhereInput = {};

  // Text search — case-insensitive
  if (params.q?.trim()) {
    where.OR = [
      { name:     { contains: params.q, mode: "insensitive" } },
      { industry: { contains: params.q, mode: "insensitive" } },
      { hrName:   { contains: params.q, mode: "insensitive" } },
    ];
  }

  // Enum filter — only apply if value is valid
  if (params.category && ["PRIME", "AVERAGE", "BELOW_AVERAGE"].includes(params.category)) {
    where.category = params.category as CompanyCategory;
  }

  // Soft-deleted exclusion (always)
  where.deletedAt = null;

  return where;
}

function buildOrderBy(
  sort = "createdAt",
  dir:  "asc" | "desc" = "desc"
): Prisma.CompanyOrderByWithRelationInput {
  // Whitelist sortable fields — never trust raw input as a field name
  const ALLOWED_SORT_FIELDS: Record<string, keyof Prisma.CompanyOrderByWithRelationInput> = {
    name:      "name",
    category:  "category",
    createdAt: "createdAt",
  };
  const field = ALLOWED_SORT_FIELDS[sort] ?? "createdAt";
  return { [field]: dir };
}
```

---

## 5. Aggregation Pattern

Used by analytics routes (Super Admin dashboard, monthly/yearly reports).

```typescript
// Branch-wise placement summary
async function getBranchWiseSummary(academicYear: string) {
  const [placed, total] = await prisma.$transaction([
    // Placed students per branch
    prisma.placement.groupBy({
      by:     ["student"],  // requires join — use raw aggregation instead
      where:  { academicYear },
      _count: { _all: true },
    }),
    // Use Prisma.$queryRaw for complex GROUP BY with joins — ALWAYS use tagged template
    prisma.$queryRaw<Array<{ branch: string; total: number; placed: number }>>`
      SELECT
        s.branch,
        COUNT(DISTINCT s.id)::int AS total,
        COUNT(DISTINCT p.id)::int AS placed
      FROM "Student" s
      LEFT JOIN "Placement" p ON p."studentId" = s.id AND p."academicYear" = ${academicYear}
      GROUP BY s.branch
      ORDER BY s.branch
    `,
  ]);

  return total; // raw query returns the aggregated shape
}

// Monthly drive counts — pure Prisma groupBy
async function getMonthlyDriveCounts(year: number) {
  return prisma.drive.groupBy({
    by:     ["status"],
    where:  {
      driveDate: {
        gte: new Date(`${year}-01-01`),
        lt:  new Date(`${year + 1}-01-01`),
      },
    },
    _count: { _all: true },
  });
}
```

---

## 6. Transaction Pattern

Use transactions for any multi-table write. If one step fails, everything rolls back.

```typescript
// Placing a student: update application, create Placement, optionally create Internship
async function markStudentPlaced(
  applicationId: string,
  offerData: PlaceStudentInput,
  actorId: string
) {
  return prisma.$transaction(async (tx) => {
    // Step 1: Verify the application exists and belongs to correct drive
    const application = await tx.driveApplication.findUnique({
      where: { id: applicationId },
      select: { id: true, studentId: true, driveId: true, stage: true },
    });
    if (!application) throw new NotFoundError("Application not found");
    if (application.stage === "OFFERED") throw new ConflictError("Already marked as offered");

    // Step 2: Update funnel stage
    await tx.driveApplication.update({
      where: { id: applicationId },
      data:  { stage: "OFFERED", offerLetterUrl: offerData.offerLetterUrl, joiningDate: offerData.joiningDate },
    });

    // Step 3: Create Placement record
    const placement = await tx.placement.create({
      data: {
        studentId:    application.studentId,
        type:         "CAMPUS",
        applicationId,
        company:      offerData.company,
        jobRole:      offerData.jobRole,
        ctc:          offerData.ctc,
        joiningDate:  offerData.joiningDate,
        academicYear: offerData.academicYear,
      },
    });

    // Step 4: Create Internship record if type is internship
    if (offerData.isInternship) {
      const endDate = addMonths(offerData.joiningDate, offerData.durationMonths);
      await tx.internship.create({
        data: {
          studentId:      application.studentId,
          placementId:    placement.id,
          startDate:      offerData.joiningDate,
          durationMonths: offerData.durationMonths,
          endDate,
          outcome:        "ONGOING",
        },
      });
    }

    // Step 5: Audit log (inside transaction so it rolls back with everything else)
    await tx.activityLog.create({
      data: { userId: actorId, action: "MARK_PLACED", resource: "DriveApplication", resourceId: applicationId },
    });

    return placement;
  });
}
```

---

## 7. Soft Delete Pattern

Never hard-delete records that affect reports or audit history. Add `deletedAt DateTime?` to the schema.

```typescript
// Schema addition:
// model Company {
//   ...
//   deletedAt DateTime?
//   @@index([deletedAt])
// }

// Service: soft delete
async function deleteCompany(id: string, actorId: string) {
  const existing = await prisma.company.findUnique({
    where: { id, deletedAt: null }, // can't delete already-deleted
    select: { id: true, _count: { select: { drives: true } } },
  });
  if (!existing) throw new NotFoundError("Company not found");
  if (existing._count.drives > 0) throw new ConflictError(
    "Cannot delete company with existing drives. Archive it instead."
  );

  await prisma.$transaction([
    prisma.company.update({ where: { id }, data: { deletedAt: new Date() } }),
    prisma.activityLog.create({ data: { userId: actorId, action: "DELETE_COMPANY", resource: "Company", resourceId: id } }),
  ]);
}

// All queries MUST exclude soft-deleted records:
// where: { deletedAt: null }  ← required in every findMany/findUnique for soft-deleted entities
```

---

## 8. Activity Log Pattern

Every CREATE / UPDATE / DELETE action writes to `ActivityLog`. This is non-negotiable.

```typescript
// src/lib/middleware/audit.middleware.ts
import { prisma } from "@/lib/db/prisma";

export async function logActivity(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string
) {
  // Non-blocking — fire and forget from routes, but INSIDE transactions from services
  return prisma.activityLog.create({
    data: { userId, action, resource, resourceId, metadata, ipAddress },
  });
}

// From a route handler (non-blocking):
// logActivity(session.user.id, "CREATE_COMPANY", "Company", company.id).catch(() => {});

// From inside a $transaction (blocking, rolls back on error):
// await tx.activityLog.create({ data: { ... } });
```

---

## 9. Module-by-Module Service Reference

### Auth Service
```typescript
// login: find user → check isActive → bcrypt.compare → update lastLoginAt → return safe user object
// Never return the password field. Use: select: { id, email, role, isActive }
// On failed login: don't reveal whether email exists. Return same error for "not found" and "wrong password".
```

### Drive Service
```typescript
// createDrive: validate eligibleBranches is non-empty array, minCgpa ≥ 0 ≤ 10
// enrollStudents(driveId, studentIds): batch-insert DriveApplications with REGISTERED stage
//   — Use createMany with skipDuplicates: true to handle re-enrollment gracefully
// bulkEnrollFromExcel(driveId, fileBuffer): parse XLSX → validate each row → batch insert
//   — Return { enrolled: number, skipped: string[], errors: Array<{row, reason}> }
// moveFunnelStage(applicationId, newStage, actorId):
//   — Validate stage transition is forward (REGISTERED→SHORTLISTED→INTERVIEWED→OFFERED, no skipping)
//   — Write audit log with both old and new stage in metadata
```

### Student Service (Admin side)
```typescript
// getStudentWithApplications: include applications with drives+company in single query
// bulkImport(fileBuffer): parse XLSX → upsert on rollNumber (update if exists, create if not)
//   — Return { created, updated, skipped, errors }
// getEligibleStudents(driveId): filter by branch (in eligibleBranches) AND cgpa ≥ minCgpa
//   — Exclude students already enrolled: NOT IN (SELECT studentId FROM DriveApplication WHERE driveId = ?)
```

### Report Service
```typescript
// All report functions receive (academicYear: string, branch?: string)
// Return typed arrays — never return raw Prisma objects to the route
// Cache computed reports in Redis for 5 minutes (see optimization.md §Redis Caching)
// Excel generation: use ExcelJS streaming writer for >1000 row reports
```

### Internship Service
```typescript
// create: calculate endDate = addMonths(startDate, durationMonths) using date-fns
// updateOutcome: CONVERTED | EXTENDED | NOT_CONVERTED — write activity log
// getExpiringInternships(): WHERE endDate BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND alertSent = false
//   — Called by cron job, returns internships with student+company eager-loaded
// markAlertSent(ids: string[]): batch update alertSent = true, alertSentAt = NOW()
```

### Consent Service
```typescript
// signForm(formId, studentId, signatureData, type):
//   — Verify student hasn't already signed (unique constraint)
//   — Sanitize signatureData if typed (DOMPurify server-side)
//   — Generate PDF (puppeteer or jsPDF server-side)
//   — Upload PDF to Google Drive (see security.md §Google Drive)
//   — Update ConsentSignature with pdfUrl, signedAt
//   — Send confirmation email (non-blocking)
//   — All in a $transaction except the email send (which is outside, after commit)
```

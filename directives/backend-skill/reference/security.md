# Security Reference
*Load this when writing auth middleware, RBAC checks, file upload handlers, cron routes, or when reviewing any security-sensitive code.*

## Table of Contents
1. [Authentication Security](#1-authentication-security)
2. [RBAC Implementation](#2-rbac-implementation)
3. [Input Validation Security](#3-input-validation-security)
4. [File Upload Security](#4-file-upload-security)
5. [Google Drive Security](#5-google-drive-security)
6. [IDOR Prevention (Insecure Direct Object Reference)](#6-idor-prevention)
7. [Rate Limiting as Security](#7-rate-limiting-as-security)
8. [Cron Route Protection](#8-cron-route-protection)
9. [Audit Trail Requirements](#9-audit-trail-requirements)
10. [Environment & Secret Management](#10-environment--secret-management)
11. [Attack Surface Checklist](#11-attack-surface-checklist)

---

## 1. Authentication Security

### Password Handling

```typescript
import bcrypt from "bcryptjs";

// ALWAYS 12 rounds minimum
const BCRYPT_ROUNDS = 12;

// Hashing (on user creation or password reset)
export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < 8)  throw new Error("Password must be at least 8 characters");
  if (plain.length > 128) throw new Error("Password too long");
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

// Comparison (on login)
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
  // NEVER: plain === hash, md5(plain) === hash, sha1(plain) === hash
}
```

### Login Security Rules

```typescript
// src/lib/services/auth.service.ts

async function login(email: string, password: string) {
  // 1. Normalise email — lowercase, trim
  const normalised = email.toLowerCase().trim();

  // 2. Find user — ALWAYS fetch, even if not found
  const user = await prisma.user.findUnique({
    where: { email: normalised },
    select: { id: true, email: true, password: true, role: true, isActive: true },
  });

  // 3. ALWAYS run bcrypt.compare even if user is null
  //    This prevents timing attacks that reveal email existence
  const dummyHash = "$2b$12$dummyhashvaluethatisrealisticallylong.andpreventstimingatk";
  const passwordMatch = await bcrypt.compare(password, user?.password ?? dummyHash);

  // 4. Generic error — never reveal if email exists or password is wrong
  if (!user || !passwordMatch) {
    throw new AuthError("Invalid credentials"); // Same error for both cases
  }

  // 5. Check active status AFTER password check (timing-safe)
  if (!user.isActive) {
    throw new AuthError("Account is deactivated. Contact administrator.");
  }

  // 6. Update lastLoginAt (non-blocking)
  prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});

  return { id: user.id, email: user.email, role: user.role };
}
```

### JWT Configuration

```typescript
// NextAuth JWT strategy — configured in src/lib/auth/config.ts
// Key decisions:
// - maxAge: 8 hours (8 * 60 * 60) — short session for institutional systems
// - secret: NEXTAUTH_SECRET — min 32 chars random string (openssl rand -base64 32)
// - httpOnly cookie: NextAuth handles this automatically with JWT strategy
// - HTTPS only: enforce via NEXTAUTH_URL starting with https:// in production
// - Rotate secret: if NEXTAUTH_SECRET is ever exposed, rotate it and all sessions are invalidated
```

---

## 2. RBAC Implementation

### Permission Matrix

| Action | STUDENT | ADMIN | SUPER_ADMIN |
|--------|---------|-------|-------------|
| View own profile | ✅ | - | - |
| View own applications | ✅ | - | - |
| Register for drive | ✅ | - | - |
| Sign consent form | ✅ | - | - |
| Manage companies | ❌ | ✅ | ❌ (read-only) |
| Manage drives | ❌ | ✅ | ❌ (read-only) |
| Manage student records | ❌ | ✅ | ❌ (read-only) |
| Move funnel stages | ❌ | ✅ | ❌ (read-only) |
| Generate reports | ❌ | ✅ | ✅ |
| View analytics | ❌ | ✅ | ✅ |
| Create admin accounts | ❌ | ❌ | ✅ |
| Deactivate admin accounts | ❌ | ❌ | ✅ |
| View admin activity logs | ❌ | ❌ | ✅ |

### Role Check in createRoute()

```typescript
// src/lib/utils/route-handler.ts
// The roles array is enforced before any handler code runs

// Single role
{ roles: ["ADMIN"] }

// Multiple roles (union)
{ roles: ["ADMIN", "SUPER_ADMIN"] }

// All three (e.g., an endpoint where any authenticated user can access)
{ roles: ["STUDENT", "ADMIN", "SUPER_ADMIN"] }
```

### Cross-Role Data Access (SUPER_ADMIN read-only pattern)

```typescript
// For routes accessible by both ADMIN and SUPER_ADMIN,
// Super Admin should only see data, not modify it.
// Enforce at service layer, not just route layer:

async function getCompany(id: string, actorRole: string): Promise<CompanyDetail> {
  const company = await prisma.company.findUnique({ where: { id, deletedAt: null } });
  if (!company) throw new NotFoundError("Company not found");
  return company; // Read is fine for both roles
}

async function deleteCompany(id: string, actorRole: string, actorId: string): Promise<void> {
  // Super admin cannot delete — enforce here even though middleware allows the route
  if (actorRole === "SUPER_ADMIN") throw new ForbiddenError("Super Admin cannot delete records");
  // ... deletion logic
}
```

---

## 3. Input Validation Security

### Zod Schema Security Rules

```typescript
// All string inputs: trim + max length. Never accept unlimited strings.
z.string().trim().min(1).max(200)

// Email: normalize
z.string().email().toLowerCase().trim()

// Numbers: explicit bounds
z.number().int().min(0).max(10)     // CGPA
z.number().min(0)                   // CTC (allow 0 for stipends)
z.coerce.number().int().min(1).max(100) // Pagination limit

// Enums: always use z.enum() — never accept raw strings for categorical values
z.enum(["PRIME", "AVERAGE", "BELOW_AVERAGE"])

// Arrays: min/max length
z.array(z.string()).min(1).max(50)  // eligibleBranches

// Dates: coerce from string with validation
z.coerce.date().min(new Date("2000-01-01"))

// IDs (cuid format): validate format
z.string().cuid()

// File names: sanitize in service layer (not Zod — Zod handles the string, service sanitizes)
// Sanitize: /[^a-zA-Z0-9._-]/g replace with "_", max 200 chars

// NEVER: z.any(), z.unknown() in request validation schemas
// NEVER: .passthrough() on request bodies — only accept declared fields
```

### Mass Assignment Prevention

```typescript
// ❌ BAD: spread entire validated body into Prisma
const company = await prisma.company.create({ data: body });

// ✅ GOOD: explicit field mapping
const company = await prisma.company.create({
  data: {
    name:        body.name,
    industry:    body.industry,
    hrName:      body.hrName,
    hrEmail:     body.hrEmail,
    category:    body.category,
    // adminId is set from session, NOT from request body
    // createdAt is set by Prisma default, NOT from request body
  },
});
```

### SQL Injection Prevention

```typescript
// Prisma parameterised queries are injection-safe by default.
// The ONE exception: $queryRaw

// ❌ DANGEROUS: string interpolation in $queryRaw
prisma.$queryRaw(`SELECT * FROM "User" WHERE email = '${email}'`);

// ✅ SAFE: tagged template literal (Prisma escapes parameters)
prisma.$queryRaw`SELECT * FROM "User" WHERE email = ${email}`;

// ✅ ALSO SAFE: $queryRawUnsafe with explicit parameter array
prisma.$queryRawUnsafe('SELECT * FROM "User" WHERE email = $1', email);
// Note: $queryRawUnsafe name is misleading — it's safe when parameters are properly bound
```

---

## 4. File Upload Security

### Full Validation Pipeline

```typescript
// src/lib/utils/file-validator.ts

const MAGIC_BYTES: Record<string, number[]> = {
  "application/pdf":  [0x25, 0x50, 0x44, 0x46], // %PDF
  "image/jpeg":       [0xFF, 0xD8, 0xFF],
  "image/png":        [0x89, 0x50, 0x4E, 0x47],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                      [0x50, 0x4B, 0x03, 0x04], // PK (ZIP-based)
};

export async function validateUploadedFile(
  file:       File,
  allowedTypes: string[],
  maxMB:      number
): Promise<{ valid: boolean; error?: string }> {

  // 1. MIME type from Content-Type header (can be spoofed)
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(", ")}` };
  }

  // 2. File size
  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `File too large. Max ${maxMB}MB allowed.` };
  }

  // 3. Magic bytes (actual file signature — cannot be spoofed by renaming)
  const buffer   = await file.arrayBuffer();
  const bytes    = new Uint8Array(buffer.slice(0, 8));
  const expected = MAGIC_BYTES[file.type];

  if (expected && !expected.every((byte, i) => bytes[i] === byte)) {
    return { valid: false, error: "File content does not match declared type" };
  }

  // 4. Filename sanitization (return sanitized name)
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, "_") // no path traversal via ../
    .slice(0, 200);

  return { valid: true };
}
```

### Offer Letter Upload Route

```typescript
// POST /api/v1/admin/drives/[driveId]/applications/[appId]/offer-letter

export const POST = createRoute(
  { roles: ["ADMIN"], rateLimit: "upload" },
  async (req, { session }) => {
    const { driveId, appId } = req.nextUrl.pathname; // extract from segments

    // Validate ownership (IDOR prevention — see §6)
    const application = await prisma.driveApplication.findUnique({
      where: { id: appId, driveId },  // must match BOTH fields
      select: { id: true, studentId: true },
    });
    if (!application) return Response.json(ApiResponse.error("RES_001", "Not found"), { status: 404 });

    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    if (!file)     return Response.json(ApiResponse.error("VAL_001", "No file provided"), { status: 400 });

    const validation = await validateUploadedFile(file, ["application/pdf"], 10);
    if (!validation.valid) return Response.json(ApiResponse.error("VAL_001", validation.error!), { status: 400 });

    const buffer   = Buffer.from(await file.arrayBuffer());
    const fileName = `offer_${application.studentId}_${Date.now()}.pdf`;

    const { fileId } = await DriveClient.uploadFile(buffer, fileName, "application/pdf", "offerLetters");

    await prisma.driveApplication.update({
      where: { id: appId },
      data: { offerLetterUrl: fileId, offerLetterName: file.name },
    });

    return Response.json(ApiResponse.success({ fileId }), { status: 201 });
  }
);
```

---

## 5. Google Drive Security

```typescript
// src/lib/google-drive/drive.client.ts

// Service account credentials — never hardcode
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);

// Folder permissions: The service account should ONLY have write access
// to specific folders — not the entire Drive. Configure folder sharing
// with the service account email, not the entire Drive.

// Generate time-limited signed download URL
export async function getSignedDownloadUrl(fileId: string, expiryMinutes = 30): Promise<string> {
  // For Google Drive: use webViewLink with file metadata rather than
  // generating signed URLs (Drive doesn't support AWS-style signed URLs).
  // Instead: serve the file through our API (proxy the download).
  // This prevents sharing the Drive URL publicly.

  // Proxy download pattern:
  // 1. Frontend calls GET /api/v1/student/consent-forms/[id]/download
  // 2. Route validates ownership
  // 3. Route fetches file from Drive using service account
  // 4. Route streams file to client
  // Direct Drive link is NEVER exposed to the client.
  return `${process.env.NEXTAUTH_URL}/api/v1/files/${fileId}`;
}

// Proxy file download route
export const GET = createRoute(
  { roles: ["STUDENT", "ADMIN", "SUPER_ADMIN"], rateLimit: "api" },
  async (req, { session }) => {
    const fileId = req.nextUrl.searchParams.get("fileId");
    if (!fileId) return Response.json(ApiResponse.error("VAL_001", "Missing fileId"), { status: 400 });

    // Validate ownership (student can only download their own files)
    const ownership = await validateFileOwnership(fileId, session.user.id, session.user.role);
    if (!ownership.allowed) return Response.json(ApiResponse.error("AUTH_002", "Forbidden"), { status: 403 });

    // Stream from Drive
    const stream = await DriveClient.downloadFileStream(fileId);
    return new Response(stream, {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${ownership.fileName}"`,
        "Cache-Control":       "no-store, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
);
```

---

## 6. IDOR Prevention

Insecure Direct Object Reference — user accesses another user's resource by changing an ID in the URL.

### IDOR Check Pattern

```typescript
// Every route that accesses a specific resource MUST validate that the
// requesting user is authorised to access that specific resource.
// The route wrapper validates the ROLE, but the service must validate the OWNERSHIP.

// ❌ VULNERABLE: trusts the ID from URL without ownership check
async function getApplication(appId: string) {
  return prisma.driveApplication.findUnique({ where: { id: appId } });
  // A student can access any application by guessing IDs
}

// ✅ SAFE: ownership check embedded in query
async function getApplication(appId: string, requestingStudentId: string) {
  const application = await prisma.driveApplication.findUnique({
    where: {
      id: appId,
      studentId: requestingStudentId, // must belong to requesting student
    },
  });
  if (!application) throw new NotFoundError("Application not found");
  // Note: return NotFound, not Forbidden — don't confirm the ID exists
  return application;
}

// Admin checking drive ownership (admin can only manage their own drives in some setups):
async function getDrive(driveId: string, adminId: string) {
  const drive = await prisma.drive.findUnique({
    where: { id: driveId, adminId }, // admin must own the drive
  });
  if (!drive) throw new NotFoundError("Drive not found");
  return drive;
}
```

### IDOR Audit Checklist

Before shipping any endpoint that takes an `id` parameter:

```
□ For STUDENT routes: does the query include studentId: session.user.id ?
□ For ADMIN routes: does cross-drive access require driveId in the query?
□ For nested resources (driveId + appId): does the query validate BOTH IDs?
□ Error response for unauthorised access: 404 (not 403) — don't confirm the ID exists
□ File downloads: is the fileId validated against the requesting user's records?
□ Consent form PDF: is signatureId checked against the signing student?
```

---

## 7. Rate Limiting as Security

```typescript
// Auth brute force prevention
// 5 attempts per 15 minutes per IP — MUST be enforced before bcrypt.compare

export const POST = createRoute(
  { roles: ["PUBLIC"], rateLimit: "auth" }, // PUBLIC = no auth required
  async (req) => {
    // Rate limit fires before any DB query
    // After 5 failed attempts from the same IP:
    // → Returns 429 Too Many Requests with Retry-After header
    // → bcrypt.compare is NOT called (avoids CPU timing attacks at scale)
  }
);

// Protecting report generation endpoints
// 5 reports per minute per user — prevents DoS via expensive queries
{ rateLimit: "report" }

// Identifier strategy: prefer user ID (authenticated) over IP (unauthenticated)
// In auth routes (unauthenticated): rate limit by IP
// In authenticated routes: rate limit by session.user.id
// Why: IP-based limits can affect multiple users behind NAT; user-based is more precise

export async function applyRateLimit(req: NextRequest, session: Session | null, limiterKey: string) {
  const identifier = session?.user.id ?? req.ip ?? "anonymous";
  return rateLimiters[limiterKey].limit(identifier);
}
```

---

## 8. Cron Route Protection

```typescript
// /api/v1/cron/internship-alerts/route.ts

export async function POST(req: NextRequest) {
  // 1. Verify Vercel cron signature (Bearer token)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Log this — it's a security event (someone probing the cron endpoint)
    console.warn("[Security] Unauthorised cron attempt from:", req.ip);
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Redis lock to prevent concurrent runs
  const lockKey = "cron:internship-alerts:lock";
  const locked  = await redis.set(lockKey, "1", { nx: true, ex: 300 }); // 5 min lock
  if (!locked) {
    console.warn("[Cron] Previous run still in progress — skipping");
    return Response.json({ skipped: true, reason: "Previous run in progress" });
  }

  try {
    const result = await CronService.sendInternshipAlerts();
    return Response.json({ success: true, ...result });
  } finally {
    // Always release the lock
    await redis.del(lockKey);
  }
}
```

---

## 9. Audit Trail Requirements

Every CREATE, UPDATE, and DELETE action MUST be logged. No exceptions.

```typescript
// Required fields for every activity log entry:
{
  userId:     string,      // who did it
  action:     string,      // what: "CREATE_COMPANY", "MOVE_FUNNEL_STAGE", "DELETE_DRIVE"
  resource:   string,      // which model: "Company", "DriveApplication", "Drive"
  resourceId: string,      // ID of the affected record
  metadata:   {            // context-specific extra data
    // For funnel stage changes:
    oldStage: "REGISTERED",
    newStage: "SHORTLISTED",
    // For company category changes:
    oldCategory: "AVERAGE",
    newCategory: "PRIME",
    // For admin deactivation:
    targetAdminId: "...",
  },
  ipAddress: string,       // from req.ip (for security-sensitive actions)
}

// Action naming convention: VERB_NOUN_NOUN
// CREATE_COMPANY, UPDATE_COMPANY, DELETE_COMPANY
// MOVE_FUNNEL_STAGE, MARK_PLACED, UPLOAD_OFFER_LETTER
// CREATE_ADMIN, DEACTIVATE_ADMIN, RESET_PASSWORD
// SEND_INTERNSHIP_ALERT, SIGN_CONSENT_FORM, GENERATE_REPORT
```

---

## 10. Environment & Secret Management

```bash
# Required environment variables — all must be set before first deploy
# Verify with: node -e "require('./src/lib/utils/check-env.ts')"

REQUIRED_ENV = [
  "DATABASE_URL",           # Must include ?pgbouncer=true for serverless
  "NEXTAUTH_SECRET",        # min 32 chars: openssl rand -base64 32
  "NEXTAUTH_URL",           # Full URL including https://
  "GOOGLE_SERVICE_ACCOUNT_JSON", # JSON string of service account key
  "GDRIVE_OFFER_LETTERS_FOLDER",
  "GDRIVE_CONSENT_FORMS_FOLDER",
  "UPSTASH_REDIS_URL",
  "UPSTASH_REDIS_TOKEN",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "CRON_SECRET",            # min 32 chars: openssl rand -base64 32
]
```

```typescript
// src/lib/utils/check-env.ts — run at startup
export function assertRequiredEnv() {
  const REQUIRED = ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL", /* ... */];
  const missing  = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

// Call in src/app/layout.tsx (server component, runs on cold start):
// assertRequiredEnv();
```

### Secret Rotation Procedure

```
If NEXTAUTH_SECRET is compromised:
1. Generate new secret: openssl rand -base64 32
2. Update in Vercel env vars
3. Redeploy — all existing sessions are immediately invalidated
4. Users must log in again — communicate this to admins

If GOOGLE_SERVICE_ACCOUNT_JSON key is compromised:
1. In Google Cloud Console → IAM → Service Accounts → delete the compromised key
2. Generate a new key
3. Update GOOGLE_SERVICE_ACCOUNT_JSON in Vercel
4. Redeploy — new key takes effect immediately

If CRON_SECRET is compromised:
1. Generate new value: openssl rand -base64 32
2. Update in Vercel env vars AND in vercel.json cron config
3. Redeploy
```

---

## 11. Attack Surface Checklist

Run through this before every pull request that touches backend code.

### Authentication & Authorization
```
□ All routes use createRoute() — none bypass the wrapper
□ Role array in createRoute() is the minimum necessary (not ["STUDENT", "ADMIN", "SUPER_ADMIN"] by default)
□ Super admin routes correctly block ADMIN users
□ Student routes correctly block ADMIN and SUPER_ADMIN
□ Every resource access includes an ownership check (see §6 IDOR)
```

### Input Handling
```
□ All request bodies validated with Zod before service is called
□ No .passthrough() on Zod schemas (strips unknown fields)
□ String fields have max length limits
□ Enum fields use z.enum() not z.string()
□ File uploads validated: MIME type + magic bytes + size
□ Filenames sanitized before use
□ $queryRaw uses tagged template literals only (no string interpolation)
```

### Data Exposure
```
□ Password field never appears in any service return type
□ select is used to exclude sensitive fields in list queries
□ Activity logs do not include password values in metadata
□ Error responses do not include stack traces in production
□ Error responses do not confirm whether a user/email exists (auth routes)
```

### External Services
```
□ Google Drive files served through our API proxy (not direct Drive links)
□ Service account key not logged anywhere
□ SMTP credentials not logged
□ Cron route protected with CRON_SECRET header check
□ Redis connection string not logged
```

### Headers & Transport
```
□ Security headers set in next.config.js (X-Frame-Options, CSP, HSTS, etc.)
□ File download responses include X-Content-Type-Options: nosniff
□ File download responses include Content-Disposition: attachment
□ Personalised routes include Cache-Control: no-store
□ Auth cookie is httpOnly, secure, sameSite=lax (NextAuth default)
```

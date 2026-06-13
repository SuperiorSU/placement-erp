# Edge Case Reference
*Load this when completing any feature. Run through the relevant section before marking the task done.*

## Table of Contents
1. [Auth Edge Cases](#1-auth-edge-cases)
2. [Super Admin Edge Cases](#2-super-admin-edge-cases)
3. [Company Edge Cases](#3-company-edge-cases)
4. [Drive & Funnel Edge Cases](#4-drive--funnel-edge-cases)
5. [Student Edge Cases](#5-student-edge-cases)
6. [Placement Edge Cases](#6-placement-edge-cases)
7. [Internship Edge Cases](#7-internship-edge-cases)
8. [Consent Form Edge Cases](#8-consent-form-edge-cases)
9. [Report Edge Cases](#9-report-edge-cases)
10. [Student Portal Edge Cases](#10-student-portal-edge-cases)
11. [File Upload Edge Cases](#11-file-upload-edge-cases)
12. [Cron Job Edge Cases](#12-cron-job-edge-cases)

---

## 1. Auth Edge Cases

| Case | Handling |
|------|---------|
| Login with deactivated account | Check `isActive` before bcrypt.compare. Return `403 Account deactivated` — don't reveal bcrypt result. |
| Login with non-existent email | Same generic error as wrong password: `"Invalid credentials"`. Never reveal email existence. |
| Concurrent login from two devices | JWT is stateless — both sessions valid until expiry. This is acceptable for v1. |
| Token sent on deactivated account after login | Middleware checks `isActive` from DB on each request (cache for 60s in Redis to avoid DB hit per request). |
| Password reset race condition | If two reset links are generated, the older one should be invalidated. Implement with a `passwordResetToken` + `passwordResetExpiry` on the User model. Only the latest token is valid. |
| Admin creates admin with duplicate email | `prisma.user.create()` will throw P2002 (unique constraint). Catch and return `409 Email already in use`. |
| Super admin tries to delete their own account | Check `actorId !== targetId`. Return `400 Cannot delete own account`. |
| JWT expiry during long form submission | The API returns `401 TOKEN_EXPIRED`. The client must re-authenticate. Document this in error codes — the frontend directive handles the client-side redirect. |

---

## 2. Super Admin Edge Cases

| Case | Handling |
|------|---------|
| Dashboard with zero drives ever | All counts return `0`. Charts render empty state (no data, no crash). Service must handle `[]` from groupBy gracefully. |
| Analytics for future academic year | If `academicYear` param is in the future, all counts are 0. This is valid — return zeros, not an error. |
| Admin activity log is empty | Return `[]`, not 404. Activity log starts empty for new admins. |
| Super admin tries to edit company data | Route returns `403 FORBIDDEN`. Super admin is read-only on admin-created data. |
| Branch filter with invalid branch name | Zod validates branch against an enum or allows free string with max 50 chars. Unknown branch returns empty results, not an error. |

---

## 3. Company Edge Cases

| Case | Handling |
|------|---------|
| Duplicate company name | Allow duplicates (different drives, same company name is valid). Do NOT add a unique constraint on company name. |
| Deleting a company with active drives | Block deletion if `drives.some(d => d.status === "ACTIVE")`. Return `409 Cannot delete company with active drives`. |
| Deleting a company with completed drives | Soft delete only. Historical data must be preserved for reports. |
| Company category change affects existing drives | Category is on Company, not Drive. Changing it retroactively affects report categorisation. Warn admin via response message: `{ data: company, warning: "Category change affects historical reports" }`. |
| HR email update — does not notify HR | Updating HR email is a local operation only. The old email is not notified. Log the change in ActivityLog with `metadata: { oldEmail, newEmail }`. |
| Empty eligible branches array on update | Zod: `eligibleBranches: z.array(z.string()).min(1, "At least one branch required")`. |
| Drive date in the past on create | Allow it (admin may be entering historical data). Warn if driveDate < today but do not block. |
| CTC set to 0 | Allow 0 for stipend-only internships. Block negative values: `z.number().min(0)`. |

---

## 4. Drive & Funnel Edge Cases

| Case | Handling |
|------|---------|
| Enrolling student not meeting CGPA criteria | Validate: `student.cgpa >= drive.minCgpa`. Return `422 { studentId, reason: "CGPA below cutoff" }`. Admin can override with explicit `force: true` flag. |
| Enrolling student from ineligible branch | Same pattern — validate `drive.eligibleBranches.includes(student.branch)`. |
| Bulk enrollment where some students are already enrolled | Use `prisma.driveApplication.createMany({ skipDuplicates: true })`. Report in response: `{ enrolled: N, skipped: M }`. |
| Moving stage backward (OFFERED → SHORTLISTED) | Block by default. Allowed stages: REGISTERED→SHORTLISTED→INTERVIEWED→OFFERED or NOT_SELECTED from any stage. NOT_SELECTED is terminal — cannot move out of it. Validate: `!TERMINAL_STAGES.includes(currentStage)`. |
| Student already OFFERED from another company in same year | Allow — students can receive multiple offers. Do NOT block. Only one can convert to final Placement record (enforce via application-level logic, not DB constraint). |
| Drive status changes: UPCOMING → CANCELLED | If there are enrolled students, notify them via email (non-blocking, best-effort). Do not delete their DriveApplication records. Set stage to a special `DRIVE_CANCELLED` status or keep the last stage with a `cancellation` flag. |
| Offer letter upload for wrong student | Route: `PATCH /drives/:driveId/applications/:appId` — validate that `appId.driveId === driveId` to prevent cross-drive manipulation (IDOR check). |
| Drive date changed after students enrolled | Allow the update. Update `driveDate` only. Enrolled students are unaffected. Log the change. |
| Bulk Excel enrollment with invalid roll numbers | Parse all rows first, validate all rows, then insert none-or-all (transaction). Return a per-row error report: `[{ row: 3, rollNumber: "CS001X", error: "Student not found" }]`. |
| Excel file too large (>10MB) | Validate file size before parsing. Return `413 File too large. Max 10MB`. |

---

## 5. Student Edge Cases

| Case | Handling |
|------|---------|
| Roll number collision on bulk import | Use `upsert` on `rollNumber`: update if exists, create if not. Always report what happened per row. |
| Student CGPA > 10.0 | Zod: `z.number().min(0).max(10)`. Return `400 CGPA must be between 0 and 10`. |
| Student with no applications | `getStudentById` returns `applications: []`. Never 404 just because a student hasn't applied. |
| Deactivating a student with active applications | Soft-delete student (set `isActive = false`). Their existing applications remain. They cannot register for new drives. |
| Student email update — must be unique | If another student has the same email, return `409`. Reuse the user-level unique constraint. |
| Student profile shows offer letter they shouldn't access | Student can only download offer letters linked to their own `DriveApplication` records. Validate ownership in the service: `application.studentId === requestingStudentId`. |

---

## 6. Placement Edge Cases

| Case | Handling |
|------|---------|
| Manual placement for student already placed via campus drive | Allow — a student can have multiple Placement records. The report distinguishes by `type`. |
| CTC 0 for internship | Allow. Return warning in response if CTC is 0 and type is FULL_TIME. |
| Joining date in the past | Allow (recording historical placements). Warn if `joiningDate < today`. |
| Manual placement referral contact not in system | `referralSource` is a free-text field — no FK constraint. Store as string. |
| Deleting a placement | Never hard-delete. Soft-delete only. Placement records are part of report history. |
| PPO from internship that doesn't have an Internship record | Allow creating a PPO Placement without an Internship record (edge case: admin records PPO from off-campus internship). `type: "PPO"`, `applicationId: null`. |

---

## 7. Internship Edge Cases

| Case | Handling |
|------|---------|
| `durationMonths = 0` | Block: `z.number().int().min(1)`. Duration must be at least 1 month. |
| `endDate` calculated as past date on creation | Allow (recording historical internships). Set `alertSent: true` immediately — no point alerting for expired internships. |
| Internship end date extended | Admin updates `durationMonths`. Recalculate `endDate = addMonths(startDate, newDuration)`. Reset `alertSent: false` if new endDate > today + 7 days. |
| Alert already sent, then internship extended | Cron job checks `alertSent: false` — after extension reset, the cron will pick it up again on the next run. |
| Cron fires but email server is down | Catch the Nodemailer error. Do NOT mark `alertSent: true`. Log the failure. The cron will retry on the next day's run. Only mark `alertSent: true` after confirmed email delivery. |
| Multiple internships for same student | Allowed — a student can have sequential internships. No unique constraint on `studentId` in Internship table. |
| Internship outcome: EXTENDED | Update `endDate` to the new end date. Add `followUpNotes`. Keep `alertSent: false` if new endDate is >7 days away. |
| Conversion status where company ghosted | Outcome: `NOT_CONVERTED`. Admin logs in `followUpNotes`. No automated action. |

---

## 8. Consent Form Edge Cases

| Case | Handling |
|------|---------|
| Student signs form twice | The `@@unique([consentFormId, studentId])` constraint prevents it at DB level. Catch `P2002` and return `409 Already signed`. |
| Student declines a consent form | Status: `DECLINED`. Student can change from DECLINED to SIGNED by signing later. SIGNED is terminal — cannot go back to PENDING or DECLINED. |
| Admin edits form after students have already signed | Block edits to content if `signatures.some(s => s.status === "SIGNED")`. Allow only metadata changes (title, isActive). Return `409 Form has signed signatures — content cannot be edited`. |
| Admin deactivates form with pending signatures | Set `isActive: false`. Students with PENDING status see it disappear from their dashboard. Already-SIGNED records are unaffected. |
| Form content contains malicious script tags | Sanitize with `isomorphic-dompurify` on the SERVER before storing (not just on render). Use a strict allowlist: `["p","strong","em","ul","ol","li","h2","h3","a","br"]`. |
| PDF generation fails | The transaction should still commit the signature record. Set `pdfUrl: null` and queue a background retry for PDF generation. Notify admin of failure in-app. |
| Student downloads PDF they didn't sign | Service checks: `signature.studentId === requestingStudentId && signature.status === "SIGNED"`. Return `403` otherwise. |
| Generic form assigned to specific drive later | A form can be both generic (`isGeneric: true`) and drive-specific (`driveId: someId`). Generic forms are shown to all eligible students; drive-specific forms only to students enrolled in that drive. |

---

## 9. Report Edge Cases

| Case | Handling |
|------|---------|
| Report for academic year with zero data | Return empty arrays and zero counts — never 404. Excel export should still generate with headers only. |
| Branch filter returning zero students | Return `{ branch, total: 0, placed: 0, placement_pct: 0 }`. Do not omit the branch from the response. |
| Year-over-year comparison when previous year has no data | Return `{ currentYear: N, previousYear: 0, change: null }`. `null` means "no comparison data", not 0% change. |
| Excel export with >10,000 rows | Use ExcelJS streaming API: `worksheet.addRow()` in batches of 500. Never buffer the entire result set in memory. Stream directly to the response. |
| Concurrent report generation by multiple admins | Each request generates independently. For expensive reports, use Redis cache with 5-minute TTL keyed by `report_type:year:branch`. See `optimization.md §Redis Caching`. |
| Report includes both campus and manual placements | Reports always include both. Manual placements are tagged with `source: "MANUAL"` in Excel. Filters allow separating them. |
| Average CTC with outliers (e.g., one 1Cr offer) | Return both `averageCTC` and `medianCTC`. Median is more useful than mean for placement data. Use the `$queryRaw` PERCENTILE_CONT function for median. |

---

## 10. Student Portal Edge Cases

| Case | Handling |
|------|---------|
| Student registers for a drive they are ineligible for | Server validates CGPA and branch against drive criteria. Return `422 { reason: "Below CGPA cutoff" }`. Client-side "Register" button is hidden for ineligible drives (UX), but server validation is the source of truth. |
| Student registers twice for same drive | DB unique constraint `@@unique([driveId, studentId])` catches it. Return `409 Already registered`. |
| Student views a drive that was cancelled after they registered | Drive detail shows status CANCELLED. Student's application is preserved but they cannot take further action. |
| Student sees placement status before admin has updated funnel | They see their current stage. If no update: `stage: "REGISTERED"` with timestamp. |
| Student tries to download someone else's offer letter | URL contains `applicationId`. Service validates `application.studentId === session.user.id`. Return `403`. |
| Student account deactivated mid-session | Next API call hits auth middleware which checks `isActive` from Redis cache (60s TTL). Within 60s they may still get responses — acceptable for v1. |

---

## 11. File Upload Edge Cases

| Case | Handling |
|------|---------|
| Upload of non-PDF as offer letter | MIME validation: `["application/pdf"]` only for offer letters. Check both `file.type` AND magic bytes (first 4 bytes: `%PDF`). |
| Upload file size exceeds limit | Check `file.size > MAX_BYTES` before streaming to Google Drive. Return `413`. |
| Google Drive upload times out | Set a 30-second timeout on the Drive API call. Catch timeout error, return `502 File upload failed — please retry`. Do NOT leave a partial file on Drive. |
| Drive storage quota exceeded | Catch Google API error `storageQuotaExceeded`. Return `507 Storage quota exceeded — contact administrator`. Alert the admin via email (non-blocking). |
| Same file uploaded twice | No deduplication — each upload creates a new Drive file. Filenames include `${timestamp}_${originalName}` to prevent collision. |
| File with malicious filename | Sanitize filename before sending to Drive: strip non-alphanumeric except `.`, `-`, `_`. Max 200 chars. |
| Offer letter deleted from Drive externally | `pdfUrl` in DB becomes a dead link. The download route should catch `404` from Drive and return a descriptive error rather than crashing. |

---

## 12. Cron Job Edge Cases

| Case | Handling |
|------|---------|
| Cron fires while previous run is still in progress | Implement a Redis lock with 5-minute TTL: `SET cron:internship-alerts:lock 1 NX EX 300`. If lock exists, skip and log a warning. |
| Cron fires with no expiring internships | Fetch returns `[]`. Log `"Cron: 0 alerts to send"` and exit cleanly. No error. |
| Cron route called without `CRON_SECRET` | Return `401`. Log the attempt with the caller's IP. This is a security event. |
| Email sending partially fails (5 of 10 succeed) | Process internships one by one. Mark each `alertSent: true` only after that specific email succeeds. Failed ones will be retried on the next day's cron run. |
| Cron misses a day (Vercel downtime) | The `alertSent: false` flag means those internships will be picked up on the next successful run. Maximum alert delay: 24 hours + downtime. Acceptable for v1. |
| Internship end date is today (same day as cron) | `endDate <= TODAY + 7 days AND endDate >= TODAY` — include today in the window. Send the alert. |
| Cron generates duplicate alerts | The `alertSent: true` flag is the deduplication guard. Once set, the record is excluded from future cron runs. |

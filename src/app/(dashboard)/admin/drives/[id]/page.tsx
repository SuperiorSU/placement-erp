import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, MapPin, Building2, GraduationCap, Calendar,
  DollarSign, User, TrendingUp, Users,
} from "lucide-react";
import { DriveService } from "@/lib/services/drive.service";
import { Badge } from "@/components/ui/Badge";
import { DriveForm } from "../DriveForm";
import { DeleteDriveButton } from "./DeleteDriveButton";
import { DriveDetailClient } from "./DriveDetailClient";
import { DriveParticipantsTable } from "./DriveParticipantsTable";

interface PageProps {
  params:       Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}

function formatCTC(ctc: number): string {
  if (ctc >= 100000) return `₹${(ctc / 100000).toFixed(2)}L/yr`;
  return `₹${ctc.toLocaleString("en-IN")}/yr`;
}

function toDateStr(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default async function DriveDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);

  let drive;
  let summary;
  try {
    [drive, summary] = await Promise.all([
      DriveService.getById(id),
      DriveService.getDriveSummary(id),
    ]);
  } catch {
    notFound();
  }

  const enrolledCount = drive._count.applications;
  const canEnroll     = drive.status !== "COMPLETED" && drive.status !== "CANCELLED";

  // Server-fetch first page of participants with active filters
  const page   = Number(sp.page ?? 1);
  const limit  = 20;
  const { items: participants, total } = await DriveService.getParticipants(id, {
    page,
    limit,
    dir:     (sp.dir as "asc" | "desc") ?? "asc",
    branch:  sp.branch,
    stage:   sp.stage as Parameters<typeof DriveService.getParticipants>[1]["stage"],
    q:       sp.q,
    jobRole: sp.jobRole,
    minCtc:  sp.minCtc ? Number(sp.minCtc) : undefined,
    maxCtc:  sp.maxCtc ? Number(sp.maxCtc) : undefined,
  });

  const pages    = Math.max(1, Math.ceil(total / limit));
  const branches = drive.eligibleBranches;

  const offerRate = summary.stageCounts.REGISTERED > 0
    ? ((summary.stageCounts.OFFERED / summary.stageCounts.REGISTERED) * 100).toFixed(1)
    : "0.0";

  return (
    <>
      {/* Sticky breadcrumb header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin/drives"
              className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors duration-80 shrink-0"
              aria-label="Back to drives"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
              Drives
            </Link>
            <span className="text-border shrink-0">/</span>
            <h1 className="font-display text-xl font-bold text-ink truncate">{drive.jobRole}</h1>
            <Badge variant={drive.status} />
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            <DeleteDriveButton
              id={id}
              jobRole={drive.jobRole}
              enrolledCount={enrolledCount}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">

        {/* ── Summary stats strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { label: "Registered",   value: summary.stageCounts.REGISTERED,  icon: Users,     color: "text-ink" },
              { label: "Offered",      value: summary.stageCounts.OFFERED,      icon: TrendingUp, color: "text-prime" },
              { label: "Offer rate",   value: `${offerRate}%`,                  icon: TrendingUp, color: "text-accent" },
              { label: "Avg CTC offered", value: summary.avgCtcOffered !== null ? `${summary.avgCtcOffered.toFixed(2)} LPA` : "—", icon: DollarSign, color: "text-average" },
            ] as const
          ).map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-surface-50 border border-border rounded-card px-4 py-3" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${color}`} aria-hidden />
                <p className="text-xs text-ink-muted">{label}</p>
              </div>
              <p className={`font-display text-xl font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Branch breakdown ── */}
        {summary.branchBreakdown.length > 0 && (
          <div className="bg-surface-50 border border-border rounded-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <h2 className="font-display text-sm font-semibold text-ink mb-3">Branch breakdown</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {summary.branchBreakdown.map((b) => (
                <div key={b.branch} className="flex items-center justify-between px-3 py-2 rounded-md bg-surface border border-border">
                  <span className="text-xs font-medium text-ink-muted truncate">{b.branch}</span>
                  <span className="text-xs tabular-nums text-ink ml-2 shrink-0">
                    {b.registered} / <span className="text-prime">{b.offered}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-ink-subtle mt-2">Registered / Offered per branch</p>
          </div>
        )}

        {/* Overview grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Drive details card */}
          <div className="lg:col-span-2 bg-surface-50 border border-border rounded-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h2 className="font-display text-base font-semibold text-ink mb-4">Drive details</h2>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex items-start gap-2.5">
                <DollarSign className="w-4 h-4 text-ink-subtle mt-0.5 shrink-0" aria-hidden />
                <div>
                  <dt className="text-xs text-ink-muted">CTC</dt>
                  <dd className="font-semibold text-ink tabular-nums">{formatCTC(drive.ctc)}</dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-ink-subtle mt-0.5 shrink-0" aria-hidden />
                <div>
                  <dt className="text-xs text-ink-muted">Location</dt>
                  <dd className="text-ink">{drive.jobLocation}</dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-ink-subtle mt-0.5 shrink-0" aria-hidden />
                <div>
                  <dt className="text-xs text-ink-muted">Drive date</dt>
                  <dd className="text-ink tabular-nums">{formatDate(drive.driveDate)}</dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-ink-subtle mt-0.5 shrink-0" aria-hidden />
                <div>
                  <dt className="text-xs text-ink-muted">Application deadline</dt>
                  <dd className="text-ink tabular-nums">
                    {drive.applicationDeadline ? formatDate(drive.applicationDeadline) : "No deadline"}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <GraduationCap className="w-4 h-4 text-ink-subtle mt-0.5 shrink-0" aria-hidden />
                <div>
                  <dt className="text-xs text-ink-muted">Min. CGPA</dt>
                  <dd className="font-semibold text-ink tabular-nums">{drive.minCgpa.toFixed(1)}</dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <GraduationCap className="w-4 h-4 text-ink-subtle mt-0.5 shrink-0" aria-hidden />
                <div>
                  <dt className="text-xs text-ink-muted">Academic year</dt>
                  <dd className="text-ink">{drive.academicYear}</dd>
                </div>
              </div>
            </dl>

            {/* Eligible branches */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-ink-muted mb-2">Eligible branches</p>
              <div className="flex flex-wrap gap-1.5">
                {drive.eligibleBranches.map((branch) => (
                  <span
                    key={branch}
                    className="inline-flex items-center px-2.5 h-6 rounded-md bg-accent/10 text-accent text-xs font-medium"
                  >
                    {branch}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            {drive.description && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-ink-muted mb-1.5">Description</p>
                <p className="text-sm text-ink leading-relaxed">{drive.description}</p>
              </div>
            )}

            {/* Enrolled count */}
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
              <User className="w-4 h-4 text-ink-subtle" aria-hidden />
              <span className="text-sm text-ink-muted">
                <span className="font-semibold text-ink tabular-nums">{enrolledCount}</span>{" "}
                student{enrolledCount !== 1 ? "s" : ""} enrolled
              </span>
            </div>
          </div>

          {/* Company info card */}
          <div className="bg-surface-50 border border-border rounded-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h2 className="font-display text-base font-semibold text-ink mb-4">Company</h2>

            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-md bg-surface-100 border border-border flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-ink-subtle" aria-hidden />
              </div>
              <div className="min-w-0">
                <Link
                  href={`/admin/companies/${drive.company.id}`}
                  className="font-semibold text-ink hover:text-accent transition-colors duration-80 block"
                >
                  {drive.company.name}
                </Link>
                <p className="text-xs text-ink-muted">{drive.company.industry}</p>
              </div>
            </div>

            <div className="mb-3">
              <Badge variant={drive.company.category} />
            </div>

            <dl className="space-y-2 mt-4 pt-4 border-t border-border">
              <div>
                <dt className="text-xs text-ink-muted">HR Contact</dt>
                <dd className="text-sm text-ink font-medium">{drive.company.hrName}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">HR Email</dt>
                <dd>
                  <a
                    href={`mailto:${drive.company.hrEmail}`}
                    className="text-sm text-accent hover:text-accent-hover transition-colors duration-80"
                  >
                    {drive.company.hrEmail}
                  </a>
                </dd>
              </div>
              <div className="pt-2">
                <dt className="text-xs text-ink-muted">Created by</dt>
                <dd className="text-sm text-ink">{drive.admin.name}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-surface-50 border border-border rounded-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-display text-lg font-semibold text-ink mb-5">Edit drive</h2>
          <DriveForm
            mode="edit"
            driveId={id}
            defaults={{
              companyId:           drive.company.id,
              jobRole:             drive.jobRole,
              ctc:                 String(drive.ctc),
              jobLocation:         drive.jobLocation,
              eligibleBranches:    drive.eligibleBranches,
              minCgpa:             String(drive.minCgpa),
              driveDate:           toDateStr(drive.driveDate),
              applicationDeadline: toDateStr(drive.applicationDeadline),
              status:              drive.status,
              academicYear:        drive.academicYear,
              description:         drive.description ?? "",
            }}
          />
        </div>

        {/* Enrollment + Funnel (client-managed) */}
        <DriveDetailClient
          driveId={id}
          stageCounts={drive.stageCounts}
          canEnroll={canEnroll}
        />

        {/* ── Participants table with filters + download ── */}
        <DriveParticipantsTable
          driveId={id}
          initialItems={participants.map((p) => ({
            ...p,
            appliedAt:   p.appliedAt.toISOString(),
            joiningDate: p.joiningDate ? p.joiningDate.toISOString() : null,
          }))}
          pagination={{ total, page, limit, pages }}
          branches={branches}
          searchParams={sp}
        />
      </div>
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { Download, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface DriveHistoryItem {
  id:           string;
  jobRole:      string;
  ctc:          number;
  jobLocation:  string;
  status:       string;
  driveDate:    string;
  academicYear: string;
  stageCounts: {
    REGISTERED:   number;
    SHORTLISTED:  number;
    INTERVIEWED:  number;
    OFFERED:      number;
    NOT_SELECTED: number;
  };
}

interface Props {
  companyId:    string;
  items:        DriveHistoryItem[];
  total:        number;
  page:         number;
  limit:        number;
  searchParams: Record<string, string>;
}

const STATUSES = ["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
const STATUS_LABEL: Record<string, string> = {
  UPCOMING:  "Upcoming",
  ACTIVE:    "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function setParam(key: string, value: string | null) {
  const params = new URLSearchParams(window.location.search);
  if (value) { params.set(key, value); } else { params.delete(key); }
  params.delete("page");
  return `?${params.toString()}`;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => {
  const y = CURRENT_YEAR - i;
  return `${y}-${y + 1}`;
});

export function CompanyDriveHistory({ companyId, items, total, page, limit, searchParams }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pages  = Math.max(1, Math.ceil(total / limit));

  const year   = searchParams.year   ?? "";
  const status = searchParams.status ?? "";

  function push(href: string) {
    startTransition(() => router.push(href));
  }

  function allDrivesDownloadUrl() {
    return `/api/v1/admin/reports/company-all-drives?companyId=${encodeURIComponent(companyId)}`;
  }

  function filteredDownloadUrl() {
    const params = new URLSearchParams({ companyId });
    if (year)   params.set("year",  year);
    return `/api/v1/admin/reports/company-filtered?${params.toString()}`;
  }

  return (
    <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border">
        <h2 className="font-display text-base font-semibold text-ink mr-auto">Drive history</h2>

        {/* Year filter */}
        <select
          value={year}
          onChange={(e) => push(setParam("year", e.target.value || null))}
          className="h-8 px-2 rounded-md bg-surface border border-border text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="Filter by academic year"
        >
          <option value="">All years</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => push(setParam("status", e.target.value || null))}
          className="h-8 px-2 rounded-md bg-surface border border-border text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="Filter by drive status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>

        {/* Download buttons */}
        {year && (
          <a
            href={filteredDownloadUrl()}
            download
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-surface border border-border text-xs text-ink-muted hover:text-ink hover:bg-surface-100 transition-colors duration-80"
            aria-label={`Download drives for ${year}`}
          >
            <Download className="w-3.5 h-3.5" aria-hidden />
            {year}
          </a>
        )}
        <a
          href={allDrivesDownloadUrl()}
          download
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-accent text-surface text-xs font-medium hover:bg-accent/90 transition-colors duration-80"
          aria-label="Download all drives for this company"
        >
          <Download className="w-3.5 h-3.5" aria-hidden />
          All drives
        </a>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" aria-busy={isPending}>
        <table className="w-full text-sm" role="table" aria-label="Company drive history">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Drive / Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Year</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-ink-muted tabular-nums">Registered</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-ink-muted tabular-nums">Shortlisted</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-ink-muted tabular-nums">Interviewed</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-ink-muted tabular-nums">Offered</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted tabular-nums">CTC (LPA)</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-ink-muted">
                  {(year || status) ? "No drives match the current filters." : "No drives yet."}
                </td>
              </tr>
            ) : (
              items.map((drive) => (
                <tr key={drive.id} className="hover:bg-surface-100/40 transition-colors duration-80">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/drives/${drive.id}`}
                      className="font-medium text-ink hover:text-accent transition-colors duration-80"
                    >
                      {drive.jobRole}
                    </Link>
                    <p className="text-xs text-ink-subtle mt-0.5">
                      {new Date(drive.driveDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink text-xs">{drive.academicYear}</td>
                  <td className="px-4 py-3"><Badge variant={drive.status} /></td>
                  <td className="px-4 py-3 text-center tabular-nums text-ink">{drive.stageCounts.REGISTERED}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-ink">{drive.stageCounts.SHORTLISTED}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-ink">{drive.stageCounts.INTERVIEWED}</td>
                  <td className="px-4 py-3 text-center tabular-nums font-semibold text-prime">{drive.stageCounts.OFFERED}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-ink">{drive.ctc}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/drives/${drive.id}`}
                      className="inline-flex items-center gap-0.5 text-xs text-ink-muted hover:text-ink transition-colors duration-80"
                      aria-label={`View ${drive.jobRole} drive`}
                    >
                      View <ChevronRight className="w-3 h-3" aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-ink-muted tabular-nums">
            {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => push(setParam("page", String(page - 1)))}
              className="h-7 w-7 rounded flex items-center justify-center text-xs text-ink-muted hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-80"
              aria-label="Previous page"
            >
              ‹
            </button>
            <span className="text-xs text-ink-muted tabular-nums px-1">{page} / {pages}</span>
            <button
              disabled={page >= pages}
              onClick={() => push(setParam("page", String(page + 1)))}
              className="h-7 w-7 rounded flex items-center justify-center text-xs text-ink-muted hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-80"
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

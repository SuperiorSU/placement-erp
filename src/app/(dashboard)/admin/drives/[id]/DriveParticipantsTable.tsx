"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useCallback, useTransition } from "react";
import { Download, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface Participant {
  applicationId: string;
  stage:         string;
  appliedAt:     string;
  joiningDate:   string | null;
  ctcOffered:    number | null;
  student: {
    id:         string;
    name:       string;
    rollNumber: string;
    branch:     string;
    cgpa:       number;
    user:       { email: string };
  };
  drive: { jobRole: string; ctc: number };
}

interface Pagination {
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

interface Props {
  driveId:      string;
  initialItems: Participant[];
  pagination:   Pagination;
  branches:     string[];
  searchParams: Record<string, string>;
}

const STAGES = ["REGISTERED", "SHORTLISTED", "INTERVIEWED", "OFFERED", "NOT_SELECTED"] as const;

const STAGE_LABEL: Record<string, string> = {
  REGISTERED:   "Registered",
  SHORTLISTED:  "Shortlisted",
  INTERVIEWED:  "Interviewed",
  OFFERED:      "Offered",
  NOT_SELECTED: "Not Selected",
};

function setParam(key: string, value: string | null) {
  const params = new URLSearchParams(window.location.search);
  if (value) { params.set(key, value); } else { params.delete(key); }
  params.delete("page");
  return `?${params.toString()}`;
}

export function DriveParticipantsTable({
  driveId,
  initialItems,
  pagination,
  branches,
  searchParams,
}: Props) {
  const router    = useRouter();
  const [isPending, startTransition] = useTransition();
  const timerRef  = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [search, setSearch] = useState(searchParams.q ?? "");

  const stage   = searchParams.stage ?? "";
  const branch  = searchParams.branch ?? "";
  const minCtc  = searchParams.minCtc ?? "";
  const maxCtc  = searchParams.maxCtc ?? "";
  const page    = Number(searchParams.page ?? 1);

  function push(href: string) {
    startTransition(() => router.push(href));
  }

  function handleSearch(val: string) {
    setSearch(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => push(setParam("q", val || null)), 350);
  }

  function buildDownloadUrl() {
    const params = new URLSearchParams({ driveId });
    if (stage)  params.set("stage",  stage);
    if (branch) params.set("branch", branch);
    if (minCtc) params.set("minCtc", minCtc);
    if (maxCtc) params.set("maxCtc", maxCtc);
    if (search) params.set("q",      search);
    return `/api/v1/admin/reports/drive-participants?${params.toString()}`;
  }

  const activeFilters = [stage, branch, minCtc, maxCtc, search].filter(Boolean).length;

  const clearAll = useCallback(() => {
    setSearch("");
    push("?");
  }, []);

  return (
    <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border">
        <h2 className="font-display text-base font-semibold text-ink mr-auto">Participants</h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-subtle pointer-events-none" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search name or roll no…"
            className="pl-8 pr-3 h-8 w-52 rounded-md bg-surface border border-border text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80"
            aria-label="Search participants"
          />
        </div>

        {/* Stage filter */}
        <select
          value={stage}
          onChange={(e) => push(setParam("stage", e.target.value || null))}
          className="h-8 px-2 rounded-md bg-surface border border-border text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="Filter by stage"
        >
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
        </select>

        {/* Branch filter */}
        {branches.length > 0 && (
          <select
            value={branch}
            onChange={(e) => push(setParam("branch", e.target.value || null))}
            className="h-8 px-2 rounded-md bg-surface border border-border text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            aria-label="Filter by branch"
          >
            <option value="">All branches</option>
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        )}

        {/* CTC range — only meaningful for OFFERED filter */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={minCtc}
            onChange={(e) => push(setParam("minCtc", e.target.value || null))}
            placeholder="Min CTC"
            min={0}
            className="h-8 w-20 px-2 rounded-md bg-surface border border-border text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-accent"
            aria-label="Minimum CTC filter"
          />
          <span className="text-xs text-ink-muted">–</span>
          <input
            type="number"
            value={maxCtc}
            onChange={(e) => push(setParam("maxCtc", e.target.value || null))}
            placeholder="Max CTC"
            min={0}
            className="h-8 w-20 px-2 rounded-md bg-surface border border-border text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-accent"
            aria-label="Maximum CTC filter"
          />
        </div>

        {activeFilters > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 h-8 px-2 rounded-md text-xs text-ink-muted hover:text-ink hover:bg-surface-100 transition-colors duration-80"
            aria-label="Clear all filters"
          >
            <X className="w-3 h-3" aria-hidden />
            Clear
          </button>
        )}

        {/* Download — respects active filters */}
        <a
          href={buildDownloadUrl()}
          download
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-surface-100 border border-border text-xs text-ink-muted font-medium hover:bg-surface-200 hover:text-ink hover:border-border-strong transition-colors duration-80"
          aria-label="Download filtered participants as Excel"
        >
          <Download className="w-3.5 h-3.5" aria-hidden />
          Export
        </a>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" aria-busy={isPending}>
        <table className="w-full text-sm" role="table" aria-label="Drive participants">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Student</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Roll No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Branch</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted tabular-nums">CGPA</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Stage</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted tabular-nums">Offered CTC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {initialItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink-muted">
                  {activeFilters > 0 ? "No participants match the current filters." : "No participants enrolled yet."}
                </td>
              </tr>
            ) : (
              initialItems.map((p) => (
                <tr key={p.applicationId} className="hover:bg-surface-100/40 transition-colors duration-80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{p.student.name}</p>
                    <p className="text-xs text-ink-subtle">{p.student.user.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink tabular-nums">{p.student.rollNumber}</td>
                  <td className="px-4 py-3 text-ink">{p.student.branch}</td>
                  <td className="px-4 py-3 font-semibold text-ink tabular-nums">{p.student.cgpa.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.stage} />
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-prime">
                    {p.ctcOffered !== null ? `${p.ctcOffered} LPA` : <span className="text-ink-subtle font-normal">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-ink-muted tabular-nums">
            {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
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
            <span className="text-xs text-ink-muted tabular-nums px-1">{page} / {pagination.pages}</span>
            <button
              disabled={page >= pagination.pages}
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

"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

// ── Types ──────────────────────────────────────────────────────────────────────

type FunnelStage = "REGISTERED" | "SHORTLISTED" | "INTERVIEWED" | "OFFERED" | "NOT_SELECTED";

interface Student {
  id:         string;
  name:       string;
  rollNumber: string;
  branch:     string;
  cgpa:       number;
  phone:      string | null;
  user:       { email: string };
}

interface Application {
  id:              string;
  stage:           FunnelStage;
  appliedAt:       string;
  updatedAt:       string;
  notes:           string | null;
  offerLetterUrl:  string | null;
  offerLetterName: string | null;
  joiningDate:     string | null;
  student:         Student;
}

interface PaginationMeta {
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

interface StageCounts {
  REGISTERED:   number;
  SHORTLISTED:  number;
  INTERVIEWED:  number;
  OFFERED:      number;
  NOT_SELECTED: number;
}

interface FunnelBoardProps {
  driveId:     string;
  stageCounts: StageCounts;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGES: FunnelStage[] = ["REGISTERED", "SHORTLISTED", "INTERVIEWED", "OFFERED", "NOT_SELECTED"];

const STAGE_TRANSITIONS: Record<FunnelStage, FunnelStage[]> = {
  REGISTERED:   ["SHORTLISTED", "INTERVIEWED", "OFFERED", "NOT_SELECTED"],
  SHORTLISTED:  ["INTERVIEWED", "OFFERED", "NOT_SELECTED"],
  INTERVIEWED:  ["OFFERED", "NOT_SELECTED"],
  OFFERED:      [],
  NOT_SELECTED: [],
};

const STAGE_LABELS: Record<FunnelStage, string> = {
  REGISTERED:   "Registered",
  SHORTLISTED:  "Shortlisted",
  INTERVIEWED:  "Interviewed",
  OFFERED:      "Offered",
  NOT_SELECTED: "Not Selected",
};

// ── Stage dropdown ─────────────────────────────────────────────────────────────

function StageDropdown({
  application,
  onStageChange,
}: {
  application:   Application;
  onStageChange: (appId: string, stage: FunnelStage) => void;
}) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const transitions = STAGE_TRANSITIONS[application.stage];

  if (transitions.length === 0) {
    return <Badge variant={application.stage} />;
  }

  async function changeStage(stage: FunnelStage) {
    setLoading(true);
    setOpen(false);
    await onStageChange(application.id, stage);
    setLoading(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full disabled:opacity-50"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Change stage from ${STAGE_LABELS[application.stage]}`}
      >
        <Badge variant={application.stage} />
        <ChevronDown className="w-3 h-3 text-ink-subtle shrink-0" aria-hidden />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="absolute left-0 top-full mt-1 z-50 bg-surface-100 border border-border rounded-lg overflow-hidden shadow-md min-w-40"
            role="menu"
          >
            {transitions.map((stage) => (
              <button
                key={stage}
                onClick={() => changeStage(stage)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-muted hover:bg-surface-200 hover:text-ink transition-colors duration-80 text-left"
                role="menuitem"
              >
                <Badge variant={stage} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Funnel summary bar ─────────────────────────────────────────────────────────

function FunnelSummary({
  counts,
  activeStage,
  onFilter,
}: {
  counts:      StageCounts;
  activeStage: FunnelStage | "";
  onFilter:    (stage: FunnelStage | "") => void;
}) {
  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  const STAGE_COLORS: Record<FunnelStage, string> = {
    REGISTERED:   "bg-[#6366F1]/20 text-[#6366F1] border-[#6366F1]/30",
    SHORTLISTED:  "bg-average-soft text-average border-average/30",
    INTERVIEWED:  "bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30",
    OFFERED:      "bg-prime-soft text-prime border-prime/30",
    NOT_SELECTED: "bg-below-soft text-below border-below/30",
  };

  const STAGE_ACTIVE: Record<FunnelStage, string> = {
    REGISTERED:   "ring-2 ring-[#6366F1]/60",
    SHORTLISTED:  "ring-2 ring-average/60",
    INTERVIEWED:  "ring-2 ring-[#3B82F6]/60",
    OFFERED:      "ring-2 ring-prime/60",
    NOT_SELECTED: "ring-2 ring-below/60",
  };

  return (
    <div className="bg-surface-50 border border-border rounded-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm font-semibold text-ink">Funnel overview</h3>
        {total > 0 && (
          <span className="text-xs text-ink-muted tabular-nums">{total} total</span>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
        {STAGES.map((stage) => (
          <button
            key={stage}
            onClick={() => onFilter(activeStage === stage ? "" : stage)}
            className={`flex flex-col items-center gap-1 p-2 rounded-md border transition-all duration-80 shrink-0 min-w-22 ${STAGE_COLORS[stage]} ${
              activeStage === stage ? STAGE_ACTIVE[stage] : "hover:opacity-80"
            }`}
            aria-pressed={activeStage === stage}
            aria-label={`Filter by ${STAGE_LABELS[stage]}: ${counts[stage]}`}
          >
            <span className="font-display text-xl font-bold tabular-nums leading-none">
              {counts[stage]}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider leading-tight text-center">
              {stage === "NOT_SELECTED" ? "Not Sel." : STAGE_LABELS[stage]}
            </span>
          </button>
        ))}
      </div>

      {activeStage && (
        <button
          onClick={() => onFilter("")}
          className="mt-3 text-xs text-ink-muted hover:text-ink transition-colors duration-80 flex items-center gap-1"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({ meta, onPage }: { meta: PaginationMeta; onPage: (p: number) => void }) {
  if (meta.pages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="text-sm text-ink-muted tabular-nums">
        {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(meta.page - 1)}
          disabled={meta.page === 1}
          className="h-8 w-8 rounded-md flex items-center justify-center text-ink-muted hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-80"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden />
        </button>
        <span className="text-sm text-ink-muted px-2 tabular-nums">
          {meta.page} / {meta.pages}
        </span>
        <button
          onClick={() => onPage(meta.page + 1)}
          disabled={meta.page === meta.pages}
          className="h-8 w-8 rounded-md flex items-center justify-center text-ink-muted hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-80"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

// ── Main board ─────────────────────────────────────────────────────────────────

export function FunnelBoard({ driveId, stageCounts: initialCounts }: FunnelBoardProps) {
  const [apps,        setApps]       = useState<Application[]>([]);
  const [pagination,  setPagination] = useState<PaginationMeta | null>(null);
  const [stageCounts, setStageCounts] = useState<StageCounts>(initialCounts);
  const [loading,     setLoading]    = useState(true);
  const [error,       setError]      = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<FunnelStage | "">("");
  const [search,      setSearch]     = useState("");
  const [page,        setPage]       = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page:  String(page),
      limit: "20",
    });
    if (stageFilter) params.set("stage", stageFilter);
    if (search.trim()) params.set("q", search.trim());

    try {
      const res  = await fetch(`/api/v1/admin/drives/${driveId}/applications?${params}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Failed to load applications");
        return;
      }

      setApps(json.data ?? []);
      setPagination(json.pagination ?? null);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }, [driveId, page, stageFilter, search]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  // Refresh stage counts from drive detail
  const refreshCounts = useCallback(async () => {
    try {
      const res  = await fetch(`/api/v1/admin/drives/${driveId}`);
      const json = await res.json();
      if (res.ok && json.data?.stageCounts) {
        setStageCounts(json.data.stageCounts);
      }
    } catch {}
  }, [driveId]);

  async function handleStageChange(appId: string, newStage: FunnelStage) {
    setActionError(null);

    const res  = await fetch(`/api/v1/admin/drives/${driveId}/applications/${appId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ stage: newStage }),
    });
    const json = await res.json();

    if (!res.ok) {
      setActionError(json.error?.message ?? "Failed to update stage");
      return;
    }

    // Optimistic update
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, stage: newStage } : a))
    );

    // Refresh counts
    await refreshCounts();

    // If filtering by stage, remove the moved application from view
    if (stageFilter && stageFilter !== newStage) {
      setApps((prev) => prev.filter((a) => a.id !== appId));
    }
  }

  function handleStageFilter(stage: FunnelStage | "") {
    setStageFilter(stage);
    setPage(1);
  }

  function handleSearch(q: string) {
    setSearch(q);
    setPage(1);
  }

  const total = pagination?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* Funnel summary */}
      <FunnelSummary
        counts={stageCounts}
        activeStage={stageFilter}
        onFilter={handleStageFilter}
      />

      {/* Applications table */}
      <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        {/* Table header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-display text-base font-semibold text-ink">
            Applications
            {stageFilter && (
              <span className="ml-2 font-body text-sm font-normal text-ink-muted">
                — {STAGE_LABELS[stageFilter]}
              </span>
            )}
          </h3>
          <span className="text-xs text-ink-subtle tabular-nums">
            {total} {total === 1 ? "student" : "students"}
          </span>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle pointer-events-none" aria-hidden />
            <input
              type="search"
              placeholder="Search by name or roll number…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-md text-sm bg-surface border border-border text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80"
              aria-label="Search applications"
            />
          </div>
        </div>

        {/* Action error */}
        {actionError && (
          <div className="px-4 py-3 bg-below-soft border-b border-below/20 text-sm text-below" role="alert">
            {actionError}
            <button
              onClick={() => setActionError(null)}
              className="ml-3 text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Table content */}
        {loading ? (
          <div className="divide-y divide-border" aria-busy="true" aria-label="Loading applications">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-32 bg-surface-100 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-surface-100 rounded animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-surface-100 rounded animate-pulse" />
                <div className="h-5 w-20 bg-surface-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-sm text-ink-muted mb-4">{error}</p>
            <button
              onClick={fetchApps}
              className="text-sm text-accent hover:text-accent-hover transition-colors duration-80"
            >
              Try again
            </button>
          </div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-sm text-ink-muted">
              {search || stageFilter
                ? "No applications match your filters."
                : "No students enrolled yet. Use the Enroll button to add students."}
            </p>
            {(search || stageFilter) && (
              <button
                onClick={() => { setSearch(""); setStageFilter(""); setPage(1); }}
                className="mt-3 text-sm text-accent hover:text-accent-hover transition-colors duration-80"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto" aria-live="polite" aria-atomic="false">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-50/80">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">
                    Student
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">
                    Branch
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">
                    CGPA
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">
                    Applied
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">
                    Stage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {apps.map((app) => (
                  <tr key={app.id} className="hover:bg-surface-100/40 transition-colors duration-80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{app.student.name}</p>
                      <p className="text-xs text-ink-muted tabular-nums">{app.student.rollNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{app.student.branch}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-ink">
                      {app.student.cgpa.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted tabular-nums">
                      {new Date(app.appliedAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <StageDropdown
                        application={app}
                        onStageChange={handleStageChange}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && (
          <Pagination meta={pagination} onPage={setPage} />
        )}
      </div>
    </div>
  );
}

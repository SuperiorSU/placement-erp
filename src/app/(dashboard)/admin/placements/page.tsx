import { Suspense } from "react";
import { TrendingUp } from "lucide-react";
import { PlacementService } from "@/lib/services/placement.service";
import { ManualPlacementModal } from "./ManualPlacementModal";
import { PlacementFilters } from "./PlacementFilters";
import type { PlacementListQuery } from "@/lib/validations/placement.schema";

function formatCtc(ctc: number) {
  return ctc >= 100 ? `₹${(ctc / 100).toFixed(1)} Cr` : `₹${ctc.toFixed(1)} LPA`;
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const TYPE_STYLES: Record<string, string> = {
  CAMPUS: "bg-[#6366F1]/10 text-[#6366F1]",
  MANUAL: "bg-average-soft text-average",
  PPO:    "bg-prime-soft text-prime",
};

export default async function AdminPlacementsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; academicYear?: string; q?: string; page?: string }>;
}) {
  const { type, academicYear, q, page: pageParam } = await searchParams;
  const page  = Math.max(1, parseInt(pageParam ?? "1"));
  const limit = 20;

  const query: PlacementListQuery = {
    page, limit, dir: "desc",
    type: type as any,
    academicYear, q,
  };

  const [{ items, total }, stats] = await Promise.all([
    PlacementService.list(query),
    PlacementService.getStats(academicYear),
  ]);
  const pages = Math.ceil(total / limit);

  return (
    <>
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Placements</h1>
            <p className="text-sm text-ink-muted mt-0.5">All campus, manual and PPO placements</p>
          </div>
          <ManualPlacementModal>
            <button className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-80">
              <TrendingUp className="w-4 h-4" aria-hidden />
              Record Manual
            </button>
          </ManualPlacementModal>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total",   value: stats.total,          color: "text-ink" },
            { label: "Campus",  value: stats.campus,         color: "text-[#6366F1]" },
            { label: "Manual",  value: stats.manual,         color: "text-average" },
            { label: "PPO",     value: stats.ppo,            color: "text-prime" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-surface-50 border border-border rounded-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <p className="text-xs text-ink-muted uppercase tracking-wider mb-1">{label}</p>
              <p className={`font-display text-2xl font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <Suspense>
          <PlacementFilters currentType={type} currentYear={academicYear} defaultQ={q} />
        </Suspense>

        <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <TrendingUp className="w-8 h-8 text-ink-subtle mb-4" aria-hidden />
              <h3 className="font-display text-lg font-semibold text-ink mb-1">No placements found</h3>
              <p className="text-sm text-ink-muted max-w-xs">
                {q || type || academicYear ? "Try adjusting your filters." : "No placement records yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">CTC</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Joining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-100/40 transition-colors duration-80">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{p.student.name}</p>
                        <p className="text-xs text-ink-muted">{p.student.rollNumber} · {p.student.branch}</p>
                      </td>
                      <td className="px-4 py-3 text-ink">{p.company}</td>
                      <td className="px-4 py-3 text-ink-muted">{p.jobRole}</td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-ink">{formatCtc(p.ctc)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-widest ${TYPE_STYLES[p.type] ?? ""}`}>
                          {p.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-muted text-xs tabular-nums">
                        {formatDate(p.joiningDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">{total} placements</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`?page=${page - 1}${type ? `&type=${type}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className="px-3 h-8 rounded-md border border-border text-sm text-ink-muted hover:text-ink transition-colors flex items-center">
                  Previous
                </a>
              )}
              {page < pages && (
                <a href={`?page=${page + 1}${type ? `&type=${type}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className="px-3 h-8 rounded-md border border-border text-sm text-ink-muted hover:text-ink transition-colors flex items-center">
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { InternshipService } from "@/lib/services/internship.service";
import { Badge } from "@/components/ui/Badge";
import { InternshipFilters } from "./InternshipFilters";
import { UpdateOutcomeButton } from "./UpdateOutcomeButton";
import type { InternshipListQuery } from "@/lib/validations/internship.schema";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const OUTCOME_BADGE: Record<string, string> = {
  ONGOING:       "bg-[#3B82F6]/10 text-[#3B82F6]",
  CONVERTED:     "bg-prime-soft text-prime",
  EXTENDED:      "bg-average-soft text-average",
  NOT_CONVERTED: "bg-below-soft text-below",
};

export default async function AdminInternshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ outcome?: string; endingSoon?: string; q?: string; page?: string }>;
}) {
  const { outcome, endingSoon, q, page: pageParam } = await searchParams;
  const page  = Math.max(1, parseInt(pageParam ?? "1"));
  const limit = 20;

  const query: InternshipListQuery = {
    page, limit,
    dir: "asc",
    outcome: outcome as any,
    endingSoon: endingSoon as "true" | "false" | undefined,
    q,
  };

  const { items, total } = await InternshipService.list(query);
  const pages = Math.ceil(total / limit);

  const now = new Date();
  const soon = new Date(now);
  soon.setDate(now.getDate() + 7);

  return (
    <>
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Internships</h1>
            <p className="text-sm text-ink-muted mt-0.5">Track student internship placements</p>
          </div>
          <Link
            href="/admin/placements"
            className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-80"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Record Placement
          </Link>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-4">
        <Suspense>
          <InternshipFilters currentOutcome={outcome} currentEndingSoon={endingSoon} defaultQ={q} />
        </Suspense>

        <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Briefcase className="w-8 h-8 text-ink-subtle mb-4" aria-hidden />
              <h3 className="font-display text-lg font-semibold text-ink mb-1">No internships found</h3>
              <p className="text-sm text-ink-muted max-w-xs">
                {q || outcome || endingSoon ? "Try adjusting your filters." : "No internship records yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Start</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">End Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Outcome</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => {
                    const endingSoonRow =
                      item.outcome === "ONGOING" &&
                      new Date(item.endDate) >= now &&
                      new Date(item.endDate) <= soon;
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors duration-80 ${
                          endingSoonRow
                            ? "bg-average-soft/20 hover:bg-average-soft/30"
                            : "hover:bg-surface-100/40"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink">{item.student.name}</p>
                          <p className="text-xs text-ink-muted">{item.student.rollNumber} · {item.student.branch}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-ink">{item.placement.company}</p>
                          <p className="text-xs text-ink-muted">{item.placement.academicYear}</p>
                        </td>
                        <td className="px-4 py-3 text-ink-muted text-xs tabular-nums">
                          {formatDate(item.startDate)}
                        </td>
                        <td className="px-4 py-3 text-xs tabular-nums">
                          <span className={endingSoonRow ? "text-average font-semibold" : "text-ink-muted"}>
                            {formatDate(item.endDate)}
                          </span>
                          {endingSoonRow && (
                            <p className="text-xs text-average">Ending soon</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink-muted text-xs tabular-nums">
                          {item.durationMonths}mo
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-widest ${OUTCOME_BADGE[item.outcome] ?? ""}`}>
                            {item.outcome.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <UpdateOutcomeButton internshipId={item.id} currentOutcome={item.outcome} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">{total} internships</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${outcome ? `&outcome=${outcome}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className="px-3 h-8 rounded-md border border-border text-sm text-ink-muted hover:text-ink transition-colors flex items-center"
                >
                  Previous
                </a>
              )}
              {page < pages && (
                <a
                  href={`?page=${page + 1}${outcome ? `&outcome=${outcome}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className="px-3 h-8 rounded-md border border-border text-sm text-ink-muted hover:text-ink transition-colors flex items-center"
                >
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

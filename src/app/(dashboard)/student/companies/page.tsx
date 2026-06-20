import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import { StudentService } from "@/lib/services/student.service";
import { Badge } from "@/components/ui/Badge";
import { DriveStatusFilter } from "./DriveStatusFilter";
import { DriveSearch } from "./DriveSearch";

function formatCtc(ctc: number) {
  return ctc >= 100 ? `₹${(ctc / 100).toFixed(1)} Cr` : `₹${ctc.toFixed(1)} LPA`;
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function StudentCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { status, q, page: pageParam } = await searchParams;
  const page  = Math.max(1, parseInt(pageParam ?? "1"));
  const limit = 12;

  const { items, total } = await StudentService.browseDrives(
    { status, q, page, limit },
    session.user.id
  );
  const pages = Math.ceil(total / limit);

  return (
    <>
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-2xl font-bold text-ink">Companies &amp; Drives</h1>
          <p className="text-sm text-ink-muted mt-0.5">Browse placement drives open for you</p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Suspense>
            <DriveStatusFilter currentStatus={status} />
          </Suspense>
          <div className="sm:ml-auto">
            <Suspense>
              <DriveSearch defaultValue={q} />
            </Suspense>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <Briefcase className="w-8 h-8 text-ink-subtle mb-4" aria-hidden />
            <h3 className="font-display text-lg font-semibold text-ink mb-1">No drives found</h3>
            <p className="text-sm text-ink-muted max-w-xs">
              {q ? "Try a different search term or clear the filter." : "No open drives at the moment."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((drive) => (
              <div
                key={drive.id}
                className="bg-surface-50 border border-border rounded-card p-4 shadow-card space-y-3 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-base font-semibold text-ink leading-snug truncate">
                      {drive.jobRole}
                    </p>
                    <p className="text-sm text-ink-muted mt-0.5">{drive.company.name}</p>
                  </div>
                  <Badge variant={drive.company.category} />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={drive.status} />
                  {drive.applied && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-prime-soft text-prime">
                      Applied
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-ink-muted">
                  <div className="flex justify-between">
                    <span>CTC</span>
                    <span className="font-semibold text-ink tabular-nums">{formatCtc(drive.ctc)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location</span>
                    <span className="text-ink">{drive.jobLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Drive Date</span>
                    <span className="text-ink">{formatDate(drive.driveDate)}</span>
                  </div>
                  {drive.applicationDeadline && (
                    <div className="flex justify-between">
                      <span>Deadline</span>
                      <span className="text-ink">{formatDate(drive.applicationDeadline)}</span>
                    </div>
                  )}
                </div>

                {drive.eligibleBranches.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {drive.eligibleBranches.slice(0, 4).map((b) => (
                      <span
                        key={b}
                        className="px-2 py-0.5 rounded bg-surface-100 text-xs text-ink-muted"
                      >
                        {b}
                      </span>
                    ))}
                    {drive.eligibleBranches.length > 4 && (
                      <span className="px-2 py-0.5 rounded bg-surface-100 text-xs text-ink-muted">
                        +{drive.eligibleBranches.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-ink-muted">{total} drives</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${status ? `&status=${status}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className="px-3 h-8 rounded-md border border-border text-sm text-ink-muted hover:text-ink transition-colors flex items-center"
                >
                  Previous
                </a>
              )}
              {page < pages && (
                <a
                  href={`?page=${page + 1}${status ? `&status=${status}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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

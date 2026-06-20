import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { ClipboardList, Download } from "lucide-react";
import { StudentService } from "@/lib/services/student.service";
import { Badge } from "@/components/ui/Badge";
import { StageFilter } from "./StageFilter";
import type { FunnelStage } from "@prisma/client";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatCtc(ctc: number) {
  return ctc >= 100 ? `₹${(ctc / 100).toFixed(1)} Cr` : `₹${ctc.toFixed(1)} LPA`;
}

export default async function StudentApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { stage, page: pageParam } = await searchParams;
  const page  = Math.max(1, parseInt(pageParam ?? "1"));
  const limit = 20;

  const { items, total } = await StudentService.getApplications(
    session.user.id,
    { page, limit, stage: stage as FunnelStage | undefined }
  );
  const pages = Math.ceil(total / limit);

  return (
    <>
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-2xl font-bold text-ink">My Applications</h1>
          <p className="text-sm text-ink-muted mt-0.5">Track your placement drive applications</p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-4">
        <Suspense>
          <StageFilter currentStage={stage} />
        </Suspense>

        <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <ClipboardList className="w-8 h-8 text-ink-subtle mb-4" aria-hidden />
              <h3 className="font-display text-lg font-semibold text-ink mb-1">No applications</h3>
              <p className="text-sm text-ink-muted max-w-xs mb-6">
                {stage ? "No applications with this status." : "You haven't applied to any drives yet."}
              </p>
              {!stage && (
                <Link
                  href="/student/companies"
                  className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors duration-80"
                >
                  Browse open drives
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Drive</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">CTC</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Drive Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Applied</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Stage</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted">Offer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((app) => (
                    <tr key={app.id} className="hover:bg-surface-100/40 transition-colors duration-80">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{app.drive.jobRole}</p>
                        <p className="text-xs text-ink-muted">{app.drive.company.name}</p>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink font-semibold">
                        {formatCtc(app.drive.ctc)}
                      </td>
                      <td className="px-4 py-3 text-ink-muted text-xs tabular-nums">
                        {formatDate(app.drive.driveDate)}
                      </td>
                      <td className="px-4 py-3 text-ink-muted text-xs tabular-nums">
                        {formatDate(app.appliedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={app.stage} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {app.stage === "OFFERED" && app.offerLetterUrl ? (
                          <a
                            href={app.offerLetterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-prime-soft text-prime text-xs font-medium hover:bg-prime/20 transition-colors"
                          >
                            <Download className="w-3 h-3" aria-hidden />
                            Offer Letter
                          </a>
                        ) : (
                          <span className="text-ink-subtle text-xs">—</span>
                        )}
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
            <p className="text-sm text-ink-muted">{total} applications</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${stage ? `&stage=${stage}` : ""}`}
                  className="px-3 h-8 rounded-md border border-border text-sm text-ink-muted hover:text-ink transition-colors flex items-center"
                >
                  Previous
                </a>
              )}
              {page < pages && (
                <a
                  href={`?page=${page + 1}${stage ? `&stage=${stage}` : ""}`}
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

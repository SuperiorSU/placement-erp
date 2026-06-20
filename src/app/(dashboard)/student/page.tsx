import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { ArrowRight, Briefcase, ClipboardList, TrendingUp } from "lucide-react";
import { StudentService } from "@/lib/services/student.service";
import { Badge } from "@/components/ui/Badge";

function formatCtc(ctc: number) {
  return `₹${ctc.toFixed(1)} LPA`;
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [profile, { items: drives }, { items: applications, total: appTotal }, { items: consentForms, total: consentTotal }] =
    await Promise.all([
      StudentService.getProfile(session.user.id),
      StudentService.browseDrives({ page: 1, limit: 5 }, session.user.id),
      StudentService.getApplications(session.user.id, { page: 1, limit: 5 }),
      StudentService.getConsentForms(session.user.id, { page: 1, limit: 100, status: "PENDING" }),
    ]);

  const isPlaced = profile._count.placements > 0;

  return (
    <>
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-2xl font-bold text-ink">Welcome, {profile.name}</h1>
          <p className="text-sm text-ink-muted mt-0.5">Manage your placement journey</p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/student/applications"
            className="group bg-surface-50 border border-border rounded-card p-5 flex items-start gap-4 hover:border-accent/40 transition-all duration-100"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-accent" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink-muted font-medium uppercase tracking-wider mb-1">Applications</p>
              <p className="font-display text-3xl font-bold text-ink tabular-nums">{profile._count.applications}</p>
            </div>
          </Link>

          <Link
            href="/student/consent-forms"
            className="group bg-surface-50 border border-border rounded-card p-5 flex items-start gap-4 hover:border-accent/40 transition-all duration-100"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="w-10 h-10 rounded-lg bg-average/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-average" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink-muted font-medium uppercase tracking-wider mb-1">Pending Consent Forms</p>
              <p className="font-display text-3xl font-bold text-ink tabular-nums">{consentTotal}</p>
            </div>
          </Link>

          <div
            className="bg-surface-50 border border-border rounded-card p-5 flex items-start gap-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isPlaced ? "bg-prime/10" : "bg-surface-100"}`}>
              <TrendingUp className={`w-5 h-5 ${isPlaced ? "text-prime" : "text-ink-subtle"}`} aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink-muted font-medium uppercase tracking-wider mb-1">Placement Status</p>
              <p className={`font-display text-lg font-bold ${isPlaced ? "text-prime" : "text-ink-muted"}`}>
                {isPlaced ? "Placed" : "Not Placed"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Open drives */}
          <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-display text-base font-semibold text-ink">Open Drives</h2>
              <Link
                href="/student/companies"
                className="text-sm text-ink-muted hover:text-accent transition-colors duration-80 flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </Link>
            </div>
            {drives.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Briefcase className="w-8 h-8 text-ink-subtle mb-3" aria-hidden />
                <p className="text-sm text-ink-muted">No open drives right now</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {drives.map((d) => (
                  <Link
                    key={d.id}
                    href={`/student/companies`}
                    className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-surface-100/40 transition-colors duration-80 block"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-ink truncate">{d.jobRole}</p>
                        {d.applied && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-prime-soft text-prime">
                            Applied
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1.5">
                        {d.company.name}
                        <Badge variant={d.company.category} />
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-ink">{formatCtc(d.ctc)}</p>
                      {d.applicationDeadline && (
                        <p className="text-xs text-ink-muted">Due {formatDate(d.applicationDeadline)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent applications */}
          <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-display text-base font-semibold text-ink">Recent Applications</h2>
              <Link
                href="/student/applications"
                className="text-sm text-ink-muted hover:text-accent transition-colors duration-80 flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </Link>
            </div>
            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <ClipboardList className="w-8 h-8 text-ink-subtle mb-3" aria-hidden />
                <p className="text-sm text-ink-muted">No applications yet</p>
                <Link
                  href="/student/companies"
                  className="mt-3 text-sm text-accent hover:underline"
                >
                  Browse open drives
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {applications.map((a) => (
                  <div key={a.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{a.drive.jobRole}</p>
                      <p className="text-xs text-ink-muted">{a.drive.company.name}</p>
                    </div>
                    <Badge variant={a.stage} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

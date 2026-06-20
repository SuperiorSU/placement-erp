import Link from "next/link";
import { GraduationCap, ShieldCheck, CalendarDays, TrendingUp, ArrowRight, Briefcase } from "lucide-react";
import { SuperAdminService } from "@/lib/services/super-admin.service";
import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/Badge";

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  accent,
}: {
  icon:   React.ComponentType<{ className?: string }>;
  label:  string;
  value:  number;
  href:   string;
  accent?: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-surface-50 border border-border rounded-card p-5 flex items-start gap-4 hover:border-accent/40 transition-all duration-100"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accent ?? "bg-accent/10"}`}>
        <Icon className={`w-5 h-5 ${accent ? "text-ink" : "text-accent"}`} aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-muted font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="font-display text-3xl font-bold text-ink tabular-nums leading-none">{value}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-ink-subtle mt-1 group-hover:text-accent transition-colors duration-80 shrink-0" aria-hidden />
    </Link>
  );
}

export default async function SuperAdminDashboardPage() {
  const [stats, activeDrives, ongoingInternships] = await Promise.all([
    SuperAdminService.getDashboardStats(),
    prisma.drive.findMany({
      where: { status: "ACTIVE" },
      take: 5,
      orderBy: { driveDate: "asc" },
      select: {
        id: true, jobRole: true, driveDate: true,
        company: { select: { name: true, category: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.internship.groupBy({
      by: ["outcome"],
      _count: { id: true },
    }),
  ]);

  const outcomeCounts = Object.fromEntries(
    ongoingInternships.map((g) => [g.outcome, g._count.id])
  );

  return (
    <>
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-2xl font-bold text-ink">Super Admin Dashboard</h1>
          <p className="text-sm text-ink-muted mt-0.5">Platform-wide overview</p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={GraduationCap} label="Students"         value={stats.totalStudents}  href="/super-admin/analytics" />
          <StatCard icon={ShieldCheck}   label="Admins"           value={stats.totalAdmins}    href="/super-admin/admins"   accent="bg-[#6366F1]/10" />
          <StatCard icon={CalendarDays}  label="Total Drives"     value={stats.totalDrives}    href="/super-admin/analytics" accent="bg-average/10" />
          <StatCard icon={TrendingUp}    label="Placed Students"  value={stats.placedStudents} href="/super-admin/analytics" accent="bg-prime/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Active drives */}
          <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-display text-base font-semibold text-ink">Active Drives</h2>
              <span className="text-xs text-ink-muted">{stats.activeDrives} active</span>
            </div>
            {activeDrives.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <CalendarDays className="w-8 h-8 text-ink-subtle mb-3" aria-hidden />
                <p className="text-sm text-ink-muted">No active drives</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activeDrives.map((d) => (
                  <div key={d.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{d.jobRole}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-ink-muted truncate">{d.company.name}</span>
                        <Badge variant={d.company.category} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold tabular-nums text-ink">{d._count.applications} enrolled</p>
                      <p className="text-xs text-ink-muted">
                        {new Date(d.driveDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Internship overview */}
          <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-display text-base font-semibold text-ink">Internship Status</h2>
              <span className="text-xs text-ink-muted">{stats.ongoingInternships} ongoing</span>
            </div>
            <div className="divide-y divide-border">
              {(
                [
                  { label: "Ongoing",       key: "ONGOING",       color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10" },
                  { label: "Converted",     key: "CONVERTED",     color: "text-prime",     bg: "bg-prime-soft" },
                  { label: "Extended",      key: "EXTENDED",      color: "text-average",   bg: "bg-average-soft" },
                  { label: "Not Converted", key: "NOT_CONVERTED", color: "text-below",     bg: "bg-below-soft" },
                ] as const
              ).map(({ label, key, color, bg }) => (
                <div key={key} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${bg.replace("bg-", "bg-").replace("-soft", "")}`} aria-hidden />
                    <span className="text-sm text-ink-muted">{label}</span>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${color}`}>
                    {outcomeCounts[key] ?? 0}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border">
              <Link
                href="/super-admin/analytics"
                className="text-sm text-ink-muted hover:text-accent transition-colors duration-80 flex items-center gap-1"
              >
                View full analytics
                <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

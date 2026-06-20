import Link from "next/link";
import { Building2, CalendarDays, Users, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { Badge } from "@/components/ui/Badge";

function formatCTC(ctc: number): string {
  if (ctc >= 100000) return `₹${(ctc / 100000).toFixed(1)}L`;
  return `₹${ctc.toLocaleString("en-IN")}`;
}

async function getStats() {
  const [
    companyCount,
    driveStatusGroups,
    enrollmentCount,
    placementCount,
  ] = await Promise.all([
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.drive.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.driveApplication.count(),
    prisma.driveApplication.count({ where: { stage: "OFFERED" } }),
  ]);

  const driveCounts = Object.fromEntries(
    driveStatusGroups.map((g) => [g.status, g._count.id])
  ) as Record<string, number>;

  return {
    companies:  companyCount,
    drives:     Object.values(driveCounts).reduce((s, n) => s + n, 0),
    active:     driveCounts["ACTIVE"]    ?? 0,
    upcoming:   driveCounts["UPCOMING"]  ?? 0,
    enrollments: enrollmentCount,
    placements:  placementCount,
  };
}

async function getRecentDrives() {
  return prisma.drive.findMany({
    take:    5,
    orderBy: { createdAt: "desc" },
    select: {
      id:           true,
      jobRole:      true,
      status:       true,
      driveDate:    true,
      academicYear: true,
      ctc:          true,
      company:      { select: { name: true, category: true } },
      _count:       { select: { applications: true } },
    },
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  accent,
}: {
  icon:    React.ComponentType<{ className?: string }>;
  label:   string;
  value:   number | string;
  sub?:    string;
  href:    string;
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
        <p className="font-display text-2xl font-bold text-ink tabular-nums leading-none">{value}</p>
        {sub && <p className="text-xs text-ink-muted mt-1">{sub}</p>}
      </div>
      <ArrowRight className="w-4 h-4 text-ink-subtle mt-1 group-hover:text-accent transition-colors duration-80 shrink-0" aria-hidden />
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const [stats, recentDrives] = await Promise.all([getStats(), getRecentDrives()]);

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
            <p className="text-sm text-ink-muted mt-0.5">Placement activity overview</p>
          </div>
          <Link
            href="/admin/drives/new"
            className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-80"
          >
            <Plus className="w-4 h-4" aria-hidden />
            New drive
          </Link>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Building2}
            label="Companies"
            value={stats.companies}
            href="/admin/companies"
          />
          <StatCard
            icon={CalendarDays}
            label="Drives"
            value={stats.drives}
            sub={`${stats.active} active · ${stats.upcoming} upcoming`}
            href="/admin/drives"
          />
          <StatCard
            icon={Users}
            label="Enrollments"
            value={stats.enrollments}
            sub="across all drives"
            href="/admin/drives"
          />
          <StatCard
            icon={TrendingUp}
            label="Placements"
            value={stats.placements}
            sub="students with offers"
            href="/admin/drives"
            accent="bg-prime/10"
          />
        </div>

        {/* Recent drives */}
        <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-display text-base font-semibold text-ink">Recent drives</h2>
            <Link
              href="/admin/drives"
              className="text-sm text-ink-muted hover:text-accent transition-colors duration-80 flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" aria-hidden />
            </Link>
          </div>

          {recentDrives.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <CalendarDays className="w-8 h-8 text-ink-subtle mb-3" aria-hidden />
              <p className="text-sm text-ink-muted mb-4">No drives yet</p>
              <Link
                href="/admin/drives/new"
                className="inline-flex items-center gap-2 px-4 h-8 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors duration-80"
              >
                <Plus className="w-4 h-4" aria-hidden />
                Create first drive
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface-50/80">
                  <tr>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Drive</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Company</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">CTC</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Date</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Status</th>
                    <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentDrives.map((drive) => (
                    <tr key={drive.id} className="hover:bg-surface-100/40 transition-colors duration-80">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/drives/${drive.id}`}
                          className="font-medium text-ink hover:text-accent transition-colors duration-80"
                        >
                          {drive.jobRole}
                        </Link>
                        <p className="text-xs text-ink-muted">{drive.academicYear}</p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-ink-muted">{drive.company.name}</span>
                          <Badge variant={drive.company.category} />
                        </div>
                      </td>
                      <td className="px-5 py-3 font-semibold tabular-nums text-ink">
                        {formatCTC(Number(drive.ctc))}
                      </td>
                      <td className="px-5 py-3 text-ink-muted tabular-nums text-xs">
                        {new Date(drive.driveDate).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={drive.status} />
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-ink">
                        {drive._count.applications}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/companies/new"
            className="group bg-surface-50 border border-border rounded-card p-5 hover:border-accent/40 transition-all duration-100 flex items-center gap-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-accent" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink text-sm">Add company</p>
              <p className="text-xs text-ink-muted">Register a new recruiting company</p>
            </div>
            <ArrowRight className="w-4 h-4 text-ink-subtle group-hover:text-accent transition-colors duration-80 shrink-0" aria-hidden />
          </Link>

          <Link
            href="/admin/drives/new"
            className="group bg-surface-50 border border-border rounded-card p-5 hover:border-accent/40 transition-all duration-100 flex items-center gap-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-accent" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink text-sm">Schedule drive</p>
              <p className="text-xs text-ink-muted">Create a new placement drive</p>
            </div>
            <ArrowRight className="w-4 h-4 text-ink-subtle group-hover:text-accent transition-colors duration-80 shrink-0" aria-hidden />
          </Link>
        </div>
      </div>
    </>
  );
}

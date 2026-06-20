import { Suspense } from "react";
import { SuperAdminService } from "@/lib/services/super-admin.service";
import { YearFilter } from "./YearFilter";

function formatCtc(ctc: number) {
  return `₹${ctc.toFixed(1)} LPA`;
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-50 border border-border rounded-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="text-xs text-ink-muted font-medium uppercase tracking-wider mb-2">{label}</p>
      <p className="font-display text-3xl font-bold text-ink tabular-nums">{value}</p>
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const year = yearParam ?? new Date().getFullYear().toString();
  const data = await SuperAdminService.getAnalytics(year);

  return (
    <>
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Analytics</h1>
            <p className="text-sm text-ink-muted mt-0.5">Platform-wide placement statistics</p>
          </div>
          <Suspense>
            <YearFilter currentYear={year} />
          </Suspense>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="Total Placements" value={String(data.totalPlacements)} />
          <KpiCard label="Average CTC"      value={formatCtc(data.avgCtc)} />
          <KpiCard label="Internship Conversion Rate" value={`${data.conversionRate.toFixed(1)}%`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Branch-wise */}
          <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-display text-base font-semibold text-ink">Branch-wise Placements</h2>
            </div>
            {data.branchWise.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-8">No placements data</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Branch</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted">Placements</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.branchWise.map(({ branch, count }) => (
                      <tr key={branch} className="hover:bg-surface-100/40 transition-colors duration-80">
                        <td className="px-4 py-3 font-medium text-ink">{branch}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-accent">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top companies */}
          <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-display text-base font-semibold text-ink">Top Companies</h2>
            </div>
            {data.topCompanies.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-8">No placements data</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Company</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted">Offers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.topCompanies.map(({ company, count }) => (
                      <tr key={company} className="hover:bg-surface-100/40 transition-colors duration-80">
                        <td className="px-4 py-3 font-medium text-ink">{company}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-prime">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Monthly breakdown */}
        <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-display text-base font-semibold text-ink">Monthly Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Month</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted">Placements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.monthly.map(({ month, count }) => (
                  <tr key={month} className="hover:bg-surface-100/40 transition-colors duration-80">
                    <td className="px-4 py-3 text-ink-muted">{month}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-ink">
                      {count === 0 ? <span className="text-ink-subtle">—</span> : count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

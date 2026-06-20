"use client";

import { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  Users,
  BarChart2,
  TrendingUp,
  Briefcase,
  ClipboardList,
  Download,
  Building2,
  GraduationCap,
  CalendarDays,
} from "lucide-react";

const CURRENT = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(CURRENT - 2 + i));
const ACADEMIC_YEARS = Array.from({ length: 6 }, (_, i) => {
  const y = CURRENT - i;
  return `${y}-${y + 1}`;
});
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Company { id: string; name: string; }

interface ReportCard {
  title:       string;
  description: string;
  icon:        React.ComponentType<{ className?: string }>;
  href:        (year: string) => string;
  needsYear:   boolean;
}

const REPORTS: ReportCard[] = [
  {
    title:       "Branch-wise Placements",
    description: "Placement count and average CTC grouped by student branch.",
    icon:        Users,
    href:        (y) => `/api/v1/admin/reports/branch-wise?year=${y}`,
    needsYear:   true,
  },
  {
    title:       "Company-wise Placements",
    description: "Number of offers and average CTC per company.",
    icon:        Briefcase,
    href:        (y) => `/api/v1/admin/reports/company-wise?year=${y}`,
    needsYear:   true,
  },
  {
    title:       "Monthly Summary",
    description: "Month-by-month placement and CTC breakdown.",
    icon:        BarChart2,
    href:        (y) => `/api/v1/admin/reports/monthly?year=${y}`,
    needsYear:   true,
  },
  {
    title:       "Yearly Summary",
    description: "Academic-year-wise placement statistics across all years.",
    icon:        TrendingUp,
    href:        () => `/api/v1/admin/reports/yearly`,
    needsYear:   false,
  },
  {
    title:       "Internship Conversion",
    description: "Internship outcomes: converted, extended, not converted.",
    icon:        FileSpreadsheet,
    href:        (y) => `/api/v1/admin/reports/internship-conversion?year=${y}`,
    needsYear:   true,
  },
  {
    title:       "Manual Placements",
    description: "All manually recorded off-campus and referral placements.",
    icon:        ClipboardList,
    href:        (y) => `/api/v1/admin/reports/manual-placements?year=${y}`,
    needsYear:   true,
  },
];

function DownloadBtn({ href, disabled, label }: { href: string; disabled?: boolean; label?: string }) {
  return (
    <button
      disabled={disabled}
      onClick={() => !disabled && window.open(href, "_blank")}
      className="mt-auto inline-flex items-center gap-2 px-4 h-9 rounded-md bg-surface-100 border border-border text-sm text-ink-muted font-medium hover:bg-surface-200 hover:text-ink hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-80"
    >
      <Download className="w-4 h-4" aria-hidden />
      {label ?? "Download Excel"}
    </button>
  );
}

export default function AdminReportsPage() {
  const [year, setYear]             = useState(String(CURRENT));
  const [companies, setCompanies]   = useState<Company[]>([]);

  // Company-level report state
  const [coId, setCoId]             = useState("");
  const [coYear, setCoYear]         = useState("");
  const [coMonth, setCoMonth]       = useState("");

  // Yearly-all-companies state
  const [yaYear, setYaYear]         = useState(ACADEMIC_YEARS[0]);

  // Branch detail state
  const [bdBranch, setBdBranch]     = useState("");
  const [bdYear, setBdYear]         = useState("");

  useEffect(() => {
    fetch("/api/v1/admin/companies?limit=200")
      .then((r) => r.json())
      .then((j) => setCompanies(j.data?.items ?? []))
      .catch(() => {});
  }, []);

  // Build company report URLs
  function companyAllUrl() {
    return coId ? `/api/v1/admin/reports/company-all-drives?companyId=${coId}` : "";
  }
  function companyFilteredUrl() {
    if (!coId) return "";
    const p = new URLSearchParams({ companyId: coId });
    if (coYear)  p.set("year",  coYear);
    if (coMonth) p.set("month", String(MONTHS.indexOf(coMonth)));
    return `/api/v1/admin/reports/company-filtered?${p.toString()}`;
  }
  function yearlyUrl() {
    return yaYear ? `/api/v1/admin/reports/yearly-companies?year=${encodeURIComponent(yaYear)}` : "";
  }
  function branchUrl() {
    if (!bdBranch) return "";
    const p = new URLSearchParams({ branch: bdBranch });
    if (bdYear) p.set("year", bdYear);
    return `/api/v1/admin/reports/branch-detail?${p.toString()}`;
  }

  const selectClass = "h-9 px-3 rounded-md bg-surface border border-border text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent w-full";
  const inputClass  = "h-9 px-3 rounded-md bg-surface border border-border text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-accent w-full";

  return (
    <>
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Reports</h1>
            <p className="text-sm text-ink-muted mt-0.5">Export placement data as Excel files</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="report-year" className="text-sm text-ink-muted">Year</label>
            <select
              id="report-year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-8">

        {/* ── Standard reports ── */}
        <section>
          <h2 className="font-display text-sm font-semibold text-ink-muted uppercase tracking-widest mb-4">Standard reports</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORTS.map((r) => (
              <div
                key={r.title}
                className="bg-surface-50 border border-border rounded-card p-5 flex flex-col gap-4"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <r.icon className="w-5 h-5 text-accent" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-semibold text-ink">{r.title}</p>
                    {r.needsYear && (
                      <p className="text-xs text-ink-muted mt-0.5">Academic year {year}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">{r.description}</p>
                <button
                  onClick={() => window.open(r.href(year), "_blank")}
                  className="mt-auto inline-flex items-center gap-2 px-4 h-9 rounded-md bg-surface-100 border border-border text-sm text-ink-muted font-medium hover:bg-surface-200 hover:text-ink hover:border-border-strong transition-colors duration-80"
                >
                  <Download className="w-4 h-4" aria-hidden />
                  Download Excel
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Advanced reports ── */}
        <section>
          <h2 className="font-display text-sm font-semibold text-ink-muted uppercase tracking-widest mb-4">Advanced reports</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">

            {/* Company — All Drives */}
            <div className="bg-surface-50 border border-border rounded-card p-5 flex flex-col gap-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-prime/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-prime" aria-hidden />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-ink">Company — All Drives</p>
                  <p className="text-xs text-ink-muted mt-0.5">Multi-tab workbook: summary + one tab per drive</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-ink-muted">Company</label>
                <select value={coId} onChange={(e) => setCoId(e.target.value)} className={selectClass} aria-label="Select company for all-drives report">
                  <option value="">— Select company —</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <DownloadBtn href={companyAllUrl()} disabled={!coId} />
            </div>

            {/* Company — Filtered */}
            <div className="bg-surface-50 border border-border rounded-card p-5 flex flex-col gap-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-prime/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-prime" aria-hidden />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-ink">Company — Filtered Drives</p>
                  <p className="text-xs text-ink-muted mt-0.5">Company drives filtered by year and/or month</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-ink-muted">Company</label>
                <select value={coId} onChange={(e) => setCoId(e.target.value)} className={selectClass} aria-label="Select company for filtered report">
                  <option value="">— Select company —</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-ink-muted">Academic year</label>
                  <select value={coYear} onChange={(e) => setCoYear(e.target.value)} className={selectClass} aria-label="Filter by academic year">
                    <option value="">All years</option>
                    {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-ink-muted">Month</label>
                  <select value={coMonth} onChange={(e) => setCoMonth(e.target.value)} className={selectClass} aria-label="Filter by month">
                    <option value="">All months</option>
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <DownloadBtn href={companyFilteredUrl()} disabled={!coId} />
            </div>

            {/* Year — All Companies */}
            <div className="bg-surface-50 border border-border rounded-card p-5 flex flex-col gap-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-average/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-average" aria-hidden />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-ink">Year — All Companies</p>
                  <p className="text-xs text-ink-muted mt-0.5">Every company's drives in an academic year with outcomes</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-ink-muted">Academic year</label>
                <select value={yaYear} onChange={(e) => setYaYear(e.target.value)} className={selectClass} aria-label="Select academic year for all-companies report">
                  {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <DownloadBtn href={yearlyUrl()} disabled={!yaYear} />
            </div>

            {/* Branch Detail */}
            <div className="bg-surface-50 border border-border rounded-card p-5 flex flex-col gap-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-accent" aria-hidden />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-ink">Branch Detail</p>
                  <p className="text-xs text-ink-muted mt-0.5">Branch-level drill-down across drives with per-student rows</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-ink-muted">Branch</label>
                <input
                  type="text"
                  value={bdBranch}
                  onChange={(e) => setBdBranch(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className={inputClass}
                  aria-label="Branch name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-muted">Academic year (optional)</label>
                <select value={bdYear} onChange={(e) => setBdYear(e.target.value)} className={selectClass} aria-label="Filter branch report by academic year">
                  <option value="">All years</option>
                  {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <DownloadBtn href={branchUrl()} disabled={!bdBranch.trim()} />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

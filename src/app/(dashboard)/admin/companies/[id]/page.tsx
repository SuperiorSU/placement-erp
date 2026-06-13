import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Building2, Globe, Mail, Phone, CalendarDays } from "lucide-react";
import { CompanyService } from "@/lib/services/company.service";
import { Badge } from "@/components/ui/Badge";
import { CompanyForm } from "../CompanyForm";
import { DeleteCompanyButton } from "./DeleteCompanyButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

const DRIVE_STATUS_LABEL: Record<string, string> = {
  UPCOMING:  "Upcoming",
  ACTIVE:    "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;

  let company;
  try {
    company = await CompanyService.getById(id);
  } catch {
    notFound();
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Page header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/companies"
              className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors duration-80"
              aria-label="Back to companies"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
              Companies
            </Link>
            <span className="text-border">/</span>
            <h1 className="font-display text-2xl font-bold text-ink">{company.name}</h1>
            <Badge variant={company.category} />
          </div>
          <DeleteCompanyButton id={id} name={company.name} driveCount={company.drives.length} />
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Two-column: info + drives */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          {/* Edit form */}
          <div className="bg-surface-50 border border-border rounded-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <h2 className="font-display text-lg font-semibold text-ink mb-5">Company details</h2>
            <CompanyForm
              mode="edit"
              companyId={id}
              defaults={{
                name:        company.name,
                industry:    company.industry,
                hrName:      company.hrName,
                hrEmail:     company.hrEmail,
                hrPhone:     company.hrPhone ?? "",
                website:     company.website ?? "",
                category:    company.category as "PRIME" | "AVERAGE" | "BELOW_AVERAGE",
                description: company.description ?? "",
              }}
            />
          </div>

          {/* Side info + drives */}
          <div className="space-y-4">
            {/* Quick info card */}
            <div className="bg-surface-50 border border-border rounded-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <h2 className="font-display text-base font-semibold text-ink mb-3">Contact info</h2>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-ink-subtle shrink-0" aria-hidden />
                  <a href={`mailto:${company.hrEmail}`} className="text-ink hover:text-accent transition-colors duration-80 truncate">
                    {company.hrEmail}
                  </a>
                </li>
                {company.hrPhone && (
                  <li className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-ink-subtle shrink-0" aria-hidden />
                    <span className="text-ink">{company.hrPhone}</span>
                  </li>
                )}
                {company.website && (
                  <li className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-ink-subtle shrink-0" aria-hidden />
                    <a
                      href={company.website} target="_blank" rel="noopener noreferrer"
                      className="text-accent hover:text-accent-hover transition-colors duration-80 truncate"
                    >
                      {company.website.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                )}
              </ul>
              {company.description && (
                <p className="mt-4 text-sm text-ink-muted leading-relaxed max-w-prose">
                  {company.description}
                </p>
              )}
            </div>

            {/* Drives */}
            <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="font-display text-base font-semibold text-ink">Drives</h2>
                <span className="text-xs text-ink-subtle tabular-nums">{company.drives.length}</span>
              </div>

              {company.drives.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <CalendarDays className="w-6 h-6 text-ink-subtle mb-3" aria-hidden />
                  <p className="text-sm text-ink-muted">No drives yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {company.drives.map((drive) => (
                    <li key={drive.id}>
                      <Link
                        href={`/admin/drives/${drive.id}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-surface-100/50 transition-colors duration-80 group"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink group-hover:text-accent transition-colors duration-80">
                            {drive.jobRole}
                          </p>
                          <p className="text-xs text-ink-muted mt-0.5">
                            {new Date(drive.driveDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            {" · "}
                            {drive.academicYear}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-ink-subtle tabular-nums">
                            {drive._count.applications} applied
                          </span>
                          <Badge variant={drive.status} label={DRIVE_STATUS_LABEL[drive.status]} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Globe, Mail, Phone } from "lucide-react";
import { CompanyService } from "@/lib/services/company.service";
import { Badge } from "@/components/ui/Badge";
import { CompanyForm } from "../CompanyForm";
import { DeleteCompanyButton } from "./DeleteCompanyButton";
import { CompanyDriveHistory } from "./CompanyDriveHistory";

interface PageProps {
  params:       Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}

export default async function CompanyDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);

  let company;
  try {
    company = await CompanyService.getById(id);
  } catch {
    notFound();
  }

  const page  = Number(sp.page ?? 1);
  const limit = 15;
  const { items: driveHistory, total: driveTotal } = await CompanyService.getDriveHistory(id, {
    page,
    limit,
    dir:    (sp.dir as "asc" | "desc") ?? "desc",
    year:   sp.year,
    status: sp.status as Parameters<typeof CompanyService.getDriveHistory>[1]["status"],
  });

  return (
    <>
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
        {/* Two-column: edit form + contact info */}
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

          {/* Contact info */}
          <div className="bg-surface-50 border border-border rounded-card p-4 self-start" style={{ boxShadow: "var(--shadow-card)" }}>
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
              <p className="mt-4 text-sm text-ink-muted leading-relaxed">{company.description}</p>
            )}
          </div>
        </div>

        {/* ── Full-width drive history table ── */}
        <CompanyDriveHistory
          companyId={id}
          items={driveHistory.map((d) => ({
            ...d,
            driveDate: d.driveDate.toISOString(),
          }))}
          total={driveTotal}
          page={page}
          limit={limit}
          searchParams={sp}
        />
      </div>
    </>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { Building2, Plus, Search } from "lucide-react";
import { CompanyService } from "@/lib/services/company.service";
import { CompanyListQuerySchema } from "@/lib/validations/company.schema";
import { Badge } from "@/components/ui/Badge";
import { CompanyListPagination } from "./CompanyListPagination";
import { CompanyFilters } from "./CompanyFilters";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

async function CompanyTable({ searchParams }: { searchParams: Record<string, string> }) {
  const params = CompanyListQuerySchema.parse({
    page:     searchParams.page     ?? "1",
    limit:    searchParams.limit    ?? "20",
    sort:     searchParams.sort     ?? "createdAt",
    dir:      searchParams.dir      ?? "desc",
    category: searchParams.category ?? undefined,
    q:        searchParams.q        ?? undefined,
  });

  const { items, total } = await CompanyService.list(params);

  if (items.length === 0) {
    return (
      <div className="border border-border rounded-card overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <Building2 className="w-8 h-8 text-ink-subtle mb-4" aria-hidden />
          <h3 className="font-display text-lg font-semibold text-ink mb-1">
            {searchParams.q || searchParams.category ? "No companies match" : "No companies yet"}
          </h3>
          <p className="text-sm text-ink-muted max-w-xs mb-6">
            {searchParams.q || searchParams.category
              ? "Try adjusting your search or filters."
              : "Add your first company to start tracking placement drives."}
          </p>
          {!searchParams.q && !searchParams.category && (
            <Link
              href="/admin/companies/new"
              className="inline-flex items-center gap-2 px-5 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors duration-80"
            >
              <Plus className="w-4 h-4" aria-hidden />
              Add company
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border border-border rounded-card overflow-hidden" aria-busy="false">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted w-65">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  Industry
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  HR Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  Drives
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((company) => (
                <tr key={company.id} className="hover:bg-surface-50/50 transition-colors duration-80 group">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/companies/${company.id}`}
                      className="font-medium text-ink hover:text-accent transition-colors duration-80 group-hover:text-accent"
                    >
                      {company.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{company.industry}</td>
                  <td className="px-4 py-3">
                    <div className="text-ink">{company.hrName}</div>
                    <div className="text-xs text-ink-muted">{company.hrEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={company.category} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                    {company._count.drives}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CompanyListPagination total={total} page={params.page} limit={params.limit} />
      </div>

      <p className="text-xs text-ink-subtle">
        {total} {total === 1 ? "company" : "companies"} total
      </p>
    </>
  );
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      {/* Page header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Companies</h1>
            <p className="text-sm text-ink-muted mt-0.5">Manage partner companies and placement drives</p>
          </div>
          <Link
            href="/admin/companies/new"
            className="inline-flex items-center gap-2 px-5 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover active:bg-[#3D68E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-80"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Add company
          </Link>
        </div>
      </div>

      {/* Page content */}
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-4">
        <Suspense fallback={<div className="h-9 rounded-md bg-surface-100 animate-pulse w-full max-w-xs" />}>
          <CompanyFilters />
        </Suspense>

        <Suspense
          fallback={
            <div className="border border-border rounded-card overflow-hidden" aria-busy="true" aria-label="Loading companies">
              <div className="divide-y divide-border">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-4 py-3 flex gap-4 items-center">
                    <div className="h-4 w-40 bg-surface-100 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-surface-100 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-surface-100 rounded animate-pulse ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <CompanyTable searchParams={params} />
        </Suspense>
      </div>
    </>
  );
}

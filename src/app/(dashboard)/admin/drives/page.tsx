import { Suspense } from "react";
import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { DriveService } from "@/lib/services/drive.service";
import { DriveListQuerySchema } from "@/lib/validations/drive.schema";
import { Badge } from "@/components/ui/Badge";
import { DriveFilters } from "./DriveFilters";
import { DriveListPagination } from "./DriveListPagination";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

function formatCTC(ctc: number): string {
  if (ctc >= 100000) return `₹${(ctc / 100000).toFixed(1)}L`;
  return `₹${ctc.toLocaleString("en-IN")}`;
}

async function DriveTable({ searchParams }: { searchParams: Record<string, string> }) {
  const params = DriveListQuerySchema.parse({
    page:         searchParams.page         ?? "1",
    limit:        searchParams.limit        ?? "20",
    sort:         searchParams.sort         ?? "driveDate",
    dir:          searchParams.dir          ?? "desc",
    status:       searchParams.status       ?? undefined,
    companyId:    searchParams.companyId    ?? undefined,
    academicYear: searchParams.academicYear ?? undefined,
    q:            searchParams.q            ?? undefined,
  });

  const { items, total } = await DriveService.list(params);

  if (items.length === 0) {
    return (
      <div className="border border-border rounded-card overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <CalendarDays className="w-8 h-8 text-ink-subtle mb-4" aria-hidden />
          <h3 className="font-display text-lg font-semibold text-ink mb-1">
            {searchParams.q || searchParams.status ? "No drives match" : "No drives yet"}
          </h3>
          <p className="text-sm text-ink-muted max-w-xs mb-6">
            {searchParams.q || searchParams.status
              ? "Try adjusting your search or filters."
              : "Create the first placement drive to start enrolling students."}
          </p>
          {!searchParams.q && !searchParams.status && (
            <Link
              href="/admin/drives/new"
              className="inline-flex items-center gap-2 px-5 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors duration-80"
            >
              <Plus className="w-4 h-4" aria-hidden />
              Create drive
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border border-border rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  Drive
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  CTC
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  Enrolled
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((drive) => (
                <tr key={drive.id} className="hover:bg-surface-50/50 transition-colors duration-80 group">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/drives/${drive.id}`}
                      className="font-medium text-ink hover:text-accent transition-colors duration-80 group-hover:text-accent block"
                    >
                      {drive.jobRole}
                    </Link>
                    <span className="text-xs text-ink-muted">{drive.jobLocation}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/companies/${drive.company.id}`}
                        className="text-ink hover:text-accent transition-colors duration-80"
                      >
                        {drive.company.name}
                      </Link>
                      <Badge variant={drive.company.category} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted tabular-nums">
                    {new Date(drive.driveDate).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-ink">
                    {formatCTC(drive.ctc)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={drive.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                    {drive._count.applications}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DriveListPagination total={total} page={params.page} limit={params.limit} />
      </div>

      <p className="text-xs text-ink-subtle">
        {total} {total === 1 ? "drive" : "drives"} total
      </p>
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="border border-border rounded-card overflow-hidden" aria-busy="true" aria-label="Loading drives">
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex gap-4 items-center">
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-36 bg-surface-100 rounded animate-pulse" />
              <div className="h-3 w-24 bg-surface-100 rounded animate-pulse" />
            </div>
            <div className="h-4 w-28 bg-surface-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-surface-100 rounded animate-pulse" />
            <div className="h-5 w-20 bg-surface-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DrivesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Drives</h1>
            <p className="text-sm text-ink-muted mt-0.5">Manage placement drives and student enrollment</p>
          </div>
          <Link
            href="/admin/drives/new"
            className="inline-flex items-center gap-2 px-5 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover active:bg-[#3D68E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-80"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Create drive
          </Link>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-4">
        <Suspense fallback={<div className="h-9 rounded-md bg-surface-100 animate-pulse w-full" />}>
          <DriveFilters />
        </Suspense>

        <Suspense fallback={<TableSkeleton />}>
          <DriveTable searchParams={params} />
        </Suspense>
      </div>
    </>
  );
}

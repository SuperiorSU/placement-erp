import Link from "next/link";
import { Suspense } from "react";
import { Plus, ClipboardList } from "lucide-react";
import { ConsentService } from "@/lib/services/consent.service";
import { ConsentFormFilters } from "./ConsentFormFilters";
import { ToggleActiveButton } from "./ToggleActiveButton";
import type { ConsentFormListQuery } from "@/lib/validations/consent.schema";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminConsentFormsPage({
  searchParams,
}: {
  searchParams: Promise<{ isGeneric?: string; isActive?: string; q?: string; page?: string }>;
}) {
  const { isGeneric, isActive, q, page: pageParam } = await searchParams;
  const page  = Math.max(1, parseInt(pageParam ?? "1"));
  const limit = 20;

  const query: ConsentFormListQuery = {
    page, limit, dir: "desc",
    isGeneric: isGeneric as "true" | "false" | undefined,
    isActive:  isActive as "true" | "false" | undefined,
    q,
  };

  const { items, total } = await ConsentService.list(query);
  const pages = Math.ceil(total / limit);

  return (
    <>
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Consent Forms</h1>
            <p className="text-sm text-ink-muted mt-0.5">Manage and distribute consent forms</p>
          </div>
          <Link
            href="/admin/consent-forms/new"
            className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-80"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Create Form
          </Link>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-4">
        <Suspense>
          <ConsentFormFilters currentIsGeneric={isGeneric} currentIsActive={isActive} defaultQ={q} />
        </Suspense>

        <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <ClipboardList className="w-8 h-8 text-ink-subtle mb-4" aria-hidden />
              <h3 className="font-display text-lg font-semibold text-ink mb-1">No consent forms</h3>
              <p className="text-sm text-ink-muted max-w-xs mb-6">
                {q ? "Try a different search term." : "Create your first consent form."}
              </p>
              {!q && (
                <Link
                  href="/admin/consent-forms/new"
                  className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors duration-80"
                >
                  <Plus className="w-4 h-4" aria-hidden />
                  Create Form
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Linked Drive</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted">Signatures</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((form) => (
                    <tr key={form.id} className="hover:bg-surface-100/40 transition-colors duration-80">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/consent-forms/${form.id}`}
                          className="font-medium text-ink hover:text-accent transition-colors duration-80"
                        >
                          {form.title}
                        </Link>
                        <p className="text-xs text-ink-muted mt-0.5">{formatDate(form.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-muted text-xs">
                        {form.drive ? (
                          <span>{form.drive.jobRole} — {form.drive.company.name}</span>
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-widest ${
                          form.isGeneric ? "bg-[#6366F1]/10 text-[#6366F1]" : "bg-surface-100 text-ink-muted"
                        }`}>
                          {form.isGeneric ? "Generic" : "Drive-specific"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-widest ${
                          form.isActive ? "bg-prime-soft text-prime" : "bg-surface-100 text-ink-muted"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${form.isActive ? "bg-prime animate-pulse" : "bg-ink-subtle"}`} aria-hidden />
                          {form.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-ink">
                        {form._count.signatures}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/consent-forms/${form.id}`}
                            className="px-3 h-7 rounded-md border border-border text-xs text-ink-muted hover:text-ink hover:border-border-strong transition-colors"
                          >
                            Edit
                          </Link>
                          <ToggleActiveButton formId={form.id} isActive={form.isActive} />
                        </div>
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
            <p className="text-sm text-ink-muted">{total} forms</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className="px-3 h-8 rounded-md border border-border text-sm text-ink-muted hover:text-ink transition-colors flex items-center"
                >
                  Previous
                </a>
              )}
              {page < pages && (
                <a
                  href={`?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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

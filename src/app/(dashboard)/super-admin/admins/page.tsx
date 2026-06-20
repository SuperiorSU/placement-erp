import { Suspense } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { SuperAdminService } from "@/lib/services/super-admin.service";
import { AdminSearch } from "./AdminSearch";
import { CreateAdminModal } from "./CreateAdminModal";
import { AdminActions } from "./AdminActions";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page  = Math.max(1, parseInt(pageParam ?? "1"));
  const limit = 20;

  const { items, total } = await SuperAdminService.listAdmins({ page, limit, q });
  const pages = Math.ceil(total / limit);

  return (
    <>
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Admins</h1>
            <p className="text-sm text-ink-muted mt-0.5">Manage admin accounts</p>
          </div>
          <CreateAdminModal>
            <button className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-80">
              <Plus className="w-4 h-4" aria-hidden />
              Add Admin
            </button>
          </CreateAdminModal>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-4">
        <Suspense>
          <AdminSearch defaultValue={q} />
        </Suspense>

        <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <ShieldCheck className="w-8 h-8 text-ink-subtle mb-4" aria-hidden />
              <h3 className="font-display text-lg font-semibold text-ink mb-1">
                {q ? "No admins found" : "No admins yet"}
              </h3>
              <p className="text-sm text-ink-muted max-w-xs">
                {q ? "Try a different search term." : "Add the first admin to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Joined</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((admin) => (
                    <tr key={admin.id} className="hover:bg-surface-100/40 transition-colors duration-80">
                      <td className="px-4 py-3 font-medium text-ink">{admin.name}</td>
                      <td className="px-4 py-3 text-ink-muted">{admin.email}</td>
                      <td className="px-4 py-3 text-ink-muted">{admin.department ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-widest ${
                            admin.isActive
                              ? "bg-prime-soft text-prime"
                              : "bg-surface-100 text-ink-muted"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              admin.isActive ? "bg-prime animate-pulse" : "bg-ink-subtle"
                            }`}
                            aria-hidden
                          />
                          {admin.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-muted text-xs tabular-nums">
                        {formatDate(admin.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AdminActions adminId={admin.id} isActive={admin.isActive} name={admin.name} />
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
            <p className="text-sm text-ink-muted">
              {total} admin{total !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className="px-3 h-8 rounded-md border border-border text-sm text-ink-muted hover:text-ink hover:border-border-strong transition-colors duration-80 flex items-center"
                >
                  Previous
                </a>
              )}
              {page < pages && (
                <a
                  href={`?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className="px-3 h-8 rounded-md border border-border text-sm text-ink-muted hover:text-ink hover:border-border-strong transition-colors duration-80 flex items-center"
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

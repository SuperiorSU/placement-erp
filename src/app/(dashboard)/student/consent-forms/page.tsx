import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { ClipboardList, CheckCircle2 } from "lucide-react";
import { StudentService } from "@/lib/services/student.service";
import { ConsentStatusFilter } from "./ConsentStatusFilter";
import { SignatureModal } from "./SignatureModal";
import type { ConsentStatus } from "@prisma/client";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:  "bg-average-soft text-average",
  SIGNED:   "bg-prime-soft text-prime",
  DECLINED: "bg-below-soft text-below",
};

export default async function StudentConsentFormsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { status, page: pageParam } = await searchParams;
  const page  = Math.max(1, parseInt(pageParam ?? "1"));
  const limit = 20;

  const { items, total } = await StudentService.getConsentForms(
    session.user.id,
    { page, limit, status: status as ConsentStatus | undefined }
  );
  const pages = Math.ceil(total / limit);

  return (
    <>
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-2xl font-bold text-ink">Consent Forms</h1>
          <p className="text-sm text-ink-muted mt-0.5">Review and sign placement consent forms</p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-4">
        <Suspense>
          <ConsentStatusFilter currentStatus={status} />
        </Suspense>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <ClipboardList className="w-8 h-8 text-ink-subtle mb-4" aria-hidden />
            <h3 className="font-display text-lg font-semibold text-ink mb-1">No consent forms</h3>
            <p className="text-sm text-ink-muted max-w-xs">
              {status ? "No forms with this status." : "No consent forms are assigned to you yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((form) => {
              const sigStatus = form.signature?.status ?? "PENDING";
              const isSigned  = sigStatus === "SIGNED";
              return (
                <div
                  key={form.id}
                  className="bg-surface-50 border border-border rounded-card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 flex-wrap">
                      <h3 className="font-display text-base font-semibold text-ink">{form.title}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-widest ${STATUS_STYLES[sigStatus] ?? STATUS_STYLES.PENDING}`}>
                        {sigStatus === "PENDING" ? "Pending" : sigStatus === "SIGNED" ? "Signed" : "Declined"}
                      </span>
                      {form.isGeneric && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-ink-muted">
                          General
                        </span>
                      )}
                    </div>
                    {form.drive && (
                      <p className="text-sm text-ink-muted mt-1">
                        Drive: {form.drive.jobRole} — {form.drive.company.name}
                      </p>
                    )}
                    <p className="text-xs text-ink-subtle mt-1">
                      Added {formatDate(form.createdAt)}
                      {isSigned && form.signature?.signedAt && (
                        <> · Signed {formatDate(form.signature.signedAt)}</>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {isSigned ? (
                      <div className="flex items-center gap-2 text-prime text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" aria-hidden />
                        Signed
                      </div>
                    ) : (
                      <SignatureModal formId={form.id} formTitle={form.title}>
                        <button className="px-4 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-80">
                          Sign Form
                        </button>
                      </SignatureModal>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-ink-muted">{total} forms</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${status ? `&status=${status}` : ""}`}
                  className="px-3 h-8 rounded-md border border-border text-sm text-ink-muted hover:text-ink transition-colors flex items-center"
                >
                  Previous
                </a>
              )}
              {page < pages && (
                <a
                  href={`?page=${page + 1}${status ? `&status=${status}` : ""}`}
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

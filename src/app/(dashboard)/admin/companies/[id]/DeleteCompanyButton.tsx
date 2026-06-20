"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";

interface Props {
  id:         string;
  name:       string;
  driveCount: number;
}

export function DeleteCompanyButton({ id, name, driveCount }: Props) {
  const router     = useRouter();
  const [open, setOpen]   = useState(false);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = driveCount === 0;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) { setOpen(false); setError(null); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const res  = await fetch(`/api/v1/admin/companies/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Delete failed");
        return;
      }
      router.push("/admin/companies");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!canDelete}
        title={canDelete ? "Delete company" : `Cannot delete — has ${driveCount} drive(s)`}
        className="inline-flex items-center gap-2 px-3 h-9 rounded-md bg-below/10 text-below border border-below/20 text-sm font-medium hover:bg-below/20 hover:border-below/40 focus-visible:ring-2 focus-visible:ring-below transition-colors duration-80 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Delete company"
      >
        <Trash2 className="w-4 h-4" aria-hidden />
        Delete
      </button>

      {/* Confirmation dialog */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-company-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !busy) { setOpen(false); setError(null); } }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" aria-hidden />

          {/* Dialog */}
          <div
            className="relative bg-surface-100 border border-border rounded-lg w-full max-w-md p-6 animate-scale-in"
            style={{ boxShadow: "var(--shadow-modal)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-below-soft flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-below" aria-hidden />
              </div>
              <div>
                <h2 id="delete-company-title" className="font-display text-lg font-semibold text-ink">
                  Delete company?
                </h2>
                <p className="text-sm text-ink-muted mt-1">
                  Permanently delete <span className="text-ink font-medium">{name}</span>? This cannot be undone.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-md bg-below-soft border border-below/20 text-sm text-below" role="alert">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setOpen(false); setError(null); }}
                disabled={busy}
                className="inline-flex items-center px-5 h-9 rounded-md bg-surface-200 text-ink text-sm font-medium border border-border-strong hover:bg-surface-100 disabled:opacity-40 transition-colors duration-80"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 h-9 rounded-md bg-below/10 text-below border border-below/20 text-sm font-medium hover:bg-below/20 focus-visible:ring-2 focus-visible:ring-below disabled:opacity-40 transition-colors duration-80"
              >
                {busy ? "Deleting…" : "Delete company"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

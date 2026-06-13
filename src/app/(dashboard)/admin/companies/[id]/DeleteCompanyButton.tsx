"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

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
          role="dialog" aria-modal="true" aria-labelledby="delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !busy && setOpen(false)}
            aria-hidden
          />

          {/* Dialog */}
          <div className="relative bg-surface-100 border border-border rounded-lg w-full max-w-md p-6" style={{ boxShadow: "var(--shadow-modal)" }}>
            <h2 id="delete-title" className="font-display text-lg font-semibold text-ink mb-2">
              Delete company
            </h2>
            <p className="text-sm text-ink-muted mb-4">
              Permanently delete <span className="text-ink font-medium">{name}</span>? This cannot be undone.
            </p>

            {error && (
              <p className="text-xs text-below mb-3" role="alert">{error}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete} disabled={busy}
                className="inline-flex items-center gap-2 px-5 h-9 rounded-md bg-below/10 text-below border border-below/20 text-sm font-medium hover:bg-below/20 focus-visible:ring-2 focus-visible:ring-below transition-colors duration-80 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => setOpen(false)} disabled={busy}
                className="inline-flex items-center px-5 h-9 rounded-md bg-surface-200 text-ink text-sm font-medium border border-border-strong hover:bg-surface-200 transition-colors duration-80 disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";

interface Props {
  id:           string;
  jobRole:      string;
  enrolledCount: number;
}

export function DeleteDriveButton({ id, jobRole, enrolledCount }: Props) {
  const router = useRouter();
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const res  = await fetch(`/api/v1/admin/drives/${id}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Failed to delete drive");
        return;
      }

      router.push("/admin/drives");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  const canDelete = enrolledCount === 0;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) { setOpen(false); setError(null); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!canDelete}
        title={
          canDelete
            ? "Delete drive"
            : `Cannot delete — ${enrolledCount} student(s) enrolled`
        }
        className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-below/10 text-below border border-below/20 text-sm font-medium hover:bg-below/20 hover:border-below/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-below transition-colors duration-80 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Delete drive"
      >
        <Trash2 className="w-4 h-4" aria-hidden />
        Delete
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          onClick={(e) => { if (e.target === e.currentTarget && !loading) setOpen(false); }}
        >
          <div
            className="bg-surface-100 border border-border rounded-lg p-6 w-full max-w-md mx-4 shadow-modal animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-below-soft flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-below" aria-hidden />
              </div>
              <div>
                <h2 id="delete-title" className="font-display text-lg font-semibold text-ink">
                  Delete drive?
                </h2>
                <p className="text-sm text-ink-muted mt-1">
                  <strong className="text-ink">{jobRole}</strong> will be permanently removed. This action cannot be undone.
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
                disabled={loading}
                className="inline-flex items-center px-5 h-9 rounded-md bg-surface-200 text-ink text-sm font-medium border border-border-strong hover:bg-surface-100 disabled:opacity-40 transition-colors duration-80"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 h-9 rounded-md bg-below/10 text-below border border-below/20 text-sm font-medium hover:bg-below/20 focus-visible:ring-2 focus-visible:ring-below disabled:opacity-40 transition-colors duration-80"
              >
                {loading ? "Deleting…" : "Delete drive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

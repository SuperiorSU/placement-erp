"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

export function ConsentFormEditor() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [isGeneric, setIsGeneric] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      title:     fd.get("title"),
      content:   fd.get("content"),
      isGeneric: isGeneric,
      isActive:  true,
    };
    const driveId = (fd.get("driveId") as string).trim();
    if (driveId) body.driveId = driveId;

    try {
      const res  = await fetch("/api/v1/admin/consent-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Failed to create form");
        return;
      }

      router.push("/admin/consent-forms");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 p-3 bg-below-soft border border-below/20 rounded-md text-sm text-below" role="alert">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-surface-50 border border-border rounded-card p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="space-y-1">
          <label htmlFor="cf-title" className="block text-xs font-medium text-ink-muted uppercase tracking-wider">
            Title <span className="text-below">*</span>
          </label>
          <input
            id="cf-title"
            name="title"
            required
            maxLength={300}
            autoFocus
            placeholder="e.g. Placement Participation Consent"
            className="w-full h-9 px-3 rounded-md bg-surface-100 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="cf-driveId" className="block text-xs font-medium text-ink-muted uppercase tracking-wider">
            Linked Drive ID <span className="text-ink-subtle">(optional)</span>
          </label>
          <input
            id="cf-driveId"
            name="driveId"
            placeholder="Leave blank for generic forms"
            disabled={isGeneric}
            className="w-full h-9 px-3 rounded-md bg-surface-100 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isGeneric}
            onClick={() => setIsGeneric((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isGeneric ? "bg-accent" : "bg-surface-200"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-100 ${isGeneric ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
          <span className="text-sm text-ink">
            Generic form <span className="text-ink-muted">(shown to all students, not linked to a specific drive)</span>
          </span>
        </div>

        <div className="space-y-1">
          <label htmlFor="cf-content" className="block text-xs font-medium text-ink-muted uppercase tracking-wider">
            Content <span className="text-below">*</span>
          </label>
          <p className="text-xs text-ink-subtle">HTML is supported for rich formatting.</p>
          <textarea
            id="cf-content"
            name="content"
            required
            rows={15}
            maxLength={50000}
            placeholder="Enter consent form content here…"
            className="w-full px-3 py-2 rounded-md bg-surface-100 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent font-mono resize-y"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 h-9 rounded-md border border-border text-sm text-ink-muted hover:text-ink hover:border-border-strong transition-colors duration-80"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-80 disabled:opacity-50 min-w-28 flex items-center justify-center"
        >
          {loading ? (
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
          ) : (
            "Create Form"
          )}
        </button>
      </div>
    </form>
  );
}

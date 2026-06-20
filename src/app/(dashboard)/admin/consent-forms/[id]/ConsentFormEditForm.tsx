"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ConsentFormDetail } from "@/lib/services/consent.service";

export function ConsentFormEditForm({ form }: { form: ConsentFormDetail }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [saved, setSaved]     = useState(false);
  const [isActive, setIsActive] = useState(form.isActive);
  const [isGeneric, setIsGeneric] = useState(form.isGeneric);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      title:     fd.get("title"),
      content:   fd.get("content"),
      isActive,
      isGeneric,
    };
    const driveId = (fd.get("driveId") as string).trim();
    body.driveId = driveId || null;

    try {
      const res  = await fetch(`/api/v1/admin/consent-forms/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Failed to save");
        return;
      }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-surface-50 border border-border rounded-card p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <h2 className="font-display text-base font-semibold text-ink">Edit Form</h2>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-below-soft border border-below/20 rounded-md text-sm text-below" role="alert">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-prime-soft border border-prime/20 rounded-md text-sm text-prime" role="status">
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden />
          <p>Changes saved</p>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="cfe-title" className="block text-xs font-medium text-ink-muted uppercase tracking-wider">Title <span className="text-below">*</span></label>
        <input
          id="cfe-title"
          name="title"
          required
          defaultValue={form.title}
          maxLength={300}
          className="w-full h-9 px-3 rounded-md bg-surface-100 border border-border text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="cfe-driveId" className="block text-xs font-medium text-ink-muted uppercase tracking-wider">Linked Drive ID <span className="text-ink-subtle">(optional)</span></label>
        <input
          id="cfe-driveId"
          name="driveId"
          defaultValue={form.drive?.id ?? ""}
          disabled={isGeneric}
          placeholder="Leave blank for generic forms"
          className="w-full h-9 px-3 rounded-md bg-surface-100 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <button
            type="button"
            role="switch"
            aria-checked={isGeneric}
            onClick={() => setIsGeneric((v) => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isGeneric ? "bg-accent" : "bg-surface-200"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isGeneric ? "translate-x-4" : "translate-x-0"}`} />
          </button>
          <span className="text-sm text-ink">Generic</span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive((v) => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isActive ? "bg-accent" : "bg-surface-200"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-4" : "translate-x-0"}`} />
          </button>
          <span className="text-sm text-ink">Active</span>
        </label>
      </div>

      <div className="space-y-1">
        <label htmlFor="cfe-content" className="block text-xs font-medium text-ink-muted uppercase tracking-wider">Content <span className="text-below">*</span></label>
        <textarea
          id="cfe-content"
          name="content"
          required
          rows={15}
          maxLength={50000}
          defaultValue={form.content}
          className="w-full px-3 py-2 rounded-md bg-surface-100 border border-border text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent font-mono resize-y"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-5 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-80 disabled:opacity-50 min-w-24 flex items-center justify-center"
        >
          {loading ? (
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}

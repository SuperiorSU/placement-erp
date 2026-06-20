"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, AlertCircle } from "lucide-react";

const CURRENT = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => `${CURRENT - 2 + i}-${CURRENT - 1 + i}`);

export function ManualPlacementModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      studentId:      fd.get("studentId"),
      company:        fd.get("company"),
      jobRole:        fd.get("jobRole"),
      ctc:            Number(fd.get("ctc")),
      referralSource: fd.get("referralSource"),
      type:           fd.get("type"),
      academicYear:   fd.get("academicYear"),
    };
    const joiningDate = fd.get("joiningDate") as string;
    if (joiningDate) body.joiningDate = joiningDate;

    try {
      const res  = await fetch("/api/v1/admin/placements/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Failed to record placement");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-100 border border-border rounded-lg w-full max-w-lg shadow-2xl animate-scale-in overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface-100">
              <h2 className="font-display text-base font-semibold text-ink">Record Manual Placement</h2>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:bg-surface-200 hover:text-ink transition-colors" aria-label="Close">
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-below-soft border border-below/20 rounded-md text-sm text-below" role="alert">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-medium text-ink-muted uppercase tracking-wider">Student ID <span className="text-below">*</span></label>
                <input name="studentId" required placeholder="Student UUID from the system" className="w-full h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
                <p className="text-xs text-ink-subtle">Find the student ID from the Students page.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-ink-muted uppercase tracking-wider">Company <span className="text-below">*</span></label>
                  <input name="company" required maxLength={200} className="w-full h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-ink-muted uppercase tracking-wider">Job Role <span className="text-below">*</span></label>
                  <input name="jobRole" required maxLength={200} className="w-full h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-ink-muted uppercase tracking-wider">CTC (LPA) <span className="text-below">*</span></label>
                  <input name="ctc" type="number" step="0.1" min="0" required className="w-full h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-ink-muted uppercase tracking-wider">Type <span className="text-below">*</span></label>
                  <select name="type" required className="w-full h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <option value="Full-time">Full-time</option>
                    <option value="Intern">Intern</option>
                    <option value="PPO">PPO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-ink-muted uppercase tracking-wider">Academic Year <span className="text-below">*</span></label>
                  <select name="academicYear" required className="w-full h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-ink-muted uppercase tracking-wider">Joining Date</label>
                  <input name="joiningDate" type="date" className="w-full h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-ink-muted uppercase tracking-wider">Referral Source <span className="text-below">*</span></label>
                <input name="referralSource" required maxLength={200} placeholder="e.g. LinkedIn, alumni network, campus drive" className="w-full h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="px-4 h-9 rounded-md border border-border text-sm text-ink-muted hover:text-ink transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors disabled:opacity-50 min-w-24 flex items-center justify-center">
                  {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden /> : "Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

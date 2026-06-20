"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, AlertCircle } from "lucide-react";

export function CreateAdminModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {
      name:     fd.get("name")     as string,
      email:    fd.get("email")    as string,
      password: fd.get("password") as string,
    };
    const phone      = fd.get("phone")      as string;
    const department = fd.get("department") as string;
    if (phone)      body.phone      = phone;
    if (department) body.department = department;

    try {
      const res  = await fetch("/api/v1/super-admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Failed to create admin");
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
          aria-label="Create Admin"
        >
          <div className="bg-surface-100 border border-border rounded-lg w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-display text-base font-semibold text-ink">Add Admin</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:bg-surface-200 hover:text-ink transition-colors"
                aria-label="Close"
              >
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
                <label htmlFor="ca-name" className="block text-xs font-medium text-ink-muted uppercase tracking-wider">
                  Name <span className="text-below">*</span>
                </label>
                <input
                  id="ca-name"
                  name="name"
                  required
                  autoFocus
                  className="w-full h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  placeholder="Full name"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="ca-email" className="block text-xs font-medium text-ink-muted uppercase tracking-wider">
                  Email <span className="text-below">*</span>
                </label>
                <input
                  id="ca-email"
                  name="email"
                  type="email"
                  required
                  className="w-full h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  placeholder="admin@college.edu"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="ca-password" className="block text-xs font-medium text-ink-muted uppercase tracking-wider">
                  Password <span className="text-below">*</span>
                </label>
                <input
                  id="ca-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="w-full h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="ca-phone" className="block text-xs font-medium text-ink-muted uppercase tracking-wider">Phone</label>
                  <input
                    id="ca-phone"
                    name="phone"
                    type="tel"
                    className="w-full h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="ca-dept" className="block text-xs font-medium text-ink-muted uppercase tracking-wider">Department</label>
                  <input
                    id="ca-dept"
                    name="department"
                    className="w-full h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    placeholder="CSE, IT…"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 h-9 rounded-md border border-border text-sm text-ink-muted hover:text-ink hover:border-border-strong transition-colors duration-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-80 disabled:opacity-50 min-w-24 flex items-center justify-center"
                >
                  {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
                  ) : (
                    "Create Admin"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

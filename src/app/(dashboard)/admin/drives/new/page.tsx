import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { DriveForm } from "../DriveForm";

export default function NewDrivePage() {
  return (
    <>
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          <Link
            href="/admin/drives"
            className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors duration-80"
            aria-label="Back to drives"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
            Drives
          </Link>
          <span className="text-border">/</span>
          <h1 className="font-display text-2xl font-bold text-ink">New drive</h1>
        </div>
      </div>

      <div className="px-6 py-6 max-w-3xl mx-auto">
        <div className="bg-surface-50 border border-border rounded-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-display text-lg font-semibold text-ink mb-5">Drive details</h2>
          <DriveForm mode="create" />
        </div>
      </div>
    </>
  );
}

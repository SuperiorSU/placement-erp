"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const OUTCOMES = ["ONGOING", "CONVERTED", "EXTENDED", "NOT_CONVERTED"] as const;
const LABELS: Record<string, string> = {
  ONGOING:       "Ongoing",
  CONVERTED:     "Converted",
  EXTENDED:      "Extended",
  NOT_CONVERTED: "Not Converted",
};

interface Props {
  internshipId:   string;
  currentOutcome: string;
}

export function UpdateOutcomeButton({ internshipId, currentOutcome }: Props) {
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function update(outcome: string) {
    if (outcome === currentOutcome) { setOpen(false); return; }
    setLoading(true);
    setOpen(false);
    await fetch(`/api/v1/admin/internships/${internshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md border border-border text-xs text-ink-muted hover:text-ink hover:border-border-strong transition-colors disabled:opacity-50"
      >
        {loading ? "…" : "Update"}
        <ChevronDown className="w-3 h-3" aria-hidden />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-surface-100 border border-border rounded-md shadow-lg overflow-hidden">
            {OUTCOMES.map((o) => (
              <button
                key={o}
                onClick={() => update(o)}
                className={`w-full px-3 py-2 text-left text-xs hover:bg-surface-200 transition-colors ${
                  o === currentOutcome ? "text-accent font-medium" : "text-ink-muted"
                }`}
              >
                {LABELS[o]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

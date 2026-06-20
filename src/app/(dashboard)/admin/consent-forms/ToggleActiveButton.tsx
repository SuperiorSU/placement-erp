"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ToggleActiveButton({ formId, isActive }: { formId: string; isActive: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    await fetch(`/api/v1/admin/consent-forms/${formId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-3 h-7 rounded-md text-xs font-medium transition-colors disabled:opacity-50 border ${
        isActive
          ? "bg-below/10 text-below border-below/20 hover:bg-below/20"
          : "bg-prime-soft text-prime border-prime/20 hover:bg-prime/20"
      }`}
    >
      {loading ? "…" : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}

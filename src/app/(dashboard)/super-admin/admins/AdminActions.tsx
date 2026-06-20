"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  adminId:  string;
  isActive: boolean;
  name:     string;
}

export function AdminActions({ adminId, isActive, name }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (!isActive) {
      await update({ isActive: true });
      return;
    }
    setConfirm(true);
  }

  async function update(data: { isActive: boolean }) {
    setLoading(true);
    try {
      await fetch(`/api/v1/super-admin/admins/${adminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="text-xs text-ink-muted">Deactivate {name}?</span>
        <button
          onClick={() => update({ isActive: false })}
          disabled={loading}
          className="px-3 h-7 rounded-md bg-below/10 text-below border border-below/20 text-xs font-medium hover:bg-below/20 transition-colors disabled:opacity-50"
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="px-3 h-7 rounded-md border border-border text-xs text-ink-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-3 h-7 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
        isActive
          ? "bg-below/10 text-below border border-below/20 hover:bg-below/20"
          : "bg-prime-soft text-prime border border-prime/20 hover:bg-prime/20"
      }`}
    >
      {loading ? "…" : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}

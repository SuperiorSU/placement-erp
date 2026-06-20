"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function SignOutButton() {
  const router    = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/login");
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={busy}
      className="flex items-center gap-3 px-3 h-9 w-full rounded-md text-sm text-ink-muted hover:bg-surface-100 hover:text-ink transition-colors duration-80 disabled:opacity-40"
    >
      <LogOut className="w-4 h-4 shrink-0" aria-hidden />
      <span>Sign out</span>
    </button>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { label: "All",      value: "" },
  { label: "Active",   value: "ACTIVE" },
  { label: "Upcoming", value: "UPCOMING" },
];

export function DriveStatusFilter({ currentStatus }: { currentStatus?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onClick(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  const active = currentStatus ?? "";

  return (
    <div className="flex gap-1 p-1 bg-surface-50 border border-border rounded-md">
      {TABS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onClick(value)}
          className={`px-3 h-7 rounded text-sm font-medium transition-colors duration-80 ${
            active === value
              ? "bg-accent text-white"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

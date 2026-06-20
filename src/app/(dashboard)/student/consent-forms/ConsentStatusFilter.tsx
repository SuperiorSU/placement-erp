"use client";

import { useRouter, useSearchParams } from "next/navigation";

const STATUSES = [
  { label: "All",      value: "" },
  { label: "Pending",  value: "PENDING" },
  { label: "Signed",   value: "SIGNED" },
  { label: "Declined", value: "DECLINED" },
];

export function ConsentStatusFilter({ currentStatus }: { currentStatus?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onClick(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set("status", value); } else { params.delete("status"); }
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  const active = currentStatus ?? "";

  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUSES.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onClick(value)}
          className={`px-3 h-8 rounded-md text-sm font-medium transition-colors duration-80 border ${
            active === value
              ? "bg-accent text-white border-accent"
              : "border-border text-ink-muted hover:text-ink hover:border-border-strong"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

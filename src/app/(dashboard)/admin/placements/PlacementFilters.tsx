"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { Search } from "lucide-react";

const TYPES = [
  { label: "All",    value: "" },
  { label: "Campus", value: "CAMPUS" },
  { label: "Manual", value: "MANUAL" },
  { label: "PPO",    value: "PPO" },
];

const CURRENT = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => `${CURRENT - 2 + i}-${CURRENT - 1 + i}`);

interface Props {
  currentType?: string;
  currentYear?: string;
  defaultQ?:    string;
}

export function PlacementFilters({ currentType, currentYear, defaultQ }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [, startTransition] = useTransition();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  function onSearch(e: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(timerRef.current);
    const val = e.target.value;
    timerRef.current = setTimeout(() => {
      startTransition(() => setParam("q", val || null));
    }, 300);
  }

  const active = currentType ?? "";

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex flex-wrap gap-1.5">
        {TYPES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setParam("type", value || null)}
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

      <select
        defaultValue={currentYear ?? ""}
        onChange={(e) => setParam("academicYear", e.target.value || null)}
        className="h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <option value="">All years</option>
        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>

      <div className="relative sm:ml-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" aria-hidden />
        <input
          type="search"
          placeholder="Search placements…"
          defaultValue={defaultQ}
          onChange={onSearch}
          className="h-9 pl-9 pr-3 rounded-md bg-surface-50 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>
    </div>
  );
}

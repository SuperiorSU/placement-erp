"use client";

import { useRouter, useSearchParams } from "next/navigation";

const CURRENT = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(CURRENT - 2 + i));

export function YearFilter({ currentYear }: { currentYear: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", e.target.value);
    router.push(`?${params.toString()}`);
  }

  return (
    <select
      value={currentYear}
      onChange={onChange}
      className="h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {YEARS.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  );
}

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "",          label: "All statuses" },
  { value: "UPCOMING",  label: "Upcoming"     },
  { value: "ACTIVE",    label: "Active"       },
  { value: "COMPLETED", label: "Completed"    },
  { value: "CANCELLED", label: "Cancelled"    },
];

export function DriveFilters() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync controlled input if URL changes externally (browser back/forward)
  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  const pushParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value); else params.delete(key);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParam("q", val), 300);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle pointer-events-none" aria-hidden />
        <input
          type="search"
          placeholder="Search drives, companies, locations…"
          value={search}
          onChange={handleSearchChange}
          className="w-full h-9 pl-9 pr-3 rounded-md text-sm bg-surface-50 border border-border text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80"
          aria-label="Search drives"
        />
      </div>

      {/* Status filter */}
      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => pushParam("status", e.target.value)}
        className="h-9 px-3 rounded-md text-sm bg-surface-50 border border-border text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80 min-w-[148px]"
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

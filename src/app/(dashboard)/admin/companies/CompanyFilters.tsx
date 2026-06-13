"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";

const CATEGORIES = [
  { value: "",              label: "All categories" },
  { value: "PRIME",         label: "Prime"          },
  { value: "AVERAGE",       label: "Average"        },
  { value: "BELOW_AVERAGE", label: "Below Avg"      },
];

export function CompanyFilters() {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [router, pathname, searchParams]);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-48 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle pointer-events-none" aria-hidden />
        <input
          type="search"
          placeholder="Search companies…"
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => setParam("q", e.target.value)}
          className="w-full h-9 pl-8 pr-3 rounded-md text-sm bg-surface-50 border border-border text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80"
          aria-label="Search companies"
        />
      </div>

      {/* Category filter */}
      <select
        value={searchParams.get("category") ?? ""}
        onChange={(e) => setParam("category", e.target.value)}
        className="h-9 px-3 rounded-md text-sm bg-surface-50 border border-border text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80"
        aria-label="Filter by category"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
    </div>
  );
}

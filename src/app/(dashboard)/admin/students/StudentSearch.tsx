"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { Search } from "lucide-react";

interface Props {
  defaultQ?:      string;
  defaultBranch?: string;
  branches:       string[];
}

export function StudentSearch({ defaultQ, defaultBranch, branches }: Props) {
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

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" aria-hidden />
        <input
          type="search"
          placeholder="Search students…"
          defaultValue={defaultQ}
          onChange={onSearch}
          className="w-full h-9 pl-9 pr-3 rounded-md bg-surface-50 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      {branches.length > 0 && (
        <select
          defaultValue={defaultBranch ?? ""}
          onChange={(e) => setParam("branch", e.target.value || null)}
          className="h-9 px-3 rounded-md bg-surface-50 border border-border text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      )}
    </div>
  );
}

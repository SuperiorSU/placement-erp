"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { Search } from "lucide-react";

interface Props {
  currentIsGeneric?: string;
  currentIsActive?: string;
  defaultQ?: string;
}

export function ConsentFormFilters({ currentIsGeneric, currentIsActive, defaultQ }: Props) {
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

  function toggleBool(key: string, current?: string) {
    if (current === "true") { setParam(key, "false"); }
    else if (current === "false") { setParam(key, null); }
    else { setParam(key, "true"); }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex gap-2">
        <button
          onClick={() => toggleBool("isGeneric", currentIsGeneric)}
          className={`px-3 h-8 rounded-md text-sm font-medium transition-colors duration-80 border ${
            currentIsGeneric
              ? currentIsGeneric === "true"
                ? "bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/30"
                : "bg-surface-100 text-ink border-border"
              : "border-border text-ink-muted hover:text-ink"
          }`}
        >
          {currentIsGeneric === "true" ? "Generic only" : currentIsGeneric === "false" ? "Drive-specific only" : "Type: All"}
        </button>

        <button
          onClick={() => toggleBool("isActive", currentIsActive)}
          className={`px-3 h-8 rounded-md text-sm font-medium transition-colors duration-80 border ${
            currentIsActive === "true"
              ? "bg-prime-soft text-prime border-prime/30"
              : currentIsActive === "false"
              ? "bg-surface-100 text-ink-muted border-border"
              : "border-border text-ink-muted hover:text-ink"
          }`}
        >
          {currentIsActive === "true" ? "Active only" : currentIsActive === "false" ? "Inactive only" : "Status: All"}
        </button>
      </div>

      <div className="relative sm:ml-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" aria-hidden />
        <input
          type="search"
          placeholder="Search forms…"
          defaultValue={defaultQ}
          onChange={onSearch}
          className="h-9 pl-9 pr-3 rounded-md bg-surface-50 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>
    </div>
  );
}

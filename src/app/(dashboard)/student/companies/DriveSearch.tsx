"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { Search } from "lucide-react";

export function DriveSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(timerRef.current);
    const val = e.target.value;
    timerRef.current = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (val) { params.set("q", val); } else { params.delete("q"); }
        params.delete("page");
        router.push(`?${params.toString()}`);
      });
    }, 300);
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" aria-hidden />
      <input
        type="search"
        placeholder="Search drives…"
        defaultValue={defaultValue}
        onChange={onChange}
        className="w-full h-9 pl-9 pr-3 rounded-md bg-surface-50 border border-border text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      />
    </div>
  );
}

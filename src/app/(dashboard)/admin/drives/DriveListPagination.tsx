"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  total: number;
  page:  number;
  limit: number;
}

export function DriveListPagination({ total, page, limit }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const pages        = Math.ceil(total / limit);

  const setPage = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(p));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  if (pages <= 1) return null;

  const getVisible = (): (number | "…")[] => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const out: (number | "…")[] = [1];
    if (page > 3) out.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) out.push(i);
    if (page < pages - 2) out.push("…");
    out.push(pages);
    return out;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="text-sm text-ink-muted tabular-nums">
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="h-8 w-8 rounded-md flex items-center justify-center text-ink-muted hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-80"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden />
        </button>

        {getVisible().map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="w-8 text-center text-sm text-ink-subtle">…</span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-md text-sm transition-colors duration-80 ${
                p === page
                  ? "bg-accent text-white font-medium"
                  : "text-ink-muted hover:bg-surface-100"
              }`}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => setPage(page + 1)}
          disabled={page === pages}
          className="h-8 w-8 rounded-md flex items-center justify-center text-ink-muted hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-80"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

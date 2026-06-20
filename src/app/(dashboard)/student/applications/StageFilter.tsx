"use client";

import { useRouter, useSearchParams } from "next/navigation";

const STAGES = [
  { label: "All",           value: "" },
  { label: "Registered",    value: "REGISTERED" },
  { label: "Shortlisted",   value: "SHORTLISTED" },
  { label: "Interviewed",   value: "INTERVIEWED" },
  { label: "Offered",       value: "OFFERED" },
  { label: "Not Selected",  value: "NOT_SELECTED" },
];

export function StageFilter({ currentStage }: { currentStage?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onClick(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set("stage", value); } else { params.delete("stage"); }
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  const active = currentStage ?? "";

  return (
    <div className="flex flex-wrap gap-1.5">
      {STAGES.map(({ label, value }) => (
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

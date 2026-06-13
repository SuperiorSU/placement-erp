interface BadgeVariant {
  bg:  string;
  text: string;
  dot: string;
}

const VARIANTS: Record<string, BadgeVariant> = {
  PRIME:         { bg: "bg-prime-soft",   text: "text-prime",    dot: "bg-prime"    },
  AVERAGE:       { bg: "bg-average-soft", text: "text-average",  dot: "bg-average"  },
  BELOW_AVERAGE: { bg: "bg-below-soft",   text: "text-below",    dot: "bg-below"    },
  UPCOMING:      { bg: "bg-average-soft", text: "text-average",  dot: "bg-average"  },
  ACTIVE:        { bg: "bg-prime-soft",   text: "text-prime",    dot: "bg-prime animate-pulse" },
  COMPLETED:     { bg: "bg-surface-100",  text: "text-ink-muted",dot: "bg-ink-subtle" },
  CANCELLED:     { bg: "bg-below-soft",   text: "text-below",    dot: "bg-below"    },
  REGISTERED:    { bg: "bg-[#6366F1]/10", text: "text-[#6366F1]",dot: "bg-[#6366F1]" },
  SHORTLISTED:   { bg: "bg-average-soft", text: "text-average",  dot: "bg-average"  },
  INTERVIEWED:   { bg: "bg-[#3B82F6]/10", text: "text-[#3B82F6]",dot: "bg-[#3B82F6]" },
  OFFERED:       { bg: "bg-prime-soft",   text: "text-prime",    dot: "bg-prime"    },
  NOT_SELECTED:  { bg: "bg-below-soft",   text: "text-below",    dot: "bg-below"    },
};

const LABELS: Record<string, string> = {
  PRIME:         "Prime",
  AVERAGE:       "Average",
  BELOW_AVERAGE: "Below Avg",
  UPCOMING:      "Upcoming",
  ACTIVE:        "Active",
  COMPLETED:     "Completed",
  CANCELLED:     "Cancelled",
  REGISTERED:    "Registered",
  SHORTLISTED:   "Shortlisted",
  INTERVIEWED:   "Interviewed",
  OFFERED:       "Offered",
  NOT_SELECTED:  "Not Selected",
};

interface BadgeProps {
  variant: string;
  label?:  string;
}

export function Badge({ variant, label }: BadgeProps) {
  const v = VARIANTS[variant] ?? VARIANTS["AVERAGE"];
  const l = label ?? LABELS[variant] ?? variant;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-widest ${v.bg} ${v.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.dot}`} aria-hidden />
      {l}
    </span>
  );
}

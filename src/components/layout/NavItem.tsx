"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  href:  string;
  icon:  LucideIcon;
  label: string;
}

export function NavItem({ href, icon: Icon, label }: NavItemProps) {
  const pathname = usePathname();
  // Root dashboard hrefs (/admin, /super-admin, /student) must use exact match
  // to avoid staying active on every sub-route beneath them.
  const isDashboardRoot = (href.match(/\//g) ?? []).length === 1;
  const isActive =
    pathname === href ||
    (!isDashboardRoot && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 h-9 rounded-md text-sm transition-colors duration-80 ${
        isActive
          ? "bg-accent-soft text-accent font-medium"
          : "text-ink-muted hover:bg-surface-100 hover:text-ink"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}

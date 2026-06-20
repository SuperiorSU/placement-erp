"use client";

import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarDays,
  FileText,
  Briefcase,
  BarChart2,
  ShieldCheck,
  GraduationCap,
  ClipboardList,
} from "lucide-react";
import { NavItem } from "./NavItem";
import { SignOutButton } from "./SignOutButton";

const ADMIN_NAV = [
  { href: "/admin",               icon: LayoutDashboard, label: "Dashboard"     },
  { href: "/admin/companies",     icon: Building2,       label: "Companies"     },
  { href: "/admin/drives",        icon: CalendarDays,    label: "Drives"        },
  { href: "/admin/students",      icon: Users,           label: "Students"      },
  { href: "/admin/internships",   icon: Briefcase,       label: "Internships"   },
  { href: "/admin/consent-forms", icon: FileText,        label: "Consent Forms" },
  { href: "/admin/reports",       icon: BarChart2,       label: "Reports"       },
];

const SUPER_ADMIN_NAV = [
  { href: "/super-admin",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/super-admin/analytics",icon: BarChart2,       label: "Analytics" },
  { href: "/super-admin/admins",   icon: ShieldCheck,     label: "Admins"    },
];

const STUDENT_NAV = [
  { href: "/student",               icon: LayoutDashboard, label: "Dashboard"     },
  { href: "/student/companies",     icon: Building2,       label: "Companies"     },
  { href: "/student/applications",  icon: ClipboardList,   label: "Applications"  },
  { href: "/student/consent-forms", icon: FileText,        label: "Consent Forms" },
];

interface SidebarProps {
  role: string;
}

export function Sidebar({ role }: SidebarProps) {
  const nav =
    role === "SUPER_ADMIN" ? SUPER_ADMIN_NAV :
    role === "ADMIN"       ? ADMIN_NAV :
                             STUDENT_NAV;

  const roleLabel =
    role === "SUPER_ADMIN" ? "Super Admin" :
    role === "ADMIN"       ? "Admin" :
                             "Student";

  return (
    <aside className="w-60 shrink-0 border-r border-border flex flex-col h-full bg-surface">
      {/* Wordmark */}
      <div className="h-14 flex items-center px-4 border-b border-border shrink-0">
        <span className="font-display text-base font-bold text-ink tracking-tight">
          Placement ERP
        </span>
      </div>

      {/* Role label */}
      <div className="px-4 pt-4 pb-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
          {roleLabel}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {nav.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 border-t border-border shrink-0">
        <SignOutButton />
      </div>
    </aside>
  );
}

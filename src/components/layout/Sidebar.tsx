"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/support-form", label: "Support Form", icon: ClipboardList },
  { href: "/evaluations", label: "Evaluations", icon: FileText },
  { href: "/admin/users", label: "Admin", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-col bg-sidebar text-sidebar-text">
      <div className="px-5 py-4 text-lg font-bold tracking-tight">EES 2.0</div>
      <nav className="flex flex-col gap-1 px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2 text-sm",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-text/80 hover:bg-white/5",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

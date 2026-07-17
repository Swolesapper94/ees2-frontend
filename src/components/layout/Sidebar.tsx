"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Star,
  Users,
  ClipboardList,
  FileText,
  HandHelping,
  Network,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SidebarProps {
  /** Show "My Soldiers" nav item — only when user has active chains as rater/SR. Defaults true. */
  hasSoldiers?: boolean;
  /** Show "Commander's Access" section — only for COMMANDER role. Defaults false. */
  isCommander?: boolean;
  /** Identity and Access Administration is limited to application administrators. */
  canViewAdmin?: boolean;
}

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: typeof LayoutDashboard }) {
  const pathname = usePathname();
  const isChildRoute = pathname.startsWith(href + "/");
  const active = pathname === href || isChildRoute;

  return (
    <Link
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
}

function Divider() {
  return <div className="my-1 mx-2 border-t border-white/10" />;
}

export function Sidebar({ hasSoldiers = true, isCommander = false, canViewAdmin = false }: SidebarProps) {
  return (
    <aside className="flex w-60 flex-col bg-sidebar text-sidebar-text">
      <div className="px-5 py-4 text-lg font-bold tracking-tight">EES 2.0</div>
      <nav className="flex flex-col gap-0.5 px-2">
        <NavItem href="/dashboard" label="Dashboard" icon={LayoutDashboard} />
        <NavItem href="/evaluations" label="My Eval" icon={Star} />
        {hasSoldiers && (
          <NavItem href="/my-soldiers" label="My Soldiers" icon={Users} />
        )}
        <NavItem href="/support-form" label="Support Form" icon={ClipboardList} />
        <NavItem href="/rating-scheme" label="Rating Scheme" icon={Network} />
        <NavItem href="/access-assistance" label="Access and Assistance" icon={HandHelping} />

        <Divider />

        {isCommander && (
          <>
            <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-text/40">
              Commander&apos;s Access
            </p>
            <NavItem href="/commander" label="Formation Overview" icon={Users} />
            <Divider />
          </>
        )}

        <NavItem href="/all-evaluations" label="All Evaluations" icon={FileText} />
        {canViewAdmin && <NavItem href="/admin/identity-access" label="Identity and Access" icon={Settings} />}
      </nav>
    </aside>
  );
}


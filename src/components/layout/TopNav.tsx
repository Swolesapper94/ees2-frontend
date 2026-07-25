"use client";

import { useState } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { SupportChatModal } from "@/components/support/SupportChatModal";
import { LifeBuoy, Menu } from "lucide-react";

export function TopNav({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onOpenMenu} className="rounded-sm p-2 text-foreground hover:bg-muted md:hidden" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-foreground md:hidden">MERIT</span>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        {/* Anchored trigger + panel — pinned under the header, not a floating widget */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSupportOpen((prev) => !prev)}
            aria-expanded={supportOpen}
            className="inline-flex h-9 items-center gap-2 rounded-sm border border-sky-200 bg-sky-50 px-2.5 text-sm font-medium text-sky-900 transition-colors hover:bg-sky-100"
            aria-label="Open MERIT Support"
            title="Open MERIT Support"
          >
            <LifeBuoy className="h-4 w-4" />
            <span className="hidden sm:inline">MERIT Support</span>
          </button>
          {supportOpen && <SupportChatModal onClose={() => setSupportOpen(false)} />}
        </div>
        <NotificationBell />
        <ProfileMenu onOpenSupport={() => setSupportOpen(true)} />
      </div>
    </header>
  );
}


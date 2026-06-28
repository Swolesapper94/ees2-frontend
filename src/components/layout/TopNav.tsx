"use client";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ProfileMenu } from "@/components/layout/ProfileMenu";

export function TopNav() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="text-sm font-medium text-muted-foreground" />
      <div className="flex items-center gap-3">
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}


"use client";

import { Bell, User } from "lucide-react";

export function TopNav() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="text-sm font-medium text-muted-foreground" />
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Account"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"
        >
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

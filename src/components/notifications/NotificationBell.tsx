"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationPanel } from "./NotificationPanel";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, dismiss, markRead, markAllRead, clearAll } =
    useNotifications();

  function toggle() {
    setOpen((prev) => !prev);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={toggle}
        className="relative flex items-center justify-center rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-od-green)] text-[9px] font-bold text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          notifications={notifications}
          onDismiss={dismiss}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onClearAll={clearAll}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

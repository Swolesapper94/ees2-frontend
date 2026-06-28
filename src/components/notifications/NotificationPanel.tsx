"use client";

import { useRef, useEffect } from "react";
import { BellOff, CheckCheck, Trash2 } from "lucide-react";
import { NotificationItem } from "./NotificationItem";
import type { AppNotification } from "@/hooks/useNotifications";

interface NotificationPanelProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function NotificationPanel({
  notifications,
  onDismiss,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onClose,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Slight delay so the open-click doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-md border border-border bg-card shadow-[var(--shadow-panel)] sm:w-96"
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-[var(--color-od-green)] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              title="Mark all as read"
              onClick={onMarkAllRead}
              className="rounded-sm p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              title="Clear all"
              onClick={onClearAll}
              className="rounded-sm p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-border/50">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <BellOff className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onDismiss={onDismiss}
              onMarkRead={onMarkRead}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-border px-4 py-2 text-center">
          <span className="text-xs text-muted-foreground">
            Showing {notifications.length} active notification
            {notifications.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

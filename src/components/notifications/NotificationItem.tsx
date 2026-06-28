"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { AppNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils/cn";

const CATEGORY_COLORS: Record<AppNotification["category"], string> = {
  EVAL_LIFECYCLE: "bg-[var(--status-progress)]",
  MILESTONE: "bg-[var(--status-overdue)]",
  COLLABORATION: "bg-[var(--color-navy)]",
  DELEGATE: "bg-amber-500",
  SYSTEM: "bg-muted-foreground",
};

const CATEGORY_LABELS: Record<AppNotification["category"], string> = {
  EVAL_LIFECYCLE: "Evaluation",
  MILESTONE: "Milestone",
  COLLABORATION: "Collaboration",
  DELEGATE: "Delegate",
  SYSTEM: "System",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface NotificationItemProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
}

export function NotificationItem({
  notification: n,
  onDismiss,
  onMarkRead,
}: NotificationItemProps) {
  const router = useRouter();
  const isUnread = !n.readAt;

  function handleAction() {
    if (isUnread) onMarkRead(n.id);
    if (n.actionUrl) router.push(n.actionUrl);
  }

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-3 transition-colors",
        isUnread ? "bg-muted/60" : "bg-background",
        "hover:bg-muted/40",
      )}
    >
      {/* Unread dot */}
      {isUnread && (
        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--color-od-green)]" />
      )}
      {!isUnread && <span className="mt-1.5 h-2 w-2 flex-shrink-0" />}

      <div className="min-w-0 flex-1">
        {/* Category pill + time */}
        <div className="mb-0.5 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white",
              CATEGORY_COLORS[n.category],
            )}
          >
            {CATEGORY_LABELS[n.category]}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {timeAgo(n.createdAt)}
          </span>
        </div>

        {/* Title */}
        <p className="text-sm font-medium leading-tight text-foreground">
          {n.title}
        </p>

        {/* Message */}
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-2">
          {n.message}
        </p>

        {/* Action button */}
        {n.actionUrl && n.actionLabel && (
          <button
            type="button"
            onClick={handleAction}
            className="mt-1.5 text-xs font-medium text-[var(--color-od-green)] hover:underline focus:outline-none"
          >
            {n.actionLabel} →
          </button>
        )}
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(n.id);
        }}
        className="mt-0.5 flex-shrink-0 rounded-sm p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100 focus:outline-none"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

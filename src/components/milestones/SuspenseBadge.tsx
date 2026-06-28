"use client";

import { cn } from "@/lib/utils/cn";

export type MilestoneStatusType = "UPCOMING" | "DUE_SOON" | "OVERDUE" | "COMPLETE" | "WAIVED";

const STATUS_CONFIG: Record<MilestoneStatusType, { label: string; className: string; icon: string }> = {
  UPCOMING: { label: "Upcoming", className: "bg-gray-100 text-gray-600 border-gray-200", icon: "○" },
  DUE_SOON: { label: "Due Soon", className: "bg-amber-50 text-amber-700 border-amber-200", icon: "⚠" },
  OVERDUE:  { label: "Overdue",  className: "bg-red-50 text-red-700 border-red-200", icon: "✗" },
  COMPLETE: { label: "Complete", className: "bg-green-50 text-green-700 border-green-200", icon: "✓" },
  WAIVED:   { label: "Waived",   className: "bg-slate-50 text-slate-500 border-slate-200", icon: "—" },
};

interface SuspenseBadgeProps {
  status: MilestoneStatusType;
  className?: string;
  showIcon?: boolean;
}

export function SuspenseBadge({ status, className, showIcon = true }: SuspenseBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium tracking-wide uppercase rounded-sm border",
        config.className,
        className,
      )}
    >
      {showIcon && <span>{config.icon}</span>}
      {config.label}
    </span>
  );
}

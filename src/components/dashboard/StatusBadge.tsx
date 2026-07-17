import { cn } from "@/lib/utils/cn";

/**
 * Computed "NOT_STARTED" state (no DB row) is also accepted so
 * callers can pass it without needing a separate type.
 */
export type DisplayStatus =
  | "NOT_STARTED"
  | "DRAFT"
  | "RATER_IN_PROGRESS"
  | "PENDING_SENIOR_RATER"
  | "PENDING_SOLDIER_ACK"
  | "PENDING_SUPPLEMENTARY_REVIEW"
  | "PENDING_FINAL_FORM_REVIEW"
  | "COMPLETE"
  | "SUBMITTED"
  | "ACCEPTED"
  | "RETURNED";

interface StatusConfig {
  icon: string;
  label: string;
  /** Tailwind text-* class using our custom status utilities */
  colorClass: string;
}

const CONFIG: Record<DisplayStatus, StatusConfig> = {
  NOT_STARTED:                  { icon: "○",   label: "Not Started",        colorClass: "text-status-not-started" },
  DRAFT:                        { icon: "✏",   label: "Draft",              colorClass: "text-status-draft" },
  RATER_IN_PROGRESS:            { icon: "▶",   label: "Rater In Progress",  colorClass: "text-status-progress" },
  PENDING_SENIOR_RATER:         { icon: "⏳",  label: "Pending Senior Rater", colorClass: "text-status-pending" },
  PENDING_SOLDIER_ACK:          { icon: "✉",   label: "Pending Soldier Ack", colorClass: "text-status-pending" },
  PENDING_SUPPLEMENTARY_REVIEW: { icon: "👁",  label: "Pending Review",      colorClass: "text-status-pending" },
  PENDING_FINAL_FORM_REVIEW:    { icon: "□",   label: "Final Form Review",   colorClass: "text-status-pending" },
  COMPLETE:                     { icon: "✓",   label: "Complete",           colorClass: "text-status-complete" },
  SUBMITTED:                    { icon: "✓✓",  label: "Submitted",          colorClass: "text-status-submitted" },
  ACCEPTED:                     { icon: "✓✓✓", label: "Accepted",           colorClass: "text-status-accepted" },
  RETURNED:                     { icon: "✗",   label: "Returned",           colorClass: "text-status-overdue" },
};

interface StatusBadgeProps {
  status: DisplayStatus;
  className?: string;
}

/** Straight-edge status badge using the design-system color tokens. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { icon, label, colorClass } = CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5",
        "text-xs font-medium tracking-wide uppercase rounded-sm border border-current",
        "transition-colors duration-150",
        colorClass,
        className,
      )}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}

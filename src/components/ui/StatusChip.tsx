import { Check, CircleDot, Clock, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { transitions } from "@/lib/utils/motion";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASS: Record<StatusTone, string> = {
  success: "bg-status-tint-complete text-status-complete",
  warning: "bg-status-tint-pending text-status-pending",
  danger: "bg-status-tint-overdue text-status-overdue",
  info: "bg-status-tint-progress text-status-progress",
  neutral: "bg-muted text-muted-foreground",
};

const TONE_ICON: Record<StatusTone, typeof Check> = {
  success: Check,
  warning: Clock,
  danger: X,
  info: CircleDot,
  neutral: Circle,
};

/**
 * Keyword-based tone inference for the many small status enums across the
 * app (GoalApprovalStatus, RatingSchemeStatus, AccessGrant status,
 * ApplicationAccessStatus, etc.) that don't share EvalStatus's vocabulary
 * and so can't reuse StatusBadge's DisplayStatus map directly.
 */
export function statusTone(status: string): StatusTone {
  const value = status.toUpperCase();
  if (/(REJECT|RETURN|SUSPEND|REVOK|DECLIN|QUARANTIN|FAIL|OVERDUE|DENIED)/.test(value)) return "danger";
  if (/(APPROV|PUBLISH|ACCEPT|COMPLETE|ACTIVE|CONFIRM|CURRENT|SIGNED)/.test(value)) return "success";
  if (/(PENDING|DRAFT|REVIEW|WAIT)/.test(value)) return "warning";
  if (/(PROGRESS|SUBMIT)/.test(value)) return "info";
  return "neutral";
}

interface StatusChipProps {
  status: string;
  /** Override the inferred tone when the caller knows better than the keyword heuristic. */
  tone?: StatusTone;
  /** Override the display label; defaults to a humanized version of `status`. */
  label?: string;
  className?: string;
}

/**
 * Generic colored status chip for the many non-EvalStatus status enums in
 * the app. Always pairs an icon + text label with color (WCAG 1.4.1 — color
 * is never the only signal). For evaluation lifecycle status specifically,
 * prefer StatusBadge, which has an exact icon/label per EvalStatus value.
 */
export function StatusChip({ status, tone, label, className }: StatusChipProps) {
  const resolvedTone = tone ?? statusTone(status);
  const Icon = TONE_ICON[resolvedTone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium tracking-wide",
        transitions.badge,
        TONE_CLASS[resolvedTone],
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {label ?? status.replaceAll("_", " ")}
    </span>
  );
}

import { cn } from "@/lib/utils/cn";

interface CountdownLabelProps {
  dueDate: string | null;
  className?: string;
}

/**
 * Renders a human-readable countdown to a due date:
 *   "28 days" / "Today" / "OVERDUE 3 days" / "—" (no due date)
 */
export function CountdownLabel({ dueDate, className }: CountdownLabelProps) {
  if (!dueDate) {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays === 0) {
    return (
      <span className={cn("font-semibold text-status-pending", className)}>
        Today
      </span>
    );
  }

  if (diffDays < 0) {
    return (
      <span className={cn("font-semibold text-status-overdue", className)}>
        OVERDUE {Math.abs(diffDays)}d
      </span>
    );
  }

  if (diffDays <= 7) {
    return (
      <span className={cn("text-status-pending", className)}>
        {diffDays}d
      </span>
    );
  }

  return (
    <span className={cn("text-muted-foreground", className)}>{diffDays}d</span>
  );
}

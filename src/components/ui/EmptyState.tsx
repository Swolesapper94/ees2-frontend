import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Consistent empty-state pattern: icon + a clear statement of what's missing
 * + (optionally) a hint at what to do about it. Never celebratory, never
 * more than a one-line nudge — this is a coaching moment, not a mascot.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-sm border border-dashed border-border p-8 text-center", className)}>
      <Icon className="mx-auto h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

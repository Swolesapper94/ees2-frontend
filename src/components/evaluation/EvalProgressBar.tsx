"use client";

export interface EvalProgressBarProps {
  completed: number;
  total: number;
}

export function EvalProgressBar({ completed, total }: EvalProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {completed} of {total} sections complete
      </p>
    </div>
  );
}

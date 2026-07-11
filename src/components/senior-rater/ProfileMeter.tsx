"use client";

import { cn } from "@/lib/utils/cn";

export interface ProfileMeterProps {
  /** Count of Most Qualified ratings the senior rater has given for this rank. */
  mostQualified: number;
  /** Total rated soldiers at this rank in the senior rater's profile. */
  total: number;
  /** AR 623-3 cap for this grade — 24% NCO, 50% Officer/WO. */
  capPercent: number;
}

/**
 * Visualizes the senior rater's MQ profile constraint. AR 623-3 caps NCOs at
 * 24% MOST QUALIFIED per grade, Officers/WOs at 50%.
 */
export function ProfileMeter({ mostQualified, total, capPercent }: ProfileMeterProps) {
  const ratio = total > 0 ? mostQualified / total : 0;
  const overLimit = ratio * 100 > capPercent;
  const pct = Math.round(ratio * 100);

  return (
    <div className="space-y-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all",
            overLimit ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p
        className={cn(
          "text-xs",
          overLimit ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {mostQualified}/{total} Most Qualified ({pct}%
        {overLimit ? ` — exceeds ${capPercent}% limit` : ""})
      </p>
    </div>
  );
}

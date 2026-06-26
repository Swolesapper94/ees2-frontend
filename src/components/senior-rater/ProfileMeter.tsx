"use client";

import { cn } from "@/lib/utils/cn";
import { SR_MQ_THRESHOLD } from "@/lib/utils/form-constants";

export interface ProfileMeterProps {
  /** Count of Most Qualified ratings the senior rater has given for this rank. */
  mostQualified: number;
  /** Total rated soldiers at this rank in the senior rater's profile. */
  total: number;
}

/**
 * Visualizes the senior rater's MQ profile constraint. MQ ratings cannot
 * exceed 50% of the profile. See start.md §7.
 */
export function ProfileMeter({ mostQualified, total }: ProfileMeterProps) {
  const ratio = total > 0 ? mostQualified / total : 0;
  const overLimit = ratio > SR_MQ_THRESHOLD;
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
        {overLimit ? " — exceeds 50% limit" : ""})
      </p>
    </div>
  );
}

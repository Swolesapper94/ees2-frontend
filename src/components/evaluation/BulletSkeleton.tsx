"use client";

import { cn } from "@/lib/utils/cn";

export interface BulletSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Placeholder bullet cards shown while AI is crafting suggestions. Mirrors
 * the shape of BulletCard / AIBulletPanel entries so the layout doesn't
 * jump once real content arrives.
 */
export function BulletSkeleton({ count = 3, className }: BulletSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded border border-border bg-card p-3"
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="h-3 w-6 rounded bg-muted" />
            <div className="h-3 w-14 rounded bg-muted" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-4/5 rounded bg-muted" />
          </div>
        </div>
      ))}
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Drafting suggestions — review each one before it counts.
      </p>
    </div>
  );
}

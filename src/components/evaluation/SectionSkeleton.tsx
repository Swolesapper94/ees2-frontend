"use client";

import { cn } from "@/lib/utils/cn";

export interface SectionSkeletonProps {
  className?: string;
}

/**
 * Full-section placeholder shown while an evaluation section is loading.
 * Mirrors the layout of SectionEditor (title, rating box, bullet list)
 * so the page doesn't jump once real content arrives.
 */
export function SectionSkeleton({ className }: SectionSkeletonProps) {
  return (
    <div className={cn("animate-pulse space-y-5", className)} aria-busy="true" aria-live="polite">
      <div>
        <div className="mb-2 h-3 w-16 rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-8 w-20 rounded bg-muted" />
          <div className="h-8 w-20 rounded bg-muted" />
          <div className="h-8 w-20 rounded bg-muted" />
          <div className="h-8 w-20 rounded bg-muted" />
        </div>
      </div>

      <div>
        <div className="mb-2 h-3 w-40 rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-12 w-full rounded border border-border bg-card" />
          <div className="h-12 w-full rounded border border-border bg-card" />
        </div>
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils/cn";
import type { BulletSource } from "@/types/evaluation";

export interface BulletCardProps {
  text: string;
  source: BulletSource;
  onEdit?: () => void;
  onRemove?: () => void;
}

const SOURCE_BADGE: Record<BulletSource, { label: string; className: string }> =
  {
    HUMAN: { label: "Written", className: "bg-emerald-100 text-emerald-800" },
    AI_MODIFIED: { label: "AI · edited", className: "bg-amber-100 text-amber-800" },
    AI_UNMODIFIED: { label: "AI · as-is", className: "bg-red-100 text-red-800" },
  };

/**
 * A committed bullet on the form. The source badge keeps provenance visible —
 * unedited AI output is deliberately flagged. See start.md §6.
 */
export function BulletCard({ text, source, onEdit, onRemove }: BulletCardProps) {
  const badge = SOURCE_BADGE[source];
  return (
    <div className="flex items-start justify-between gap-3 rounded-sm border border-border bg-card p-3">
      <p className="text-sm">{text}</p>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
            badge.className,
          )}
        >
          {badge.label}
        </span>
        {onEdit ? (
          <button type="button" onClick={onEdit} className="text-xs text-primary">
            Edit
          </button>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-destructive"
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}

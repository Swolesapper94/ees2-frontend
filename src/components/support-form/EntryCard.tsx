"use client";

import { cn } from "@/lib/utils/cn";
import type { EntryType } from "@/types/evaluation";

export interface EntryCardProps {
  type: EntryType;
  text: string;
  createdAt: string;
  onEdit?: () => void;
}

export function EntryCard({ type, text, createdAt, onEdit }: EntryCardProps) {
  return (
    <div className="rounded-sm border border-border bg-card p-3">
      <div className="mb-1 flex items-center justify-between">
        <span
          className={cn(
            "rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
            type === "OBJECTIVE"
              ? "bg-blue-100 text-blue-800"
              : "bg-emerald-100 text-emerald-800",
          )}
        >
          {type === "OBJECTIVE" ? "Objective" : "Accomplishment"}
        </span>
        <span className="text-xs text-muted-foreground">{createdAt}</span>
      </div>
      <p className="text-sm">{text}</p>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="mt-1 text-xs text-primary"
        >
          Edit
        </button>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { BulletProvenanceEntry, BulletSource } from "@/types/evaluation";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface BulletCardProps {
  text: string;
  source: BulletSource;
  /** Provenance chain for AI-sourced bullets (MVP audit 5.9) — null for
   * HUMAN bullets or bullets predating this feature. */
  provenance?: BulletProvenanceEntry | null;
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
 * unedited AI output is deliberately flagged. See start.md §6. When a
 * provenance chain exists (AI-sourced bullets), a "View source" toggle shows
 * the original source entry text + artifact captions this bullet was
 * generated from — resolved from the immutable snapshot captured at
 * generation time, so it stays accurate even if the entry is later edited
 * or deleted.
 */
export function BulletCard({ text, source, provenance, onEdit, onRemove }: BulletCardProps) {
  const badge = SOURCE_BADGE[source];
  const [showSource, setShowSource] = useState(false);
  const snapshot = provenance?.sourceSnapshot;

  return (
    <div className="rounded-sm border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
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

      {snapshot && snapshot.length > 0 && (
        <div className="mt-2 border-t border-border pt-2">
          <button
            type="button"
            onClick={() => setShowSource((v) => !v)}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            {showSource ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            View evidence trail ({snapshot.length} source{snapshot.length === 1 ? "" : "s"})
          </button>
          {showSource && (
            <div className="mt-1.5 space-y-1.5 rounded bg-muted/50 p-2">
              {snapshot.map((s) => (
                <div key={s.entryId} className="text-[11px] text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {s.sourceType === "PERFORMANCE_OBSERVATION" ? "Rater observation" : s.sourceType === "AI_EXTRACTED_ENTRY" ? "Reviewed uploaded fact" : "Soldier accomplishment"}
                    {s.sourceLabel ? ` - ${s.sourceLabel}` : ""}
                    {s.occurredAt ? ` - ${new Date(s.occurredAt).toLocaleDateString()}` : ""}
                  </p>
                  <p>{s.rawText}</p>
                  {s.goal && <p className="mt-0.5">Goal context: {s.goal.title}</p>}
                  {s.counselingState && <p className="mt-0.5">Counseling state: {s.counselingState === "RELEASED_IN_COUNSELING" ? "released through counseling" : "private rater observation"}</p>}
                  {s.artifactCaptions.length > 0 && (
                    <p className="mt-0.5 italic">
                      Evidence: {s.artifactCaptions.join("; ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


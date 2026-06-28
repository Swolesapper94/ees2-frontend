"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import type {
  AIBulletSuggestion,
  AIBulletStatus,
  SectionKey,
} from "@/types/evaluation";
import { cn } from "@/lib/utils/cn";

interface AIBulletPanelProps {
  evalId: string;
  sectionKey: SectionKey;
  suggestions: AIBulletSuggestion[];
  /** Called when a bullet is accepted (original or edited) — adds to final bullets */
  onAccept: (text: string) => void;
  /** Called after any status mutation so parent can re-sync */
  onSuggestionsChange: (updated: AIBulletSuggestion[]) => void;
}

const CONFIDENCE_STYLES: Record<string, string> = {
  HIGH: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
  LOW: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const STATUS_LABEL: Record<AIBulletStatus, string> = {
  PENDING_REVIEW: "",
  ACCEPTED: "✓ Used",
  EDITED: "✏ Used (edited)",
  REJECTED: "✗ Rejected",
};

export function AIBulletPanel({
  evalId,
  sectionKey,
  suggestions,
  onAccept,
  onSuggestionsChange,
}: AIBulletPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  // Only show bullets for this section that are pending review or acted-on
  const sectionSuggestions = suggestions
    .filter((s) => s.sectionKey === sectionKey)
    .sort((a, b) => a.rank - b.rank);

  const pendingCount = sectionSuggestions.filter(
    (s) => s.status === "PENDING_REVIEW",
  ).length;

  async function mutate(
    bulletId: string,
    action: AIBulletStatus,
    edited?: string,
  ) {
    setLoading(bulletId);
    try {
      const updated = await api.patch<AIBulletSuggestion>(
        `/support-form-uploads/bullets/${bulletId}`,
        { action, editedText: edited },
      );
      const newSuggestions = suggestions.map((s) =>
        s.id === bulletId ? { ...s, ...updated } : s,
      );
      onSuggestionsChange(newSuggestions);

      if (action === "ACCEPTED") {
        const bullet = suggestions.find((s) => s.id === bulletId);
        if (bullet) onAccept(bullet.text);
      }
      if (action === "EDITED" && edited) {
        onAccept(edited);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
      setEditingId(null);
    }
  }

  if (sectionSuggestions.length === 0) {
    return (
      <div className="rounded border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        No AI suggestions yet.
        <br />
        Upload a support form or use "Generate from scratch" below.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pendingCount > 0 && (
        <p className="text-xs text-amber-700 font-medium">
          {pendingCount} suggestion{pendingCount !== 1 ? "s" : ""} need review before section can be finalized.
        </p>
      )}

      {sectionSuggestions.map((s) => {
        const isActedOn = s.status !== "PENDING_REVIEW";
        const isEditing = editingId === s.id;

        return (
          <div
            key={s.id}
            className={cn(
              "rounded border p-3 text-sm transition-all",
              isActedOn ? "opacity-60 bg-muted" : "bg-card border-border",
            )}
          >
            {/* Header row: rank + confidence */}
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">
                #{s.rank}
              </span>
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  CONFIDENCE_STYLES[s.confidence] ?? CONFIDENCE_STYLES.MEDIUM,
                )}
              >
                {s.confidence}
              </span>
              {isActedOn && (
                <span className="ml-auto text-xs font-medium text-muted-foreground">
                  {STATUS_LABEL[s.status]}
                </span>
              )}
            </div>

            {/* Bullet text or inline editor */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  className="w-full rounded border border-border bg-background p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={3}
                  maxLength={300}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {editText.length}/200 chars
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!editText.trim() || editText.length > 200}
                      onClick={() => mutate(s.id, "EDITED", editText)}
                      className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
                    >
                      Save & Use
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-foreground leading-snug">{s.editedText ?? s.text}</p>
            )}

            {/* Action buttons — only show for PENDING_REVIEW */}
            {!isActedOn && !isEditing && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={loading === s.id}
                  onClick={() => mutate(s.id, "ACCEPTED")}
                  className="flex items-center gap-1 rounded bg-[#1A3010] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#243e17] disabled:opacity-50"
                >
                  ✓ Use
                </button>
                <button
                  type="button"
                  disabled={loading === s.id}
                  onClick={() => {
                    setEditText(s.text);
                    setEditingId(s.id);
                  }}
                  className="flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                >
                  ✏ Edit
                </button>
                <button
                  type="button"
                  disabled={loading === s.id}
                  onClick={() => mutate(s.id, "REJECTED")}
                  className="flex items-center gap-1 rounded border border-destructive/30 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"
                >
                  ✗
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import type {
  AIBulletSuggestion,
  SectionKey,
  SupportFormEntry,
} from "@/types/evaluation";
import { AlertTriangle, Award, FileText, Image as ImageIcon, Paperclip, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { BulletSkeleton } from "./BulletSkeleton";

const ARTIFACT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CERTIFICATE: Award,
  SCORE_SHEET: FileText,
  PHOTO: ImageIcon,
  DOCUMENT: FileText,
  OTHER: Paperclip,
};

const CONFIRMATION_BADGE: Record<
  SupportFormEntry["confirmationStatus"],
  { label: string; className: string }
> = {
  UNREVIEWED: { label: "Unreviewed", className: "bg-zinc-100 text-zinc-600" },
  CONFIRMED: { label: "Confirmed", className: "bg-emerald-100 text-emerald-800" },
  NEEDS_CLARIFICATION: { label: "Needs clarification", className: "bg-amber-100 text-amber-800" },
  NOT_USED: { label: "Not used", className: "bg-zinc-200 text-zinc-600" },
};

export interface SoldierAccomplishmentsPanelProps {
  evalId: string;
  sectionKey: SectionKey;
  entries: SupportFormEntry[];
  soldierInfo: { rank: string; mos: string; dutyTitle: string; formType: string };
  onSuggestions: (suggestions: AIBulletSuggestion[]) => void;
}

/**
 * Widget 3-5 of the "soldier logs it, rater generates from it" pipeline:
 * shows this section's ACCOMPLISHMENT entries from the soldier's support
 * form (with artifact proof), lets the rater pick which apply, and
 * generates bullets from the selection via generate-from-entries.
 */
export function SoldierAccomplishmentsPanel({
  evalId,
  sectionKey,
  entries,
  soldierInfo,
  onSuggestions,
}: SoldierAccomplishmentsPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flagWarning, setFlagWarning] = useState(false);
  const [confirmations, setConfirmations] = useState<Record<string, SupportFormEntry>>({});
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [clarifyingId, setClarifyingId] = useState<string | null>(null);
  const [clarifyNote, setClarifyNote] = useState("");

  const sectionEntries = entries.filter(
    (e) => e.section === sectionKey && e.entryType === "ACCOMPLISHMENT",
  );

  if (sectionEntries.length === 0) return null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirm(
    entryId: string,
    status: SupportFormEntry["confirmationStatus"],
    note?: string,
  ) {
    setConfirmingId(entryId);
    try {
      const updated = await api.patch<SupportFormEntry>(
        `/support-forms/entries/${entryId}/confirm`,
        { status, clarificationNote: note },
      );
      setConfirmations((prev) => ({ ...prev, [entryId]: updated }));
      setClarifyingId(null);
      setClarifyNote("");
    } catch {
      setError("Failed to update confirmation status — try again.");
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleGenerate() {
    if (selected.size === 0) return;
    setGenerating(true);
    setError(null);
    setFlagWarning(false);
    try {
      const result = await api.post<{
        suggestions: AIBulletSuggestion[];
        hasFlaggedArtifacts: boolean;
      }>(`/support-form-uploads/${evalId}/generate-from-entries`, {
        sectionKey,
        entryIds: Array.from(selected),
      });
      onSuggestions(result.suggestions);
      setFlagWarning(result.hasFlaggedArtifacts);
      setSelected(new Set());
    } catch {
      setError("Failed to generate bullets — try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-2 rounded border border-border p-3">
      <p className="text-xs font-medium text-foreground">
        Soldier Accomplishments — {sectionEntries.length} logged for this section
      </p>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {sectionEntries.map((rawEntry) => {
          const entry = confirmations[rawEntry.id] ?? rawEntry;
          const hasFlagged = entry.artifacts.some((a) => a.flaggedByServiceMember);
          const badge = CONFIRMATION_BADGE[entry.confirmationStatus];
          const isBusy = confirmingId === entry.id;
          const isClarifying = clarifyingId === entry.id;
          return (
            <div
              key={entry.id}
              className={cn(
                "rounded border p-2 text-xs",
                selected.has(entry.id)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent/40",
              )}
            >
              <label className="flex cursor-pointer gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(entry.id)}
                  onChange={() => toggle(entry.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p>{entry.rawText}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                        badge.className,
                      )}
                    >
                      {badge.label}
                    </span>
                  </div>
                  {entry.artifacts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.artifacts.map((a) => {
                        const Icon = ARTIFACT_ICONS[a.type] ?? Paperclip;
                        return (
                          <a
                            key={a.id}
                            href={a.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title={a.aiCaption ?? undefined}
                            className={cn(
                              "flex items-center gap-1 rounded border px-1.5 py-0.5",
                              a.flaggedByServiceMember
                                ? "border-amber-300 bg-amber-50 text-amber-800"
                                : "border-border bg-background text-muted-foreground",
                            )}
                          >
                            <Icon className="h-3 w-3" />
                            {a.type.charAt(0) + a.type.slice(1).toLowerCase().replace("_", " ")}
                            {a.flaggedByServiceMember && (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                          </a>
                        );
                      })}
                    </div>
                  )}
                  {hasFlagged && (
                    <p className="text-[11px] text-amber-700">
                      ⚠ Soldier flagged a possible discrepancy on an attachment — verify before relying on it.
                    </p>
                  )}
                  {entry.clarificationNote && entry.confirmationStatus === "NEEDS_CLARIFICATION" && (
                    <p className="text-[11px] text-amber-700">Note: {entry.clarificationNote}</p>
                  )}
                  {entry.usedInEvalId === evalId && (
                    <p className="text-[11px] text-muted-foreground">Already used in this evaluation</p>
                  )}
                </div>
              </label>

              {/* Rater confirmation actions — reviewing this entry does not
                  transform a self-uploaded artifact into an authoritative
                  record, it only reflects rater review (MVP audit 5.4). */}
              <div
                className="mt-1.5 flex items-center gap-2 pl-6"
                onClick={(e) => e.stopPropagation()}
              >
                {isClarifying ? (
                  <div className="flex flex-1 items-center gap-1.5">
                    <input
                      type="text"
                      value={clarifyNote}
                      onChange={(e) => setClarifyNote(e.target.value)}
                      placeholder="What needs clarification?"
                      className="h-6 flex-1 rounded border border-input px-1.5 text-[11px]"
                    />
                    <button
                      type="button"
                      disabled={!clarifyNote.trim() || isBusy}
                      onClick={() =>
                        handleConfirm(entry.id, "NEEDS_CLARIFICATION", clarifyNote.trim())
                      }
                      className="text-[11px] font-medium text-amber-700 disabled:opacity-50"
                    >
                      Send
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClarifyingId(null);
                        setClarifyNote("");
                      }}
                      className="text-[11px] text-muted-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleConfirm(entry.id, "CONFIRMED")}
                      className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:underline disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Confirm
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        setClarifyingId(entry.id);
                        setClarifyNote(entry.clarificationNote ?? "");
                      }}
                      className="flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:underline disabled:opacity-50"
                    >
                      <HelpCircle className="h-3 w-3" /> Needs clarification
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleConfirm(entry.id, "NOT_USED")}
                      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:underline disabled:opacity-50"
                    >
                      <XCircle className="h-3 w-3" /> Not used
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {flagWarning && (
        <p className="rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800">
          ⚠ One or more selected entries has a soldier-flagged attachment. Verify the documentation before finalizing this bullet.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}

      <button
        type="button"
        disabled={selected.size === 0 || generating}
        onClick={handleGenerate}
        className="flex items-center gap-1 rounded bg-[#1A3010] px-3 py-1 text-xs text-white disabled:opacity-50"
      >
        {generating && (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        Generate bullets from selected ({selected.size})
      </button>

      {generating && <BulletSkeleton count={2} />}
    </div>
  );
}

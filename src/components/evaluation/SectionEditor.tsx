"use client";

import { useState, useCallback } from "react";
import type {
  EvalSection,
  RatingBinary,
  RatingFourLevel,
  BulletSource,
  AIBulletSuggestion,
  SectionKey,
  SupportFormEntry,
} from "@/types/evaluation";
import { RatingBoxBinary } from "./RatingBoxBinary";
import { RatingBoxFourLevel } from "./RatingBoxFourLevel";
import { BulletEditor } from "./BulletEditor";
import { BulletCard } from "./BulletCard";
import { AIBulletPanel } from "./AIBulletPanel";
import { SoldierAccomplishmentsPanel } from "./SoldierAccomplishmentsPanel";
import { BulletSkeleton } from "./BulletSkeleton";
import { api } from "@/lib/api/client";
import { BULLET_MAX_CHARS } from "@/lib/utils/form-constants";
import { cn } from "@/lib/utils/cn";

const PART_IV_SECTIONS: SectionKey[] = [
  "CHARACTER",
  "PRESENCE",
  "INTELLECT",
  "LEADS",
  "DEVELOPS",
  "ACHIEVES",
];

export interface SectionEditorProps {
  section: EvalSection;
  evalId: string;
  /** AI bullet suggestions for this evaluation (all sections) */
  aiBulletSuggestions?: AIBulletSuggestion[];
  /** Called with merged updates after any change */
  onSave?: (patch: Partial<EvalSection>) => Promise<void>;
  onSuggestionsChange?: (updated: AIBulletSuggestion[]) => void;
  /** Which rating style to show — binary (CHARACTER) or four-level (PRESENCE…ACHIEVES) */
  ratingStyle?: "binary" | "four-level" | "none";
  /** Soldier info for from-scratch generation */
  soldierInfo?: { rank: string; mos: string; dutyTitle: string; formType: string };
  /** Soldier-logged support form entries (guided flow) — used by the Soldier Accomplishments widget */
  supportFormEntries?: SupportFormEntry[];
}

export function SectionEditor({
  section,
  evalId,
  aiBulletSuggestions = [],
  onSave,
  onSuggestionsChange,
  ratingStyle = "four-level",
  soldierInfo,
  supportFormEntries = [],
}: SectionEditorProps) {
  const [ratingBinary, setRatingBinary] = useState<RatingBinary | null>(
    section.ratingBinary,
  );
  const [ratingFourLevel, setRatingFourLevel] = useState<RatingFourLevel | null>(
    section.ratingFourLevel,
  );
  const [finalBullets, setFinalBullets] = useState<string[]>(
    section.finalBullets ?? [],
  );
  const [bulletSources, setBulletSources] = useState<Record<string, BulletSource>>(
    (section.bulletSources as Record<string, BulletSource>) ?? {},
  );
  const [bulletProvenance, setBulletProvenance] = useState<EvalSection["bulletProvenance"]>(
    section.bulletProvenance ?? null,
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(
    aiBulletSuggestions.some(
      (s) => s.sectionKey === section.section && s.status === "PENDING_REVIEW",
    ),
  );
  const [scratchMode, setScratchMode] = useState(false);
  const [scratchText, setScratchText] = useState("");
  const [generatingScratch, setGeneratingScratch] = useState(false);
  const [localSuggestions, setLocalSuggestions] = useState<AIBulletSuggestion[]>(
    aiBulletSuggestions,
  );

  const isPartIVSection = PART_IV_SECTIONS.includes(section.section as SectionKey);
  const canAddBullet = finalBullets.length < 5;
  const sectionSuggestions = localSuggestions.filter(
    (s) => s.sectionKey === section.section,
  );
  const pendingReviewCount = sectionSuggestions.filter(
    (s) => s.status === "PENDING_REVIEW",
  ).length;

  const save = useCallback(
    async (patch: Partial<EvalSection>) => {
      setSaving(true);
      setSaveError(null);
      try {
        await onSave?.(patch);
      } catch {
        setSaveError("Save failed — try again");
      } finally {
        setSaving(false);
      }
    },
    [onSave],
  );

  async function handleRatingBinaryChange(val: RatingBinary) {
    setRatingBinary(val);
    await save({ ratingBinary: val });
  }

  async function handleRatingFourLevelChange(val: RatingFourLevel) {
    setRatingFourLevel(val);
    await save({ ratingFourLevel: val });
  }

  async function handleAddBullet(text: string, source: BulletSource = "HUMAN") {
    if (!text.trim() || text.length > BULLET_MAX_CHARS) return;
    const newBullets = [...finalBullets, text];
    const newSources: Record<string, BulletSource> = {
      ...bulletSources,
      [String(newBullets.length - 1)]: source,
    };
    setFinalBullets(newBullets);
    setBulletSources(newSources);
    await save({ finalBullets: newBullets, bulletSources: newSources });
  }

  async function handleEditBullet(index: number, text: string) {
    const newBullets = finalBullets.map((b, i) => (i === index ? text : b));
    const newSources: Record<string, BulletSource> = {
      ...bulletSources,
      [String(index)]: "HUMAN",
    };
    setFinalBullets(newBullets);
    setBulletSources(newSources);
    setEditingIndex(null);
    await save({ finalBullets: newBullets, bulletSources: newSources });
  }

  async function handleRemoveBullet(index: number) {
    const newBullets = finalBullets.filter((_, i) => i !== index);
    const newSources: Record<string, BulletSource> = {};
    const newProvenance: NonNullable<EvalSection["bulletProvenance"]> = {};
    newBullets.forEach((_, i) => {
      const oldIndex = String(i < index ? i : i + 1);
      const oldSrc = bulletSources[oldIndex];
      if (oldSrc) newSources[String(i)] = oldSrc;
      const oldProv = bulletProvenance?.[oldIndex];
      if (oldProv) newProvenance[String(i)] = oldProv;
    });
    setFinalBullets(newBullets);
    setBulletSources(newSources);
    setBulletProvenance(newProvenance);
    await save({ finalBullets: newBullets, bulletSources: newSources, bulletProvenance: newProvenance });
  }

  /**
   * A suggestion accept/edit is now one atomic server-side transaction
   * (MVP audit 5.8) — it already appended the bullet + provenance to the
   * section row. Apply that authoritative result directly instead of
   * re-deriving it client-side and firing a second PATCH.
   */
  function handleSectionUpdatedFromServer(updated: EvalSection) {
    setFinalBullets(updated.finalBullets ?? []);
    setBulletSources((updated.bulletSources as Record<string, BulletSource>) ?? {});
    setBulletProvenance(updated.bulletProvenance ?? null);
  }

  async function handleMarkComplete() {
    if (pendingReviewCount > 0) {
      alert(
        `Review all AI suggestions first — ${pendingReviewCount} remaining.\n\nAccept, edit, or reject each suggestion before marking complete.`,
      );
      return;
    }
    await save({ isComplete: true });
  }

  async function handleGenerateScratch() {
    if (!scratchText.trim()) return;
    setGeneratingScratch(true);
    try {
      const info = soldierInfo ?? { rank: "SGT", mos: "11B", dutyTitle: "Soldier", formType: "NCOER_9_1" };
      const result = await api.post<{ suggestions: AIBulletSuggestion[] }>(
        `/support-form-uploads/${evalId}/generate-scratch`,
        {
          sectionKey: section.section,
          raterDescription: scratchText,
          soldierRank: info.rank,
          soldierMos: info.mos,
          dutyTitle: info.dutyTitle,
          formType: info.formType,
        },
      );
      const merged = [...localSuggestions, ...(result.suggestions ?? [])];
      setLocalSuggestions(merged);
      onSuggestionsChange?.(merged);
      setScratchMode(false);
      setScratchText("");
      setAiPanelOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingScratch(false);
    }
  }

  function handleSuggestionsChange(updated: AIBulletSuggestion[]) {
    setLocalSuggestions(updated);
    onSuggestionsChange?.(updated);
  }

  return (
    <div className="space-y-5">
      {/* Rating */}
      {ratingStyle === "binary" && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Rating
          </h3>
          <RatingBoxBinary value={ratingBinary} onChange={handleRatingBinaryChange} />
        </div>
      )}
      {ratingStyle === "four-level" && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Rating
          </h3>
          <RatingBoxFourLevel
            value={ratingFourLevel}
            onChange={handleRatingFourLevelChange}
          />
        </div>
      )}

      {/* AI Panel Toggle */}
      {isPartIVSection && (
        <div className="flex items-center justify-between rounded border border-border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">AI Suggestions</span>
            {sectionSuggestions.length > 0 && (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                  pendingReviewCount > 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-green-100 text-green-800",
                )}
              >
                {pendingReviewCount > 0
                  ? `${pendingReviewCount} need review`
                  : `${sectionSuggestions.length} reviewed`}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAiPanelOpen((o) => !o)}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition-colors",
              aiPanelOpen
                ? "bg-[#1A3010] text-white"
                : "border border-border bg-background text-foreground hover:bg-muted",
            )}
          >
            {aiPanelOpen ? "Hide AI" : "Show AI"}
          </button>
        </div>
      )}

      {/* Main content: split when AI open, single column otherwise */}
      <div className={cn(aiPanelOpen && isPartIVSection ? "grid gap-6 lg:grid-cols-2" : "")}>
        {/* Left column: bullets */}
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Performance Bullets ({finalBullets.length}/5)
            </h3>

            {finalBullets.length === 0 && (
              <p className="rounded border border-dashed border-border p-3 text-sm text-muted-foreground">
                No bullets yet. Accept AI suggestions or add manually below.
              </p>
            )}

            <div className="space-y-2">
              {finalBullets.map((bullet, i) =>
                editingIndex === i ? (
                  <BulletEditor
                    key={i}
                    initialText={bullet}
                    onSave={(text) => handleEditBullet(i, text)}
                  />
                ) : (
                  <BulletCard
                    key={i}
                    text={bullet}
                    source={bulletSources[String(i)] ?? "HUMAN"}
                    provenance={bulletProvenance?.[String(i)] ?? null}
                    onEdit={() => setEditingIndex(i)}
                    onRemove={() => handleRemoveBullet(i)}
                  />
                ),
              )}
            </div>
          </div>

          {canAddBullet && editingIndex === null && (
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Add Bullet Manually
              </h3>
              <BulletEditor onSave={(t) => handleAddBullet(t, "HUMAN")} />
              <p className="mt-1 text-xs text-muted-foreground">
                Army format: begin with action verb, focus on impact, ≤{BULLET_MAX_CHARS} chars.
              </p>
            </div>
          )}
        </div>

        {/* Right column: AI suggestions */}
        {aiPanelOpen && isPartIVSection && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              AI Bullet Suggestions
            </h3>

            <AIBulletPanel
              evalId={evalId}
              sectionKey={section.section as SectionKey}
              suggestions={localSuggestions}
              onSectionUpdated={handleSectionUpdatedFromServer}
              onSuggestionsChange={handleSuggestionsChange}
            />

            {/* Soldier Accomplishments — generate from soldier-logged entries + artifacts */}
            <SoldierAccomplishmentsPanel
              evalId={evalId}
              sectionKey={section.section as SectionKey}
              entries={supportFormEntries}
              soldierInfo={
                soldierInfo ?? { rank: "SGT", mos: "11B", dutyTitle: "Soldier", formType: "NCOER_9_1" }
              }
              onSuggestions={(newSuggestions) => {
                const merged = [
                  ...localSuggestions.filter(
                    (s) => !newSuggestions.some((n) => n.id === s.id),
                  ),
                  ...newSuggestions,
                ];
                handleSuggestionsChange(merged);
                setAiPanelOpen(true);
              }}
            />

            {/* From-scratch generation */}
            {!scratchMode ? (
              <button
                type="button"
                onClick={() => setScratchMode(true)}
                className="w-full rounded border border-dashed border-primary/40 py-2 text-xs text-primary hover:bg-primary/5"
              >
                + Generate from scratch (describe what this soldier did)
              </button>
            ) : (
              <div className="space-y-2 rounded border border-border p-3">
                <p className="text-xs font-medium text-foreground">
                  Describe what this soldier did:
                </p>
                <textarea
                  className="w-full resize-none rounded border border-border bg-background p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={4}
                  placeholder="e.g. Led 12-soldier squad through 3 field exercises, managed $240K equipment, trained 4 junior NCOs…"
                  value={scratchText}
                  onChange={(e) => setScratchText(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setScratchMode(false); setScratchText(""); }}
                    className="rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!scratchText.trim() || generatingScratch}
                    onClick={handleGenerateScratch}
                    className="flex items-center gap-1 rounded bg-[#1A3010] px-3 py-1 text-xs text-white disabled:opacity-50"
                  >
                    {generatingScratch && (
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    )}
                    Generate Bullets
                  </button>
                </div>
              </div>
            )}

            {generatingScratch && <BulletSkeleton count={2} />}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        {saveError ? (
          <p className="text-sm text-destructive">{saveError}</p>
        ) : saving ? (
          <p className="text-sm text-muted-foreground">Saving…</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {section.isComplete ? "✓ Section complete" : "Changes auto-save"}
          </p>
        )}
        {!section.isComplete && (
          <button
            type="button"
            onClick={handleMarkComplete}
            disabled={pendingReviewCount > 0}
            className={cn(
              "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
              pendingReviewCount > 0
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
            title={
              pendingReviewCount > 0
                ? `Review ${pendingReviewCount} AI suggestion${pendingReviewCount !== 1 ? "s" : ""} first`
                : undefined
            }
          >
            {pendingReviewCount > 0
              ? `Review ${pendingReviewCount} suggestion${pendingReviewCount !== 1 ? "s" : ""} first`
              : "Mark Complete"}
          </button>
        )}
      </div>
    </div>
  );
}

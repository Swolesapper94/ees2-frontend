"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  EvalSection,
  RatingBinary,
  RatingFourLevel,
  BulletSource,
  AIBulletSuggestion,
  PerformanceObservation,
  SectionKey,
  SupportFormEntry,
} from "@/types/evaluation";
import { RatingBoxBinary } from "./RatingBoxBinary";
import { RatingBoxFourLevel } from "./RatingBoxFourLevel";
import { BulletEditor } from "./BulletEditor";
import { BulletCard } from "./BulletCard";
import { AIBulletPanel } from "./AIBulletPanel";
import { SoldierAccomplishmentsPanel } from "./SoldierAccomplishmentsPanel";
import { RaterObservationsPanel } from "./RaterObservationsPanel";
import { BulletSkeleton } from "./BulletSkeleton";
import { UploadedSupportFormViewer } from "./UploadedSupportFormViewer";
import { api } from "@/lib/api/client";
import { BULLET_MAX_CHARS } from "@/lib/utils/form-constants";
import { cn } from "@/lib/utils/cn";
import { isPartIVSectionKey, SECTION_VISUALS } from "@/lib/utils/section-visuals";
import { FilePenLine, Scale, Sparkles } from "lucide-react";

const PART_IV_SECTIONS: SectionKey[] = [
  "CHARACTER",
  "PRESENCE",
  "INTELLECT",
  "LEADS",
  "DEVELOPS",
  "ACHIEVES",
];

/**
 * A new MERIT generation run for a section (from scratch, from selected
 * accomplishments, or from selected observations — they all populate the
 * same "MERIT Performance Suggestions" round) supersedes that section's prior
 * undecided or rejected candidates instead of piling up beside them.
 * Accepted/edited suggestions are always kept — they already became final
 * bullets and carry a permanent provenance record. Suggestions tied to a
 * whole-document upload (uploadId set) are a separate, intentionally
 * preserved history and are never touched here.
 */
function replaceGeneratedSuggestions(
  current: AIBulletSuggestion[],
  fresh: AIBulletSuggestion[],
  sectionKey: string,
): AIBulletSuggestion[] {
  const retained = current.filter(
    (suggestion) =>
      suggestion.sectionKey !== sectionKey ||
      suggestion.uploadId !== null ||
      suggestion.status === "ACCEPTED" ||
      suggestion.status === "EDITED",
  );
  return [...retained, ...fresh];
}

export interface SectionEditorProps {
  section: EvalSection;
  evalId: string;
  /** MERIT bullet suggestions for this evaluation (all sections) */
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
  /** Rater-owned observations supplied by the evaluation's linked support form. */
  supportFormObservations?: PerformanceObservation[];
  /** Server-derived relationship capability; never infer this from a global role. */
  canUseRaterEvidence?: boolean;
  /** The original uploaded support form can be reviewed alongside MERIT suggestions. */
  uploadedSupportFormFileType?: string;
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
  supportFormObservations = [],
  canUseRaterEvidence = false,
  uploadedSupportFormFileType,
}: SectionEditorProps) {
  const contentLabel = soldierInfo?.formType.startsWith("OER") ? "comment" : "bullet";
  const contentLabelPlural = contentLabel === "comment" ? "Comments" : "Bullets";
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
  const [scratchError, setScratchError] = useState<string | null>(null);
  const [localSuggestions, setLocalSuggestions] = useState<AIBulletSuggestion[]>(
    aiBulletSuggestions,
  );
  const [manualEvidenceReferences, setManualEvidenceReferences] = useState<Array<{ kind: "SUPPORT_FORM_ENTRY" | "PERFORMANCE_OBSERVATION"; id: string }>>([]);

  useEffect(() => {
    setLocalSuggestions(aiBulletSuggestions);
  }, [aiBulletSuggestions]);

  const isPartIVSection = PART_IV_SECTIONS.includes(section.section as SectionKey);
  const sectionVisual = isPartIVSectionKey(section.section) ? SECTION_VISUALS[section.section] : null;
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
    const evidenceSnapshots = manualEvidenceReferences.map((reference) => {
      if (reference.kind === "SUPPORT_FORM_ENTRY") {
        const entry = supportFormEntries.find((item) => item.id === reference.id);
        return entry ? {
          entryId: entry.id,
          sourceType: "SUPPORT_FORM_ENTRY" as const,
          sourceId: entry.id,
          sourceLabel: "Soldier accomplishment",
          occurredAt: entry.entryDate,
          rawText: entry.rawText,
          artifactCaptions: entry.artifacts.filter((artifact) => artifact.aiCaptionStatus === "COMPLETE" && artifact.aiCaption).map((artifact) => artifact.aiCaption as string),
        } : null;
      }
      const observation = supportFormObservations.find((item) => item.id === reference.id);
      return observation ? {
        entryId: observation.id,
        sourceType: "PERFORMANCE_OBSERVATION" as const,
        sourceId: observation.id,
        sourceLabel: observation.observer ? `${observation.observer.rank} ${observation.observer.lastName} observation` : "Rater observation",
        occurredAt: observation.occurredAt,
        rawText: observation.factualNote,
        artifactCaptions: [],
        goal: observation.goal ? { id: observation.goal.id, title: observation.goal.title, description: observation.goal.description } : null,
        counselingState: observation.releaseState,
        discussedAt: observation.discussedAt,
      } : null;
    }).filter((snapshot): snapshot is NonNullable<typeof snapshot> => snapshot !== null);
    const newProvenance = evidenceSnapshots.length > 0 ? {
      ...(bulletProvenance ?? {}),
      [String(newBullets.length - 1)]: {
        suggestionId: "manual",
        sourceEntryIds: manualEvidenceReferences.filter((reference) => reference.kind === "SUPPORT_FORM_ENTRY").map((reference) => reference.id),
        evidenceReferences: manualEvidenceReferences,
        sourceSnapshot: evidenceSnapshots,
      },
    } : bulletProvenance;
    setFinalBullets(newBullets);
    setBulletSources(newSources);
    setBulletProvenance(newProvenance ?? null);
    setManualEvidenceReferences([]);
    await save({ finalBullets: newBullets, bulletSources: newSources, bulletProvenance: newProvenance ?? null });
  }

  function toggleManualEvidence(reference: { kind: "SUPPORT_FORM_ENTRY" | "PERFORMANCE_OBSERVATION"; id: string }) {
    setManualEvidenceReferences((current) => current.some((item) => item.kind === reference.kind && item.id === reference.id)
      ? current.filter((item) => item.kind !== reference.kind || item.id !== reference.id)
      : [...current, reference]);
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
        `Review all MERIT suggestions first — ${pendingReviewCount} remaining.\n\nAccept, edit, or reject each suggestion before marking complete.`,
      );
      return;
    }
    await save({ isComplete: true });
  }

  async function handleGenerateScratch() {
    if (!scratchText.trim()) return;
    setGeneratingScratch(true);
    setScratchError(null);
    try {
      const result = await api.post<{ suggestions: AIBulletSuggestion[] }>(
        `/support-form-uploads/${evalId}/generate-scratch`,
        {
          sectionKey: section.section,
          raterDescription: scratchText,
        },
      );
      const merged = replaceGeneratedSuggestions(localSuggestions, result.suggestions ?? [], section.section);
      setLocalSuggestions(merged);
      onSuggestionsChange?.(merged);
      setScratchMode(false);
      setScratchText("");
      setAiPanelOpen(true);
    } catch {
      setScratchError("MERIT generation failed. Check the backend connection and try again.");
    } finally {
      setGeneratingScratch(false);
    }
  }

  function handleSuggestionsChange(updated: AIBulletSuggestion[]) {
    setLocalSuggestions(updated);
    onSuggestionsChange?.(updated);
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Rating */}
      {ratingStyle !== "none" && (
        <section className={cn("rounded-sm border border-l-4 bg-card p-4 shadow-card", sectionVisual?.accent ?? "border-l-primary")}>
          <div className="mb-3 flex items-center gap-2">
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-sm", sectionVisual?.iconSurface ?? "bg-muted text-foreground")}>
              <Scale className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Rater decision</p>
              <h2 className="text-sm font-semibold">Performance rating</h2>
            </div>
          </div>
          {ratingStyle === "binary" ? (
            <RatingBoxBinary value={ratingBinary} onChange={handleRatingBinaryChange} />
          ) : (
            <RatingBoxFourLevel value={ratingFourLevel} onChange={handleRatingFourLevelChange} />
          )}
        </section>
      )}

      {/* MERIT suggestions toggle */}
      {canUseRaterEvidence && isPartIVSection && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-sky-200 bg-sky-50 px-4 py-3 shadow-card">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-sky-100 text-sky-800">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700">Evidence-assisted drafting</p>
              <span className="text-sm font-semibold text-sky-950">MERIT Suggestions</span>
            </div>
            {sectionSuggestions.length > 0 && (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                  pendingReviewCount > 0
                    ? "bg-status-tint-pending text-status-pending"
                    : "bg-status-tint-complete text-status-complete",
                )}
              >
                {pendingReviewCount > 0
                  ? `${pendingReviewCount} need review`
                  : `${sectionSuggestions.length} reviewed`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {uploadedSupportFormFileType && <UploadedSupportFormViewer evalId={evalId} fileType={uploadedSupportFormFileType} />}
            <button
              type="button"
              onClick={() => setAiPanelOpen((o) => !o)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                aiPanelOpen
                  ? "bg-sky-800 text-white shadow-sm"
                  : "border border-sky-300 bg-background text-sky-900 hover:bg-sky-100",
              )}
            >
              {aiPanelOpen ? "Hide MERIT" : "Show MERIT"}
            </button>
          </div>
        </div>
      )}

      {/* Main content: split when MERIT suggestions are open, single column otherwise */}
      <div className={cn(aiPanelOpen && canUseRaterEvidence && isPartIVSection ? "grid gap-6 lg:grid-cols-2" : "")}>
        {/* Left column: bullets */}
        <section className="space-y-4 rounded-sm border border-border bg-card p-4 shadow-card">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary/10 text-primary">
                  <FilePenLine className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Final evaluation content</p>
                  <h2 className="text-sm font-semibold">Performance {contentLabelPlural}</h2>
                </div>
              </div>
              <span className="rounded-sm bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">{finalBullets.length}/5</span>
            </div>

            {finalBullets.length === 0 && (
              <p className="rounded border border-dashed border-border p-3 text-sm text-muted-foreground">
                No {contentLabel === "comment" ? "comments" : "bullets"} yet. Accept MERIT suggestions or add one manually below.
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
            <div className="border-t border-border pt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Add {contentLabel === "comment" ? "Comment" : "Bullet"} Manually
              </h3>
              <BulletEditor onSave={(t) => handleAddBullet(t, "HUMAN")} />
              {canUseRaterEvidence && (
                <details className="mt-2 rounded border border-border p-2 text-xs">
                  <summary className="cursor-pointer font-medium text-muted-foreground">Attach optional evidence ({manualEvidenceReferences.length})</summary>
                  <div className="mt-2 space-y-2">
                    {supportFormEntries.filter((entry) => entry.section === section.section && entry.entryType === "ACCOMPLISHMENT").map((entry) => {
                      const reference = { kind: "SUPPORT_FORM_ENTRY" as const, id: entry.id };
                      const selected = manualEvidenceReferences.some((item) => item.kind === reference.kind && item.id === reference.id);
                      return <label key={entry.id} className="flex gap-2"><input type="checkbox" checked={selected} onChange={() => toggleManualEvidence(reference)} /><span>{entry.rawText}</span></label>;
                    })}
                    {supportFormObservations.filter((observation) => observation.sectionKey === section.section).map((observation) => {
                      const reference = { kind: "PERFORMANCE_OBSERVATION" as const, id: observation.id };
                      const selected = manualEvidenceReferences.some((item) => item.kind === reference.kind && item.id === reference.id);
                      return <label key={observation.id} className="flex gap-2"><input type="checkbox" checked={selected} onChange={() => toggleManualEvidence(reference)} /><span>Rater observation: {observation.factualNote}</span></label>;
                    })}
                  </div>
                </details>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {contentLabel === "comment"
                  ? `Keep the narrative factual, concise, and within ${BULLET_MAX_CHARS} characters.`
                  : `Army format: begin with action verb, focus on impact, ≤${BULLET_MAX_CHARS} chars.`}
              </p>
            </div>
          )}
        </section>

        {/* Right column: MERIT suggestions */}
        {aiPanelOpen && canUseRaterEvidence && isPartIVSection && (
          <section className="space-y-3 rounded-sm border border-sky-200 bg-sky-50/50 p-4 shadow-card animate-in fade-in slide-in-from-right-2 duration-200">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700">Candidate workspace</p>
              <h2 className="text-sm font-semibold text-sky-950">Review, use, edit, or reject</h2>
            </div>

            <AIBulletPanel
              evalId={evalId}
              sectionKey={section.section as SectionKey}
              suggestions={localSuggestions}
              contentLabel={contentLabel}
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
                const merged = replaceGeneratedSuggestions(localSuggestions, newSuggestions, section.section);
                handleSuggestionsChange(merged);
                setAiPanelOpen(true);
              }}
            />

            <RaterObservationsPanel
              evalId={evalId}
              sectionKey={section.section as SectionKey}
              observations={supportFormObservations}
              onSuggestions={(newSuggestions) => {
                const merged = replaceGeneratedSuggestions(localSuggestions, newSuggestions, section.section);
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
                    Generate {contentLabel === "comment" ? "Comments" : "Bullets"}
                  </button>
                </div>
                {scratchError && <p className="text-xs text-red-700">{scratchError}</p>}
              </div>
            )}

            {generatingScratch && <BulletSkeleton count={2} />}
          </section>
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
                ? `Review ${pendingReviewCount} MERIT suggestion${pendingReviewCount !== 1 ? "s" : ""} first`
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

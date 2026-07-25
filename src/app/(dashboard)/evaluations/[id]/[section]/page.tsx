"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { SECTION_LABELS } from "@/lib/utils/form-constants";
import { SectionEditor } from "@/components/evaluation/SectionEditor";
import { SupportFormUploadPanel } from "@/components/evaluation/SupportFormUploadPanel";
import { RegulationReference } from "@/components/evaluation/RegulationReference";
import { SectionSkeleton } from "@/components/evaluation/SectionSkeleton";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { isPartIVSectionKey, SECTION_VISUALS } from "@/lib/utils/section-visuals";
import { Check } from "lucide-react";
import type {
  EvalSection,
  AIBulletSuggestion,
  SupportFormUploadState,
  Evaluation,
} from "@/types/evaluation";
import Link from "next/link";

// CHARACTER uses binary rating; all others use four-level
const BINARY_SECTIONS = new Set(["CHARACTER"]);
// RATER_OVERALL, SENIOR_RATER_OVERALL, SOLDIER_COMMENTS use no rating box
const NO_RATING_SECTIONS = new Set(["RATER_OVERALL", "SENIOR_RATER_OVERALL", "SOLDIER_COMMENTS"]);
const PART_IV_SECTIONS = new Set(["CHARACTER", "PRESENCE", "INTELLECT", "LEADS", "DEVELOPS", "ACHIEVES"]);

const SECTION_ORDER = [
  "admin", "duty", "timeline",
  "character", "presence", "intellect", "leads", "develops", "achieves",
  "senior-rater", "review", "sign",
];

export default function SectionPage() {
  const params = useParams();
  const id = params.id as string;
  const sectionSlug = params.section as string;
  const sectionKey = sectionSlug.toUpperCase().replace(/-/g, "_");
  const label = SECTION_LABELS[sectionKey] ?? sectionSlug;

  const [section, setSection] = useState<EvalSection | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [uploadState, setUploadState] = useState<SupportFormUploadState>({ hasUpload: false });
  const [aiSuggestions, setAiSuggestions] = useState<AIBulletSuggestion[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<Evaluation>(`/evaluations/${id}`),
      api.get<SupportFormUploadState>(`/support-form-uploads/${id}/status`),
    ])
      .then(([eval_, uploadStatus]) => {
        const found = eval_.sections?.find((s) => s.section === sectionKey);
        if (found) setSection(found);
        else setNotFound(true);
        setEvaluation(eval_);
        setUploadState(uploadStatus);
        setAiSuggestions((uploadStatus.bulletSuggestions ?? []).filter((suggestion) => suggestion.sectionKey === sectionKey));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, sectionKey]);

  useEffect(() => {
    const processing = uploadState.hasUpload && uploadState.parseStatus && !["COMPLETE", "FAILED"].includes(uploadState.parseStatus);
    if (!processing) return;
    const interval = setInterval(() => {
      api.get<SupportFormUploadState>(`/support-form-uploads/${id}/status`)
        .then((state) => {
          setUploadState(state);
          setAiSuggestions((state.bulletSuggestions ?? []).filter((suggestion) => suggestion.sectionKey === sectionKey));
        })
        .catch(() => undefined);
    }, 2000);
    return () => clearInterval(interval);
  }, [id, uploadState.hasUpload, uploadState.parseStatus]);

  const handleSave = useCallback(
    async (patch: Partial<EvalSection>) => {
      await api.patch(`/evaluations/${id}/sections/${sectionKey}`, patch);
      setSection((prev) => prev ? { ...prev, ...patch } : prev);
    },
    [id, sectionKey],
  );

  function handleUploadComplete(state: SupportFormUploadState) {
    setUploadState(state);
    if (state.bulletSuggestions) setAiSuggestions(state.bulletSuggestions.filter((suggestion) => suggestion.sectionKey === sectionKey));
  }

  const currentIndex = SECTION_ORDER.indexOf(sectionSlug);
  const nextSlug = currentIndex >= 0 ? SECTION_ORDER[currentIndex + 1] : undefined;
  const prevSlug = currentIndex > 0 ? SECTION_ORDER[currentIndex - 1] : undefined;

  const ratingStyle = BINARY_SECTIONS.has(sectionKey)
    ? "binary"
    : NO_RATING_SECTIONS.has(sectionKey)
      ? "none"
      : "four-level";
  const isPipelineProcessing = Boolean(
    uploadState.hasUpload && uploadState.parseStatus && !["COMPLETE", "FAILED"].includes(uploadState.parseStatus),
  );
  const sectionVisual = isPartIVSectionKey(sectionKey) ? SECTION_VISUALS[sectionKey] : null;
  const SectionIcon = sectionVisual?.Icon;

  const soldier = (evaluation as unknown as { ratingChain?: { ratedSoldier?: { rank?: string; mos?: string } } })?.ratingChain?.ratedSoldier;
  const soldierInfo = {
    rank: String(soldier?.rank ?? "SGT"),
    mos: soldier?.mos ?? "11B",
    dutyTitle: evaluation?.principalDutyTitle ?? "Soldier",
    formType: evaluation?.formType ?? "NCOER_9_1",
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
      <section className={cn(
        "mb-5 flex items-start justify-between gap-4 rounded-sm border border-l-4 p-4 shadow-card",
        sectionVisual ? `${sectionVisual.surface} ${sectionVisual.border} ${sectionVisual.accent}` : "border-border bg-card",
      )}>
        <div className="flex items-start gap-3">
          {SectionIcon && (
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-sm", sectionVisual?.iconSurface)}>
              <SectionIcon className="h-5 w-5" />
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Part IV · Performance assessment</p>
            <h1 className={cn("mt-0.5 text-2xl font-bold tracking-tight", sectionVisual?.text)}>{label}</h1>
            {PART_IV_SECTIONS.has(sectionKey) && <RegulationReference sectionKey={sectionKey} />}
          </div>
        </div>
        {section?.isComplete && (
          <span className="inline-flex items-center gap-1 rounded-sm bg-status-tint-complete px-2.5 py-1 text-xs font-semibold text-status-complete">
            <Check className="h-3.5 w-3.5" /> Complete
          </span>
        )}
      </section>

      {/* Support form upload status and reprocess controls apply only to Part IV sections. */}
      {PART_IV_SECTIONS.has(sectionKey) && !loading && (
        <div className="mb-5 rounded-sm border border-sky-200 bg-sky-50/60 p-4 shadow-card">
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700">Evidence source</p>
            <h2 className="mt-0.5 text-sm font-semibold text-sky-950">Soldier Support Form &amp; Document Import</h2>
          </div>
          <SupportFormUploadPanel
            evalId={id}
            sectionKey={sectionKey}
            sectionLabel={label}
            uploadState={uploadState}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      )}

      {loading && <SectionSkeleton />}

      {notFound && (
        <p className="rounded-sm border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Section &ldquo;{sectionKey}&rdquo; not found for this evaluation. It may not exist for this form type.
        </p>
      )}

      {section && isPipelineProcessing && (
        <div className="rounded-sm border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Processing the uploaded support form. Performance sections will unlock after extraction, classification, and suggestion generation finish.
        </div>
      )}

      {section && !isPipelineProcessing && (
        <SectionEditor
          section={section}
          evalId={id}
          aiBulletSuggestions={aiSuggestions}
          onSave={handleSave}
          onSuggestionsChange={setAiSuggestions}
          ratingStyle={ratingStyle as "binary" | "four-level" | "none"}
          soldierInfo={{
            ...soldierInfo,
            dutyTitle: evaluation?.principalDutyTitle ?? evaluation?.supportForm?.dutyTitle ?? "Soldier",
          }}
          supportFormEntries={evaluation?.supportForm?.entries ?? []}
          supportFormObservations={evaluation?.supportForm?.observations ?? []}
          canUseRaterEvidence={Boolean(evaluation?.canUseRaterEvidence)}
          uploadedSupportFormFileType={uploadState.hasUpload ? uploadState.fileType : undefined}
        />
      )}

      {/* Prev / Next navigation */}
      <div className="mt-8 flex justify-between border-t border-border pt-4">
        {prevSlug ? (
          <Link
            href={`/evaluations/${id}/${prevSlug}`}
            className="rounded-sm border border-input px-3 py-1.5 text-sm"
          >
            ← {SECTION_LABELS[prevSlug.toUpperCase()] ?? prevSlug}
          </Link>
        ) : <span />}
        {nextSlug ? (
          <Link
            href={`/evaluations/${id}/${nextSlug}`}
            className="rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            {SECTION_LABELS[nextSlug.toUpperCase()] ?? nextSlug} →
          </Link>
        ) : (
          <Link
            href={`/evaluations/${id}/review`}
            className="rounded-sm bg-green-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            Review & Generate PDF →
          </Link>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { SECTION_LABELS } from "@/lib/utils/form-constants";
import { SectionEditor } from "@/components/evaluation/SectionEditor";
import { SupportFormUploadPanel } from "@/components/evaluation/SupportFormUploadPanel";
import { RegulationReference } from "@/components/evaluation/RegulationReference";
import { SectionSkeleton } from "@/components/evaluation/SectionSkeleton";
import { api } from "@/lib/api/client";
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
        setAiSuggestions(uploadStatus.bulletSuggestions ?? []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, sectionKey]);

  const handleSave = useCallback(
    async (patch: Partial<EvalSection>) => {
      await api.patch(`/evaluations/${id}/sections/${sectionKey}`, patch);
      setSection((prev) => prev ? { ...prev, ...patch } : prev);
    },
    [id, sectionKey],
  );

  function handleUploadComplete(state: SupportFormUploadState) {
    setUploadState(state);
    if (state.bulletSuggestions) setAiSuggestions(state.bulletSuggestions);
  }

  const currentIndex = SECTION_ORDER.indexOf(sectionSlug);
  const nextSlug = currentIndex >= 0 ? SECTION_ORDER[currentIndex + 1] : undefined;
  const prevSlug = currentIndex > 0 ? SECTION_ORDER[currentIndex - 1] : undefined;

  const ratingStyle = BINARY_SECTIONS.has(sectionKey)
    ? "binary"
    : NO_RATING_SECTIONS.has(sectionKey)
      ? "none"
      : "four-level";

  const soldier = (evaluation as unknown as { ratingChain?: { ratedSoldier?: { rank?: string; mos?: string } } })?.ratingChain?.ratedSoldier;
  const soldierInfo = {
    rank: String(soldier?.rank ?? "SGT"),
    mos: soldier?.mos ?? "11B",
    dutyTitle: evaluation?.principalDutyTitle ?? "Soldier",
    formType: evaluation?.formType ?? "NCOER_9_1",
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{label}</h1>
          <p className="text-sm text-muted-foreground">Part IV — Performance assessment</p>
          {PART_IV_SECTIONS.has(sectionKey) && <RegulationReference sectionKey={sectionKey} />}
        </div>
        {section?.isComplete && (
          <span className="rounded-sm bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            ✓ Complete
          </span>
        )}
      </div>

      {/* Support form upload panel — only on Part IV sections and only before upload */}
      {PART_IV_SECTIONS.has(sectionKey) && !loading && !uploadState.hasUpload && (
        <div className="mb-5 rounded-md border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Soldier Support Form
          </h3>
          <SupportFormUploadPanel
            evalId={id}
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

      {section && (
        <SectionEditor
          section={section}
          evalId={id}
          aiBulletSuggestions={aiSuggestions}
          onSave={handleSave}
          onSuggestionsChange={setAiSuggestions}
          ratingStyle={ratingStyle as "binary" | "four-level" | "none"}
          soldierInfo={soldierInfo}
          supportFormEntries={evaluation?.supportForm?.entries ?? []}
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

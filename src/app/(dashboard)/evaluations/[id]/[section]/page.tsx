"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { SECTION_LABELS } from "@/lib/utils/form-constants";
import { SectionEditor } from "@/components/evaluation/SectionEditor";
import { api } from "@/lib/api/client";
import type { EvalSection } from "@/types/evaluation";
import Link from "next/link";

// CHARACTER uses binary rating; all others use four-level
const BINARY_SECTIONS = new Set(["CHARACTER"]);
// RATER_OVERALL, SENIOR_RATER_OVERALL, SOLDIER_COMMENTS use no rating box
const NO_RATING_SECTIONS = new Set(["RATER_OVERALL", "SENIOR_RATER_OVERALL", "SOLDIER_COMMENTS"]);

const SECTION_ORDER = [
  "admin", "duty",
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
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .get<{ sections: EvalSection[] }>(`/evaluations/${id}`)
      .then((eval_) => {
        const found = eval_.sections?.find((s) => s.section === sectionKey);
        if (found) {
          setSection(found);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, sectionKey]);

  const handleSave = useCallback(
    async (patch: Partial<EvalSection>) => {
      await api.patch(`/evaluations/${id}/sections/${sectionKey}`, patch);
      // Update local state optimistically
      setSection((prev) => prev ? { ...prev, ...patch } : prev);
    },
    [id, sectionKey],
  );

  const currentIndex = SECTION_ORDER.indexOf(sectionSlug);
  const nextSlug = currentIndex >= 0 ? SECTION_ORDER[currentIndex + 1] : undefined;
  const prevSlug = currentIndex > 0 ? SECTION_ORDER[currentIndex - 1] : undefined;

  const ratingStyle = BINARY_SECTIONS.has(sectionKey)
    ? "binary"
    : NO_RATING_SECTIONS.has(sectionKey)
      ? "none"
      : "four-level";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{label}</h1>
          <p className="text-sm text-muted-foreground">Part IV — Performance assessment</p>
        </div>
        {section?.isComplete && (
          <span className="rounded-sm bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            ✓ Complete
          </span>
        )}
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading section…</p>
      )}

      {notFound && (
        <p className="rounded-sm border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Section &ldquo;{sectionKey}&rdquo; not found for this evaluation. It may not exist for this form type.
        </p>
      )}

      {section && (
        <SectionEditor
          section={section}
          onSave={handleSave}
          ratingStyle={ratingStyle as "binary" | "four-level" | "none"}
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


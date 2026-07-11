"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { PerformanceTimeline } from "@/components/evaluation/PerformanceTimeline";

/**
 * Read-only chronological view of the rating period — composed from
 * canonical support-form entries, counseling sessions, and milestones
 * (MVP audit 5.5). Gives the rater/SR full context before drafting or
 * finalizing Part IV bullets.
 */
export default function TimelinePage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold tracking-tight">Performance Timeline</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Chronological record of objectives, accomplishments, counseling, and milestones for this rating period.
      </p>

      <PerformanceTimeline evalId={id} />

      <div className="mt-8 flex justify-between border-t border-border pt-4">
        <Link
          href={`/evaluations/${id}/duty`}
          className="rounded-sm border border-input px-3 py-1.5 text-sm"
        >
          ← Duty Description
        </Link>
        <Link
          href={`/evaluations/${id}/character`}
          className="rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Character →
        </Link>
      </div>
    </div>
  );
}

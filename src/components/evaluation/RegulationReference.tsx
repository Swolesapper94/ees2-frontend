"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { BookOpen } from "lucide-react";

export interface RegulationCitation {
  docTitle: string;
  section: string;
  pageStart: number | null;
}

export interface RegulationReferenceProps {
  sectionKey: string;
}

/**
 * Shows the AR 623-3 / DA PAM 623-3 citation (doc, section, page) for a
 * given NCOER Part IV attribute/competency, so soldiers can look up the
 * governing regulation text themselves. Grounded in the actual ingested
 * regulation chunks (see src/lib/regulations). Renders nothing if the
 * regulation index isn't available yet (e.g. embeddings not ingested).
 */
export function RegulationReference({ sectionKey }: RegulationReferenceProps) {
  const [citation, setCitation] = useState<RegulationCitation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<{ citation: RegulationCitation | null }>(
        `/regulations/citation/${sectionKey}`,
      )
      .then((res) => {
        if (!cancelled) setCitation(res.citation);
      })
      .catch(() => {
        if (!cancelled) setCitation(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sectionKey]);

  if (loading) {
    return (
      <div className="mt-1 h-3 w-56 animate-pulse rounded bg-muted" aria-busy="true" />
    );
  }

  if (!citation) return null;

  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
      <BookOpen className="h-3 w-3 shrink-0" />
      Reference: {citation.docTitle}
      {citation.section ? `, ${citation.section}` : ""}
      {citation.pageStart ? ` (p. ${citation.pageStart})` : ""}
    </p>
  );
}

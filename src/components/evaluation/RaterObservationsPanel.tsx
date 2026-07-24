"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import type { AIBulletSuggestion, PerformanceObservation, SectionKey } from "@/types/evaluation";

export function RaterObservationsPanel({ evalId, sectionKey, observations, onSuggestions }: { evalId: string; sectionKey: SectionKey; observations: PerformanceObservation[]; onSuggestions: (suggestions: AIBulletSuggestion[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sectionObservations = observations.filter((observation) => observation.sectionKey === sectionKey);

  if (sectionObservations.length === 0) return null;

  function toggle(observationId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(observationId)) next.delete(observationId);
      else next.add(observationId);
      return next;
    });
  }

  async function generate() {
    if (selected.size === 0) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await api.post<{ suggestions: AIBulletSuggestion[] }>(`/support-form-uploads/${evalId}/generate-from-entries`, {
        sectionKey,
        entryIds: [],
        observationIds: Array.from(selected),
      });
      onSuggestions(result.suggestions);
      setSelected(new Set());
    } catch {
      setError("Unable to generate from selected observations.");
    } finally {
      setGenerating(false);
    }
  }

  return <section className="space-y-2 rounded border border-border p-3"><p className="text-xs font-medium text-foreground">Rater Observations - {sectionObservations.length} recorded for this section</p><div className="max-h-56 space-y-2 overflow-y-auto">{sectionObservations.map((observation) => <label key={observation.id} className={selected.has(observation.id) ? "block cursor-pointer rounded border border-primary bg-primary/5 p-2 text-xs" : "block cursor-pointer rounded border border-border p-2 text-xs hover:bg-accent/40"}><div className="flex gap-2"><input type="checkbox" checked={selected.has(observation.id)} onChange={() => toggle(observation.id)} className="mt-0.5" /><div className="flex-1"><p>{observation.factualNote}</p><p className="mt-1 text-[11px] text-muted-foreground">{observation.observer ? `${observation.observer.rank} ${observation.observer.lastName}` : "Assigned rater"} · {new Date(observation.occurredAt).toLocaleDateString()} · {observation.feedbackType.toLowerCase()}{observation.goal ? ` · Goal: ${observation.goal.title}` : ""}</p><p className="mt-1 text-[11px] text-muted-foreground">{observation.releaseState === "RELEASED_IN_COUNSELING" ? "Discussed in counseling" : "Private rater observation"}</p></div></div></label>)}</div><button type="button" disabled={selected.size === 0 || generating} onClick={() => void generate()} className="rounded border border-primary/40 px-2.5 py-1 text-xs font-medium text-primary disabled:opacity-50">{generating ? "Generating..." : `Generate from selected observations (${selected.size})`}</button>{error && <p className="text-xs text-red-700">{error}</p>}</section>;
}
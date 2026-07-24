"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { ObservationFeedbackType, PerformanceObservation, SectionKey } from "@/types/evaluation";

const DIMENSIONS: SectionKey[] = ["CHARACTER", "PRESENCE", "INTELLECT", "LEADS", "DEVELOPS", "ACHIEVES"];
const FEEDBACK_OPTIONS: ObservationFeedbackType[] = ["POSITIVE", "DEVELOPMENTAL", "NEUTRAL"];

type Goal = { id: string; sectionKey: SectionKey; title: string; approvalStatus: string };
type CounselingSession = { id: string; type: string; sessionDate: string };

export function PerformanceObservationsPanel({ formId, isAssignedRater }: { formId: string; isAssignedRater: boolean }) {
  const [observations, setObservations] = useState<PerformanceObservation[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ goalId: "", sectionKey: "LEADS" as SectionKey, feedbackType: "NEUTRAL" as ObservationFeedbackType, factualNote: "", tags: "" });

  async function load() {
    setLoading(true);
    try {
      const [observationData, nextGoals, counseling] = await Promise.all([
        api.get<{ observations: PerformanceObservation[] }>(`/support-forms/${formId}/observations`),
        api.get<Goal[]>(`/support-forms/${formId}/goals`),
        api.get<{ sessions: CounselingSession[] }>(`/support-forms/${formId}/counseling-dates`),
      ]);
      setObservations(observationData.observations);
      setGoals(nextGoals.filter((goal) => goal.approvalStatus === "APPROVED"));
      setSessions(counseling.sessions);
    } catch {
      setError("Unable to load performance observations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [formId]);

  async function record() {
    if (!form.factualNote.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/support-forms/${formId}/observations`, {
        goalId: form.goalId || null,
        sectionKey: form.sectionKey,
        feedbackType: form.feedbackType,
        factualNote: form.factualNote.trim(),
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 2),
      });
      setForm({ goalId: "", sectionKey: "LEADS", feedbackType: "NEUTRAL", factualNote: "", tags: "" });
      await load();
    } catch {
      setError("Unable to record this observation. Confirm you are the assigned rater.");
    } finally {
      setSaving(false);
    }
  }

  async function release(observationId: string, counselingSessionId: string) {
    if (!counselingSessionId) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/support-forms/${formId}/observations/${observationId}/release`, { counselingSessionId });
      await load();
    } catch {
      setError("Unable to release this observation through counseling.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="rounded-sm border border-border p-4 text-sm text-muted-foreground">Loading performance observations...</div>;

  return (
    <section className="space-y-4 rounded-sm border border-border bg-card p-4" aria-label="Performance observations">
      <div>
        <h2 className="font-semibold">Performance Observations</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAssignedRater
            ? "Rater-owned factual observations stay private until discussed in counseling."
            : "Observations shared here were released through counseling by the assigned rater."}
        </p>
      </div>

          {(goals.length < 3 || goals.length > 5) && <p className="rounded-sm border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"><strong>{goals.length} approved active goals.</strong> Focus works best with 3-5 approved active goals. This is advisory and does not block the rating workflow.</p>}

      {isAssignedRater && (
        <div className="grid gap-3 border-t border-border pt-4 md:grid-cols-2">
          <label className="text-sm font-medium">Approved goal (optional)<select value={form.goalId} onChange={(event) => setForm((current) => ({ ...current, goalId: event.target.value }))} className="mt-1 block w-full rounded-sm border border-input bg-background p-2"><option value="">Not linked to a goal</option>{goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></label>
          <label className="text-sm font-medium">Leadership dimension<select value={form.sectionKey} onChange={(event) => setForm((current) => ({ ...current, sectionKey: event.target.value as SectionKey }))} className="mt-1 block w-full rounded-sm border border-input bg-background p-2">{DIMENSIONS.map((dimension) => <option key={dimension} value={dimension}>{dimension}</option>)}</select></label>
          <label className="text-sm font-medium">Feedback type<select value={form.feedbackType} onChange={(event) => setForm((current) => ({ ...current, feedbackType: event.target.value as ObservationFeedbackType }))} className="mt-1 block w-full rounded-sm border border-input bg-background p-2">{FEEDBACK_OPTIONS.map((type) => <option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</option>)}</select></label>
          <label className="text-sm font-medium">Tags (up to 2)<input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="readiness, counseling" className="mt-1 block w-full rounded-sm border border-input bg-background p-2" /></label>
          <label className="text-sm font-medium md:col-span-2">Factual observation<textarea value={form.factualNote} onChange={(event) => setForm((current) => ({ ...current, factualNote: event.target.value }))} placeholder="What happened, when, and what the leader directly observed." className="mt-1 min-h-24 w-full rounded-sm border border-input bg-background p-2" /></label>
          <div className="md:col-span-2"><Button disabled={saving || !form.factualNote.trim()} onClick={() => void record()}>Record observation</Button></div>
        </div>
      )}

      {error && <p className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {observations.length === 0 ? <p className="text-sm text-muted-foreground">No performance observations have been recorded for this period.</p> : (
        <div className="space-y-3">
          {observations.map((observation) => (
            <article key={observation.id} className="rounded-sm border border-border p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2"><div className="flex flex-wrap gap-1.5"><span className="rounded-sm bg-muted px-2 py-0.5 text-xs font-medium">{observation.sectionKey}</span><span className="rounded-sm bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">{observation.feedbackType.toLowerCase()}</span><span className={observation.releaseState === "RELEASED_IN_COUNSELING" ? "rounded-sm bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800" : "rounded-sm bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"}>{observation.releaseState === "RELEASED_IN_COUNSELING" ? "Discussed in counseling" : "Private until counseling"}</span></div><span className="text-xs text-muted-foreground">Observed {new Date(observation.occurredAt).toLocaleDateString()}</span></div>
              <p className="mt-2">{observation.factualNote}</p>
              <p className="mt-2 text-xs text-muted-foreground">Recorded by {observation.observer ? `${observation.observer.rank} ${observation.observer.lastName}` : "assigned rater"}{observation.goal ? ` · Goal: ${observation.goal.title}` : ""}</p>
              {observation.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{observation.tags.map((tag) => <span key={tag} className="rounded-sm bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{tag}</span>)}</div>}
              {isAssignedRater && observation.releaseState === "PRIVATE_TO_RATER" && (
                <label className="mt-3 block text-xs font-medium">Discuss and release through counseling<select defaultValue="" onChange={(event) => { if (event.target.value) void release(observation.id, event.target.value); }} disabled={saving || sessions.length === 0} className="mt-1 block w-full rounded-sm border border-input bg-background p-2 text-sm"><option value="">{sessions.length ? "Choose a counseling session" : "No counseling session available"}</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.type === "INITIAL" ? "Initial" : "Quarterly"} counseling - {new Date(session.sessionDate).toLocaleDateString()}</option>)}</select></label>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
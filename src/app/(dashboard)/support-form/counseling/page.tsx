"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { PerformanceObservation, SupportFormEntry } from "@/types/evaluation";

interface CounselingSession {
  id: string;
  type: "INITIAL" | "QUARTERLY";
  sessionDate: string;
  notes: string | null;
  officialRecordReference: string | null;
  officialRecordUrl: string | null;
}

interface GoalWorkspaceItem {
  id: string;
  sectionKey: string;
  title: string;
  description: string;
  soldierAssessment: string | null;
  raterAssessment: string | null;
  linkedEntries: Array<{ supportFormEntry: SupportFormEntry }>;
  counselingDiscussions: Array<{ note: string | null; percentAchieved: number | null }>;
}

interface Workspace {
  currentSession: CounselingSession | null;
  priorSession: CounselingSession | null;
  sessions: CounselingSession[];
  periodStart: string;
  periodEnd: string;
  goals: GoalWorkspaceItem[];
  entries: SupportFormEntry[];
  observations: PerformanceObservation[];
  canManage: boolean;
  focusAdvisory: { approvedGoalCount: number; message: string } | null;
}

export default function CounselingWorkspacePage() {
  return <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading counseling workspace...</p>}><CounselingWorkspaceContent /></Suspense>;
}

function CounselingWorkspaceContent() {
  const searchParams = useSearchParams();
  const formId = searchParams.get("formId");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcomeSummary, setOutcomeSummary] = useState("");
  const [officialRecordReference, setOfficialRecordReference] = useState("");
  const [officialRecordUrl, setOfficialRecordUrl] = useState("");

  async function load(sessionId?: string) {
    if (!formId) return;
    setLoading(true);
    setError(null);
    try {
      const suffix = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
      setWorkspace(await api.get<Workspace>(`/support-forms/${formId}/counseling-workspace${suffix}`));
    } catch {
      setError("Unable to load the counseling workspace.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [formId]);

  async function createQuarterlySession() {
    if (!formId) return;
    setSaving(true);
    try {
      const session = await api.post<CounselingSession>(`/support-forms/${formId}/counseling-sessions`, { type: "QUARTERLY", notes: outcomeSummary.trim() || undefined, officialRecordReference: officialRecordReference.trim() || undefined, officialRecordUrl: officialRecordUrl.trim() || undefined });
      setOutcomeSummary("");
      setOfficialRecordReference("");
      setOfficialRecordUrl("");
      await load(session.id);
    } catch {
      setError("Unable to record a quarterly counseling session.");
    } finally {
      setSaving(false);
    }
  }

  async function releaseObservation(observationId: string) {
    if (!formId || !workspace?.currentSession) return;
    setSaving(true);
    try {
      await api.post(`/support-forms/${formId}/observations/${observationId}/release`, { counselingSessionId: workspace.currentSession.id });
      await load(workspace.currentSession.id);
    } catch {
      setError("Unable to mark this observation discussed in counseling.");
    } finally {
      setSaving(false);
    }
  }

  if (!formId) return <div className="p-6"><p className="rounded-sm border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Choose a support form before opening counseling.</p></div>;
  if (loading) return <p className="p-6 text-sm text-muted-foreground">Loading counseling workspace...</p>;
  if (!workspace) return <div className="p-6"><p className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error ?? "Counseling workspace is unavailable."}</p></div>;

  const linkedEntryIds = new Set(workspace.goals.flatMap((goal) => goal.linkedEntries.map((link) => link.supportFormEntry.id)));
  const linkedObservationIds = new Set(workspace.observations.filter((observation) => observation.goalId).map((observation) => observation.id));
  const unlinkedEntries = workspace.entries.filter((entry) => entry.entryType === "ACCOMPLISHMENT" && !linkedEntryIds.has(entry.id));
  const unlinkedObservations = workspace.observations.filter((observation) => !linkedObservationIds.has(observation.id));

  return (
    <main className="space-y-5 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Counseling Preparation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Prepare and reconcile performance evidence for one official counseling event. MERIT does not replace the required DA Form 4856 or unit counseling record.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href={`/support-form?formId=${formId}`}>Back to Support Form</Link></Button>
          <Button variant="outline" asChild><Link href={`/support-form/goals?formId=${formId}`}>Goals and Progress</Link></Button>
        </div>
      </header>

      {workspace.focusAdvisory && <section className="rounded-sm border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>{workspace.focusAdvisory.approvedGoalCount} approved active goals.</strong> {workspace.focusAdvisory.message}</section>}
      {error && <p className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <section className="rounded-sm border border-border bg-card p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">Official counseling checkpoint</h2>
            <p className="mt-1 text-sm text-muted-foreground">{workspace.currentSession ? `${workspace.currentSession.type === "INITIAL" ? "Initial" : "Quarterly"} session on ${new Date(workspace.currentSession.sessionDate).toLocaleDateString()}` : "No counseling session has been recorded yet."}</p>
            <p className="mt-1 text-xs text-muted-foreground">Evidence window: {new Date(workspace.periodStart).toLocaleDateString()} through {new Date(workspace.periodEnd).toLocaleDateString()}</p>
          </div>
          {workspace.sessions.length > 0 && <label className="text-sm font-medium">Review session<select value={workspace.currentSession?.id ?? ""} onChange={(event) => void load(event.target.value)} className="mt-1 block rounded-sm border border-input bg-background p-2"><option value="">Most recent session</option>{workspace.sessions.map((session) => <option key={session.id} value={session.id}>{session.type === "INITIAL" ? "Initial" : "Quarterly"} - {new Date(session.sessionDate).toLocaleDateString()}</option>)}</select></label>}
        </div>
        {workspace.currentSession?.officialRecordUrl && <p className="mt-3 text-sm"><a href={workspace.currentSession.officialRecordUrl} target="_blank" rel="noreferrer" className="text-primary underline">Open official counseling record</a></p>}
        {workspace.currentSession?.officialRecordReference && <p className="mt-1 text-xs text-muted-foreground">Official record reference: {workspace.currentSession.officialRecordReference}</p>}
        {workspace.canManage && <div className="mt-4 border-t border-border pt-4"><p className="text-sm font-medium">Record official counseling outcome</p><p className="mt-1 text-xs text-muted-foreground">Complete the DA Form 4856 or your unit's official counseling record once. Use MERIT only to link that record, reconcile the discussed evidence, and release observations actually discussed.</p><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-sm font-medium">Official record reference (optional)<input value={officialRecordReference} onChange={(event) => setOfficialRecordReference(event.target.value)} placeholder="e.g. DA 4856, 22 JUL 2026" className="mt-1 block w-full rounded-sm border border-input bg-background p-2" /></label><label className="text-sm font-medium">Official record link (optional)<input type="url" value={officialRecordUrl} onChange={(event) => setOfficialRecordUrl(event.target.value)} placeholder="https://..." className="mt-1 block w-full rounded-sm border border-input bg-background p-2" /></label></div><label className="mt-3 block text-sm font-medium">MERIT outcome summary (optional)<textarea value={outcomeSummary} onChange={(event) => setOutcomeSummary(event.target.value)} placeholder="Short traceability summary only: evidence discussed, commitments, and follow-up." className="mt-1 min-h-20 w-full rounded-sm border border-input bg-background p-2" /></label><Button className="mt-2" disabled={saving} onClick={() => void createQuarterlySession()}>Record official counseling outcome</Button></div>}
      </section>

      <section className="space-y-3">
        <div><h2 className="font-semibold">Approved Goal Baseline</h2><p className="mt-1 text-sm text-muted-foreground">Soldier and rater assessments remain separate. Counseling documents the review; it does not assign an official rating.</p></div>
        {workspace.goals.length === 0 ? <p className="rounded-sm border border-dashed border-border p-4 text-sm text-muted-foreground">No approved goals are available for this period.</p> : workspace.goals.map((goal) => (
          <article key={goal.id} className="rounded-sm border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-muted-foreground">{goal.sectionKey}</p><h3 className="font-semibold">{goal.title}</h3><p className="mt-1 text-sm">{goal.description}</p></div><div className="text-xs text-muted-foreground">Soldier: {goal.soldierAssessment?.replaceAll("_", " ") ?? "not assessed"}<br />Rater: {goal.raterAssessment?.replaceAll("_", " ") ?? "not assessed"}</div></div>
            <div className="mt-3 grid gap-3 md:grid-cols-2"><div><p className="text-xs font-semibold uppercase text-muted-foreground">Linked accomplishments</p>{goal.linkedEntries.length ? goal.linkedEntries.map((link) => <p key={link.supportFormEntry.id} className="mt-1 text-sm">{link.supportFormEntry.rawText}</p>) : <p className="mt-1 text-sm text-muted-foreground">No linked accomplishments.</p>}</div><div><p className="text-xs font-semibold uppercase text-muted-foreground">Counseling record</p>{goal.counselingDiscussions.length ? goal.counselingDiscussions.map((discussion, index) => <p key={index} className="mt-1 text-sm">{discussion.percentAchieved ?? "No"}% progress {discussion.note ? `- ${discussion.note}` : ""}</p>) : <p className="mt-1 text-sm text-muted-foreground">No discussion recorded for this session.</p>}</div></div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <EvidenceList title="Unlinked Soldier Accomplishments" empty="All period accomplishments are linked to a goal or none were recorded." items={unlinkedEntries.map((entry) => ({ id: entry.id, title: entry.rawText, detail: `${entry.section} · ${entry.artifacts.length} artifact${entry.artifacts.length === 1 ? "" : "s"}` }))} />
        <EvidenceList title="Unlinked Rater Observations" empty="All visible observations are linked to a goal or none were recorded." items={unlinkedObservations.map((observation) => ({ id: observation.id, title: observation.factualNote, detail: `${observation.sectionKey} · ${observation.feedbackType.toLowerCase()} · ${observation.releaseState === "RELEASED_IN_COUNSELING" ? "discussed" : "private"}` }))} />
      </section>

      <section className="space-y-3">
        <div><h2 className="font-semibold">Rater Observations Since Prior Counseling</h2><p className="mt-1 text-sm text-muted-foreground">Discussion releases an observation to the rated Soldier without changing its original author, text, or timestamp.</p></div>
        {workspace.observations.length === 0 ? <p className="rounded-sm border border-dashed border-border p-4 text-sm text-muted-foreground">No visible observations in this counseling window.</p> : workspace.observations.map((observation) => <article key={observation.id} className="rounded-sm border border-border bg-card p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{observation.factualNote}</p><p className="mt-1 text-xs text-muted-foreground">{observation.observer ? `${observation.observer.rank} ${observation.observer.lastName}` : "Assigned rater"} · {new Date(observation.occurredAt).toLocaleDateString()} · {observation.goal ? `Goal: ${observation.goal.title}` : "Not linked to a goal"}</p></div><span className={observation.releaseState === "RELEASED_IN_COUNSELING" ? "rounded-sm bg-emerald-50 px-2 py-1 text-xs text-emerald-800" : "rounded-sm bg-amber-50 px-2 py-1 text-xs text-amber-800"}>{observation.releaseState === "RELEASED_IN_COUNSELING" ? "Discussed" : "Private"}</span></div>{workspace.canManage && observation.releaseState === "PRIVATE_TO_RATER" && workspace.currentSession && <Button className="mt-3" size="sm" variant="outline" disabled={saving} onClick={() => void releaseObservation(observation.id)}>Mark discussed in this counseling</Button>}</article>)}
      </section>
    </main>
  );
}

function EvidenceList({ title, empty, items }: { title: string; empty: string; items: Array<{ id: string; title: string; detail: string }> }) {
  return <section className="rounded-sm border border-border bg-card p-4"><h2 className="font-semibold">{title}</h2>{items.length ? <div className="mt-3 space-y-2">{items.map((item) => <div key={item.id} className="border-l-2 border-primary/40 pl-3"><p className="text-sm">{item.title}</p><p className="text-xs text-muted-foreground">{item.detail}</p></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">{empty}</p>}</section>;
}

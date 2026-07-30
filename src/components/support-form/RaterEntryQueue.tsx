"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, FileText, HelpCircle, RefreshCw, XCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import type { EntryConfirmationStatus, SupportFormEntryArtifact } from "@/types/evaluation";

interface QueueEntry {
  id: string;
  supportFormId: string;
  entryDate: string;
  createdAt: string;
  section: string;
  rawText: string;
  confirmationStatus: EntryConfirmationStatus;
  submissionSource: "MERIT_PLATFORM" | "MOBILE_CAPTURE";
  artifacts: SupportFormEntryArtifact[];
  createdByUser: { id: string; firstName: string; lastName: string; rank: string } | null;
  goalLinks: Array<{ goal: { id: string; title: string; sectionKey: string } }>;
  supportForm: { soldier: { id: string; firstName: string; lastName: string; rank: string } };
}

export function RaterEntryQueue() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clarifyingId, setClarifyingId] = useState<string | null>(null);
  const [clarificationNote, setClarificationNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await api.get<QueueEntry[]>("/support-forms/rater-queue");
      setEntries(next);
      setError(null);
    } catch {
      setError("Unable to load the rater entry queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15_000);
    return () => window.clearInterval(poll);
  }, [load]);

  async function disposition(entryId: string, status: EntryConfirmationStatus, note?: string) {
    setBusyId(entryId);
    setError(null);
    try {
      await api.patch(`/support-forms/entries/${entryId}/confirm`, { status, clarificationNote: note });
      setEntries((current) => current.filter((entry) => entry.id !== entryId));
      setClarifyingId(null);
      setClarificationNote("");
    } catch {
      setError("The rater disposition was not saved. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function reprocess(artifactId: string) {
    setBusyId(artifactId);
    try {
      await api.post(`/support-forms/artifacts/${artifactId}/reprocess`, {});
      setEntries((current) => current.map((entry) => ({
        ...entry,
        artifacts: entry.artifacts.map((artifact) => artifact.id === artifactId
          ? { ...artifact, aiCaptionStatus: "PENDING", aiCaptionError: null }
          : artifact),
      })));
    } catch {
      setError("Evidence analysis could not be restarted. The original evidence remains available.");
    } finally {
      setBusyId(null);
    }
  }

  if (!loading && entries.length === 0 && !error) return null;

  return (
    <section className="space-y-3 border-y border-border py-4" aria-labelledby="rater-entry-queue-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Assigned rater queue</p>
          <h2 id="rater-entry-queue-title" className="text-lg font-semibold">Unreviewed mobile entries</h2>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Entries captured in the field appear here as the same support-form record used throughout MERIT.</p>
      {error && <p className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading assigned entries…</p>}
      {entries.map((entry) => (
        <article key={entry.id} className="border-l-4 border-l-primary bg-muted/20 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold">{entry.supportForm.soldier.rank} {entry.supportForm.soldier.lastName}</span>
                <span className="rounded-sm bg-zinc-100 px-2 py-0.5">{entry.section}</span>
                {entry.submissionSource === "MOBILE_CAPTURE" && <span className="inline-flex items-center gap-1 rounded-sm bg-blue-50 px-2 py-0.5 font-medium text-blue-800"><Camera className="h-3 w-3" />Captured on mobile</span>}
                <span className="rounded-sm bg-amber-50 px-2 py-0.5 font-medium text-amber-800">Unreviewed</span>
              </div>
              <p className="mt-2 text-sm">{entry.rawText}</p>
            </div>
            <time className="text-xs text-muted-foreground" dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString()}</time>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Submitted by {entry.createdByUser ? `${entry.createdByUser.rank} ${entry.createdByUser.firstName} ${entry.createdByUser.lastName}` : "rated Soldier"}</p>
          {entry.goalLinks.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{entry.goalLinks.map(({ goal }) => <span key={goal.id} className="rounded-sm border border-primary/30 bg-primary/5 px-2 py-1 text-xs text-primary">Goal: {goal.title}</span>)}</div>}
          {entry.artifacts.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{entry.artifacts.map((artifact) => <div key={artifact.id} className="flex items-center gap-2 border border-border bg-background p-2 text-xs">{artifact.fileType === "image" ? <a href={artifact.fileUrl} target="_blank" rel="noreferrer"><img src={artifact.fileUrl} alt="Submitted evidence" className="h-14 w-14 object-cover" /></a> : <a href={artifact.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary"><FileText className="h-4 w-4" />Open PDF</a>}<div><p className="font-medium">{artifact.type.replaceAll("_", " ").toLowerCase()}</p><p className="text-muted-foreground">{artifact.aiCaptionStatus === "PENDING" ? "Analyzing evidence" : artifact.aiCaptionStatus === "COMPLETE" ? "Analysis complete" : "Analysis failed - evidence available"}</p>{artifact.flaggedByServiceMember && <p className="mt-1 inline-flex items-center gap-1 text-amber-700"><AlertTriangle className="h-3 w-3" />Disclosure: {artifact.flagNote}</p>}{artifact.aiCaptionStatus === "FAILED" && <button className="mt-1 block font-medium text-primary underline" disabled={busyId === artifact.id} onClick={() => void reprocess(artifact.id)}>Retry analysis</button>}</div></div>)}</div>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={busyId === entry.id} onClick={() => void disposition(entry.id, "CONFIRMED")}><CheckCircle2 className="h-4 w-4" />Confirm</Button>
            <Button size="sm" variant="outline" disabled={busyId === entry.id} onClick={() => setClarifyingId(entry.id)}><HelpCircle className="h-4 w-4" />Needs clarification</Button>
            <Button size="sm" variant="ghost" disabled={busyId === entry.id} onClick={() => void disposition(entry.id, "NOT_USED")}><XCircle className="h-4 w-4" />Not used</Button>
          </div>
          {clarifyingId === entry.id && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input aria-label="Clarification note" value={clarificationNote} onChange={(event) => setClarificationNote(event.target.value)} placeholder="Tell the Soldier exactly what needs clarification" className="min-h-9 flex-1 rounded-sm border border-input bg-background px-3 text-sm" /><Button size="sm" disabled={!clarificationNote.trim() || busyId === entry.id} onClick={() => void disposition(entry.id, "NEEDS_CLARIFICATION", clarificationNote.trim())}>Send request</Button><Button size="sm" variant="ghost" onClick={() => { setClarifyingId(null); setClarificationNote(""); }}>Cancel</Button></div>}
        </article>
      ))}
    </section>
  );
}
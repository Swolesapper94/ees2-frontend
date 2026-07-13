"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";
import type { ArtifactType, SupportForm, SupportFormEntry } from "@/types/evaluation";
import { AlertTriangle, Award, FileText, Image as ImageIcon, Paperclip, Plus } from "lucide-react";

const SECTION_LABELS: Record<string, string> = {
  CHARACTER: "Character",
  PRESENCE: "Presence",
  INTELLECT: "Intellect",
  LEADS: "Leads",
  DEVELOPS: "Develops",
  ACHIEVES: "Achieves",
};

const ARTIFACT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CERTIFICATE: Award,
  SCORE_SHEET: FileText,
  PHOTO: ImageIcon,
  DOCUMENT: FileText,
  OTHER: Paperclip,
};

interface CurrentUser {
  id: string;
  roles: string[];
}

interface AssignmentCandidate {
  id: string;
  ratingSchemeAssignmentId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  ratedSoldier: { id: string; firstName: string; lastName: string; rank: string; mos: string };
  rater: { firstName: string; lastName: string; rank: string };
  seniorRater: { firstName: string; lastName: string; rank: string };
}

interface FormOption {
  form: SupportForm;
  assignment: AssignmentCandidate | null;
}

function StartSupportFormModal({ candidates, onClose, onCreated }: { candidates: AssignmentCandidate[]; onClose: () => void; onCreated: (form: SupportForm, assignment: AssignmentCandidate) => void }) {
  const [candidateId, setCandidateId] = useState(candidates[0]?.id ?? "");
  const [dutyTitle, setDutyTitle] = useState("");
  const [dutyMosc, setDutyMosc] = useState("");
  const [periodStart, setPeriodStart] = useState(candidates[0]?.effectiveFrom.slice(0, 10) ?? "");
  const [periodEnd, setPeriodEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const candidate = candidates.find((item) => item.id === candidateId) ?? null;

  function selectCandidate(id: string) {
    const selected = candidates.find((item) => item.id === id);
    setCandidateId(id);
    setPeriodStart(selected?.effectiveFrom.slice(0, 10) ?? "");
  }

  async function create() {
    if (!candidate || !dutyTitle.trim() || !periodStart) return;
    setSaving(true);
    setError(null);
    try {
      const form = await api.post<SupportForm>("/support-forms", {
        ratingChainId: candidate.id,
        ratingSchemeAssignmentId: candidate.ratingSchemeAssignmentId,
        ratingPeriodStart: periodStart,
        ratingPeriodEnd: periodEnd || undefined,
        dutyTitle: dutyTitle.trim(),
        dutyMosc: dutyMosc.trim() || undefined,
      });
      onCreated(form, candidate);
      onClose();
    } catch {
      setError("Unable to start this support form. Confirm the assignment is current and does not already have an active form.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="start-support-form-title"><div className="w-full max-w-xl rounded-sm border border-border bg-background shadow-modal"><div className="border-b border-border px-5 py-4"><h2 id="start-support-form-title" className="text-lg font-semibold">Start Support Form</h2><p className="mt-1 text-sm text-muted-foreground">Create a performance log for one current rating assignment. The rated Soldier and assigned rater can add entries afterward.</p></div><div className="space-y-4 p-5">{error && <p className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="block text-sm font-medium">Rating assignment<select aria-label="Rating assignment" value={candidateId} onChange={(event) => selectCandidate(event.target.value)} className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2">{candidates.map((item) => <option key={item.id} value={item.id}>{item.ratedSoldier.rank} {item.ratedSoldier.lastName}, {item.ratedSoldier.firstName} - Rater: {item.rater.rank} {item.rater.lastName}</option>)}</select></label>{candidate && <p className="rounded-sm border border-border bg-muted/30 p-3 text-xs text-muted-foreground">Senior Rater: {candidate.seniorRater.rank} {candidate.seniorRater.lastName} · Effective from {new Date(candidate.effectiveFrom).toLocaleDateString()}</p>}<div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Duty title<input value={dutyTitle} onChange={(event) => setDutyTitle(event.target.value)} placeholder="e.g. Squad Leader" className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" /></label><label className="text-sm font-medium">Duty MOSC <span className="font-normal text-muted-foreground">(if applicable)</span><input value={dutyMosc} onChange={(event) => setDutyMosc(event.target.value)} placeholder={candidate?.ratedSoldier.mos ?? "MOS"} className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" /></label><label className="text-sm font-medium">Rating period start<input aria-label="Support form rating period start" type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" /></label><label className="text-sm font-medium">Rating period end <span className="font-normal text-muted-foreground">(optional)</span><input aria-label="Support form rating period end" type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" /></label></div></div><div className="flex justify-end gap-3 border-t border-border px-5 py-4"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={create} disabled={saving || !candidate || !dutyTitle.trim() || !periodStart}>{saving ? "Starting..." : "Start support form"}</Button></div></div></div>;
}

export default function SupportFormPage() {
  const searchParams = useSearchParams();
  const formId = searchParams.get("formId");
  const assisting = searchParams.get("assisting");
  const [entries, setEntries] = useState<SupportFormEntry[]>([]);
  const [form, setForm] = useState<SupportForm | null>(null);
  const [formOptions, setFormOptions] = useState<FormOption[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [assistanceMessage, setAssistanceMessage] = useState<string | null>(null);
  const [showStartForm, setShowStartForm] = useState(false);
  const [candidates, setCandidates] = useState<AssignmentCandidate[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get<CurrentUser>("/users/me");
        setCurrentUserId(me.id);
        const [soldierCandidates, raterCandidates] = await Promise.all([
          api.get<AssignmentCandidate[]>("/rating-chains?purpose=evaluation-creation&role=soldier"),
          api.get<AssignmentCandidate[]>("/rating-chains?purpose=evaluation-creation&role=rater"),
        ]);
        const assignmentCandidates = [...soldierCandidates, ...raterCandidates].filter((candidate, index, all) => all.findIndex((item) => item.id === candidate.id) === index);
        setCandidates(assignmentCandidates);
        const active = formId
          ? await api.get<SupportForm>(`/support-forms/${formId}`)
          : (() => undefined)();
        if (active) {
          setForm(active);
          setEntries(active.entries ?? []);
          return;
        }
        const optionLists = await Promise.all(assignmentCandidates.map(async (candidate) => ({ assignment: candidate, forms: await api.get<SupportForm[]>(`/support-forms?soldierId=${candidate.ratedSoldier.id}`) })));
        const options = optionLists.flatMap(({ assignment, forms }) => forms.filter((item) => item.isActive && item.status !== "CONSUMED").map((item) => ({ form: item, assignment })));
        setFormOptions(options);
        const preferred = options.find((option) => option.form.soldierId === me.id) ?? options[0] ?? null;
        setForm(preferred?.form ?? null);
        setEntries(preferred?.form.entries ?? []);
      } catch {
        setError("Failed to load support form.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function selectForm(nextId: string) {
    const next = formOptions.find((option) => option.form.id === nextId)?.form ?? null;
    setForm(next);
    setEntries(next?.entries ?? []);
    setEditingEntryId(null);
  }

  async function saveDraftEntry(entryId: string) {
    if (!editingText.trim()) return;
    try {
      const updated = await api.patch<SupportFormEntry>(`/support-forms/entries/${entryId}`, { rawText: editingText.trim() });
      setEntries((current) => current.map((entry) => entry.id === entryId ? { ...entry, ...updated } : entry));
      setEditingEntryId(null);
    } catch {
      setError("Unable to update this draft entry.");
    }
  }

  async function organizeArtifact(entryId: string, artifactId: string, type: ArtifactType) {
    try {
      const updated = await api.patch<{ id: string; type: ArtifactType }>(`/support-forms/artifacts/${artifactId}`, { type });
      setEntries((current) => current.map((entry) => entry.id === entryId
        ? { ...entry, artifacts: entry.artifacts.map((artifact) => artifact.id === artifactId ? { ...artifact, ...updated } : artifact) }
        : entry));
    } catch {
      setError("Unable to organize this artifact.");
    }
  }

  async function requestSoldierReview() {
    if (!form) return;
    try {
      await api.post(`/support-forms/${form.id}/review-requests`, { recipient: "SOLDIER" });
      setAssistanceMessage("Review request sent to the rated Soldier.");
    } catch {
      setAssistanceMessage("This grant does not permit requesting the Soldier's review.");
    }
  }

  async function remindRater() {
    if (!form) return;
    try {
      await api.post(`/support-forms/${form.id}/reminders`, {
        recipient: "RATER",
        note: "Please review the current support-form draft when available.",
      });
      setAssistanceMessage("Workflow reminder sent to the rater.");
    } catch {
      setAssistanceMessage("This grant does not permit sending a workflow reminder.");
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Form</h1>
          <p className="text-sm text-muted-foreground">
            Continuous performance log — objectives and accomplishments.
          </p>
        </div>
        <div className="flex items-center gap-2">
        {candidates.length > 0 && <Button variant="outline" onClick={() => setShowStartForm(true)}><Plus className="h-4 w-4" />Start form</Button>}
        {form ? (
          <Button asChild>
            <Link href={`/support-form/entry/new?formId=${form.id}${assisting ? `&assisting=${encodeURIComponent(assisting)}` : ""}`}>Log entry</Link>
          </Button>
        ) : (
          <Button disabled>Log entry</Button>
        )}
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {assisting && form && (
        <div className="mb-4 rounded-sm border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <p>You are assisting the rated Soldier on this scoped support form. All actions are recorded under your identity. You cannot acknowledge, sign, make rating decisions, or confirm evidence on their behalf.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={requestSoldierReview}>Request Soldier review</Button>
            <Button type="button" variant="outline" size="sm" onClick={remindRater}>Remind rater</Button>
          </div>
          {assistanceMessage && <p className="mt-2 text-xs">{assistanceMessage}</p>}
        </div>
      )}

      {!loading && !error && formOptions.length > 1 && <div className="mb-4 rounded-sm border border-border bg-muted/20 p-3"><label className="block text-sm font-medium">Working support form<select aria-label="Working support form" value={form?.id ?? ""} onChange={(event) => selectForm(event.target.value)} className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm">{formOptions.map((option) => <option key={option.form.id} value={option.form.id}>{option.assignment?.ratedSoldier.rank} {option.assignment?.ratedSoldier.lastName} - {option.form.dutyTitle} ({option.form.status ?? "ACTIVE"})</option>)}</select></label></div>}

      {!loading && !error && !form && (
        <div className="rounded-sm border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No active support form is available for your current rating assignments.</p>
          {candidates.length > 0 ? <Button className="mt-4" onClick={() => setShowStartForm(true)}><Plus className="h-4 w-4" />Start support form</Button> : <p className="mt-3 text-xs text-muted-foreground">An effective rating assignment is required before a form can be started.</p>}
        </div>
      )}

      {!loading && !error && form && entries.length === 0 && (
        <div className="rounded-sm border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No entries yet.</p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-sm border border-border bg-card p-4">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-sm bg-muted px-2 py-0.5 text-xs font-medium">
                    {SECTION_LABELS[entry.section] ?? entry.section}
                  </span>
                  <span
                    className={
                      entry.entryType === "ACCOMPLISHMENT"
                        ? "rounded-sm bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                        : "rounded-sm bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                    }
                  >
                    {entry.entryType === "ACCOMPLISHMENT" ? "Accomplishment" : "Objective"}
                  </span>
                  {entry.isHighlight && (
                    <span className="rounded-sm bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      ★ Highlight
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.entryDate).toLocaleDateString()}
                </span>
              </div>
              {editingEntryId === entry.id ? <div className="mt-3 space-y-2"><textarea aria-label="Draft entry text" value={editingText} onChange={(event) => setEditingText(event.target.value)} rows={4} className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm" /><div className="flex gap-2"><Button size="sm" onClick={() => saveDraftEntry(entry.id)}>Save draft</Button><Button size="sm" variant="outline" onClick={() => setEditingEntryId(null)}>Cancel</Button></div></div> : <p className="text-sm">{entry.rawText}</p>}
              {entry.delegationGrantId && entry.createdByUser && entry.assistedUser && (
                <p className="mt-2 rounded-sm border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-900">
                  Drafted by {entry.createdByUser.rank} {entry.createdByUser.firstName} {entry.createdByUser.lastName} while assisting {entry.assistedUser.rank} {entry.assistedUser.firstName} {entry.assistedUser.lastName}.
                </p>
              )}
              {entry.createdByUserId === currentUserId && entry.confirmationStatus === "UNREVIEWED" && !entry.usedInEvalId && editingEntryId !== entry.id && (
                <Button className="mt-3" type="button" variant="outline" size="sm" onClick={() => { setEditingEntryId(entry.id); setEditingText(entry.rawText); }}>Edit draft</Button>
              )}
              {entry.artifacts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {entry.artifacts.map((a) => {
                    const Icon = ARTIFACT_ICONS[a.type] ?? Paperclip;
                    return (
                      <div key={a.id} className="flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-1 text-xs">
                        <a href={a.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary">
                          <Icon className="h-3 w-3" />
                          {a.type.charAt(0) + a.type.slice(1).toLowerCase().replace("_", " ")}
                          {a.flaggedByServiceMember && <AlertTriangle className="h-3 w-3 text-amber-600" />}
                        </a>
                        {assisting && <select aria-label="Artifact type" value={a.type} onChange={(event) => organizeArtifact(entry.id, a.id, event.target.value as ArtifactType)} className="border-l border-border bg-transparent pl-1 text-[11px]"><option value="CERTIFICATE">Certificate</option><option value="SCORE_SHEET">Score sheet</option><option value="PHOTO">Photo</option><option value="DOCUMENT">Document</option><option value="OTHER">Other</option></select>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {showStartForm && <StartSupportFormModal candidates={candidates} onClose={() => setShowStartForm(false)} onCreated={(created, assignment) => { const option = { form: created, assignment }; setFormOptions((current) => [option, ...current]); setForm(created); setEntries(created.entries ?? []); }} />}
    </div>
  );
}


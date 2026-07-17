"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

type Goal = {
  id: string; sectionKey: string; title: string; description: string; approvalStatus: string; revisionNote: string | null;
  category: string | null; targetDate: string | null; soldierAssessment: string | null; raterAssessment: string | null; _count: { linkedEntries: number };
};
type Progress = Goal & { linkedEntries: { supportFormEntry: { id: string; rawText: string; entryDate: string; artifacts: unknown[] } }[]; counselingDiscussions: { counselingSession: { sessionDate: string }; percentAchieved: number | null; note: string | null }[]; progressTrend: { sessionDate: string; percentAchieved: number | null }[] };
type Signals = { density: string | null; counselingStatus: string | null; documentationEquityFlag: string | null; raterContextNote: string | null; lateCluster: boolean | null; lowArtifactDensity: boolean | null };
type FormEntry = { id: string; rawText: string; entryDate: string; entryType?: string };
type Form = { id: string; soldierId: string; entries: FormEntry[]; ratingChain?: { raterId: string } | null; status?: string; disposition?: string; isActive?: boolean; ratingPeriodStart?: string; ratingPeriodEnd?: string };
type Me = { id: string; roles: string[] };
type CounselingSession = { id: string; type: string; sessionDate: string };
type GoalAction = "EDIT" | "REVIEW" | "SELF_ASSESSMENT" | "RATER_ASSESSMENT" | "COUNSELING" | "EVIDENCE" | "CARRY_FORWARD";

const DIMENSIONS = ["CHARACTER", "PRESENCE", "INTELLECT", "LEADS", "DEVELOPS", "ACHIEVES"];
const ASSESSMENTS = ["NOT_STARTED", "IN_PROGRESS", "ACHIEVED", "PARTIALLY_ACHIEVED", "NOT_ACHIEVED"];
const GOAL_CATEGORIES = ["ROUTINE", "PROBLEM_SOLVING", "INNOVATIVE", "PERSONAL_DEVELOPMENT", "OTHER"];

export default function SupportFormGoalsPage() {
  const search = useSearchParams();
  const formId = search.get("formId");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionKey, setSectionKey] = useState("LEADS");
  const [category, setCategory] = useState("ROUTINE");
  const [targetDate, setTargetDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState<Progress | null>(null);
  const [signals, setSignals] = useState<Signals | null>(null);
  const [contextNote, setContextNote] = useState("");
  const [counselingSessions, setCounselingSessions] = useState<CounselingSession[]>([]);
  const [successorForms, setSuccessorForms] = useState<Form[]>([]);
  const [activeAction, setActiveAction] = useState<{ goalId: string; action: GoalAction } | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [assessment, setAssessment] = useState("IN_PROGRESS");
  const [assessmentNote, setAssessmentNote] = useState("");
  const [counselingSessionId, setCounselingSessionId] = useState("");
  const [counselingPercent, setCounselingPercent] = useState("");
  const [counselingNote, setCounselingNote] = useState("");
  const [targetSupportFormId, setTargetSupportFormId] = useState("");
  const [editSectionKey, setEditSectionKey] = useState("LEADS");
  const [editCategory, setEditCategory] = useState("ROUTINE");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");

  async function load() {
    if (!formId) { setError("Select a support form before managing goals."); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const [currentForm, currentUser, currentGoals] = await Promise.all([
        api.get<Form>(`/support-forms/${formId}`), api.get<Me>("/users/me"), api.get<Goal[]>(`/support-forms/${formId}/goals`),
      ]);
      setForm(currentForm); setMe(currentUser); setGoals(currentGoals);
      if (currentUser.id === currentForm.ratingChain?.raterId) {
        const [sessions, forms] = await Promise.all([
          api.get<{ sessions: CounselingSession[] }>(`/support-forms/${formId}/counseling-dates`),
          api.get<Form[]>(`/support-forms?soldierId=${currentForm.soldierId}`),
        ]);
        setCounselingSessions(sessions.sessions);
        setSuccessorForms(forms.filter((candidate) => candidate.id !== currentForm.id && candidate.isActive && candidate.disposition === "ACTIVE" && !["ARCHIVED", "CONSUMED", "QUARANTINED"].includes(candidate.status ?? "")));
      } else {
        setCounselingSessions([]); setSuccessorForms([]);
      }
      if (currentUser.id !== currentForm.soldierId) {
        api.get<Signals>(`/support-forms/${formId}/documentation-signals`).then((next) => { setSignals(next); setContextNote(next.raterContextNote ?? ""); }).catch(() => setSignals(null));
      } else {
        setSignals(null);
      }
    } catch (requestError) { setError(messageFor(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [formId]);

  async function createGoal(event: React.FormEvent) {
    event.preventDefault();
    if (!formId || !title.trim() || !description.trim()) return;
    try {
      await api.post(`/support-forms/${formId}/goals`, { sectionKey, category, title: title.trim(), description: description.trim(), ...(targetDate ? { targetDate } : {}) });
      setTitle(""); setDescription(""); setTargetDate(""); await load();
    } catch (requestError) { setError(messageFor(requestError)); }
  }

  async function submitForReview(goalId: string) {
    if (!formId) return;
    try { await api.post(`/support-forms/${formId}/goals/${goalId}/submit-for-review`); await load(); }
    catch (requestError) { setError(messageFor(requestError)); }
  }

  async function viewProgress(goalId: string) {
    if (!formId) return;
    try { setProgress(await api.get<Progress>(`/support-forms/${formId}/goals/${goalId}/progress`)); }
    catch (requestError) { setError(messageFor(requestError)); }
  }

  async function saveContextNote() {
    if (!formId || !contextNote.trim()) return;
    try {
      const updated = await api.post<Signals & { raterContextNote: string }>(`/support-forms/${formId}/context-note`, { raterContextNote: contextNote.trim() });
      setSignals((current) => current ? { ...current, raterContextNote: updated.raterContextNote } : current);
    } catch (requestError) { setError(messageFor(requestError)); }
  }

  function openAction(goalId: string, action: GoalAction) {
    setActiveAction({ goalId, action }); setRevisionNote(""); setAssessment("IN_PROGRESS"); setAssessmentNote("");
    setCounselingSessionId(counselingSessions[0]?.id ?? ""); setCounselingPercent(""); setCounselingNote(""); setTargetSupportFormId(successorForms[0]?.id ?? "");
    if (action === "EVIDENCE") void viewProgress(goalId);
  }

  function openEdit(goal: Goal) {
    setEditSectionKey(goal.sectionKey); setEditCategory(goal.category ?? "ROUTINE"); setEditTitle(goal.title); setEditDescription(goal.description);
    setEditTargetDate(goal.targetDate?.slice(0, 10) ?? ""); setActiveAction({ goalId: goal.id, action: "EDIT" });
  }

  async function saveGoalEdit(goalId: string) {
    if (!formId || !editTitle.trim() || !editDescription.trim()) return;
    try {
      await api.patch(`/support-forms/${formId}/goals/${goalId}`, { sectionKey: editSectionKey, category: editCategory, title: editTitle.trim(), description: editDescription.trim(), ...(editTargetDate ? { targetDate: editTargetDate } : {}) });
      setActiveAction(null); await load();
    } catch (requestError) { setError(messageFor(requestError)); }
  }

  async function approveGoal(goalId: string) {
    if (!formId) return;
    try { await api.post(`/support-forms/${formId}/goals/${goalId}/approve`, counselingSessionId ? { counselingSessionId } : {}); setActiveAction(null); await load(); }
    catch (requestError) { setError(messageFor(requestError)); }
  }

  async function requestRevision(goalId: string) {
    if (!formId || !revisionNote.trim()) return;
    try { await api.post(`/support-forms/${formId}/goals/${goalId}/request-revision`, { revisionNote: revisionNote.trim() }); setActiveAction(null); await load(); }
    catch (requestError) { setError(messageFor(requestError)); }
  }

  async function saveAssessment(goalId: string, endpoint: "self-assessment" | "rater-assessment") {
    if (!formId) return;
    try { await api.post(`/support-forms/${formId}/goals/${goalId}/${endpoint}`, { assessment, ...(assessmentNote.trim() ? { note: assessmentNote.trim() } : {}) }); setActiveAction(null); await load(); }
    catch (requestError) { setError(messageFor(requestError)); }
  }

  async function saveCounseling(goalId: string) {
    if (!formId || !counselingSessionId) return;
    const percent = counselingPercent.trim() === "" ? undefined : Number(counselingPercent);
    if (percent !== undefined && (!Number.isInteger(percent) || percent < 0 || percent > 100)) { setError("Counseling progress must be a whole number from 0 to 100."); return; }
    try { await api.post(`/support-forms/${formId}/goals/${goalId}/counseling-note`, { counselingSessionId, ...(percent !== undefined ? { percentAchieved: percent } : {}), ...(counselingNote.trim() ? { note: counselingNote.trim() } : {}) }); setActiveAction(null); await viewProgress(goalId); }
    catch (requestError) { setError(messageFor(requestError)); }
  }

  async function linkEntry(goalId: string, entryId: string) {
    if (!formId) return;
    try { await api.post(`/support-forms/${formId}/goals/${goalId}/link-entry`, { supportFormEntryId: entryId }); await viewProgress(goalId); await load(); }
    catch (requestError) { setError(messageFor(requestError)); }
  }

  async function unlinkEntry(goalId: string, entryId: string) {
    if (!formId) return;
    try { await api.delete(`/support-forms/${formId}/goals/${goalId}/link-entry/${entryId}`); await viewProgress(goalId); await load(); }
    catch (requestError) { setError(messageFor(requestError)); }
  }

  async function carryForward(goalId: string) {
    if (!formId || !targetSupportFormId) return;
    try { await api.post(`/support-forms/${formId}/goals/${goalId}/carry-forward`, { targetSupportFormId }); setActiveAction(null); await load(); }
    catch (requestError) { setError(messageFor(requestError)); }
  }

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Loading goals...</p>;
  const canCreate = Boolean(form && me && form.soldierId === me.id);
  const canSetContextNote = Boolean(form && me && form.ratingChain?.raterId === me.id);
  const canManageAsRater = canSetContextNote;
  const canCarryForward = canCreate || canManageAsRater;
  const activeEditGoal = activeAction?.action === "EDIT" ? goals.find((goal) => goal.id === activeAction.goalId) : undefined;
  return <div className="max-w-4xl space-y-5 p-6">
    <div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Goals and Progress</h1><p className="mt-1 text-sm text-muted-foreground">Goals belong to the rated Soldier. Accomplishments can be linked as evidence; rater assessment is authoritative.</p></div>{formId && <Button variant="outline" asChild><Link href={`/support-form?formId=${formId}`}>Back to Support Form</Link></Button>}</div>
    {error && <p className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {signals && <section className="rounded-sm border border-border bg-card p-4"><h2 className="font-semibold">Documentation Signals</h2><p className="mt-1 text-xs text-muted-foreground">Informational process and evidence patterns. These never affect a rating or goal outcome.</p><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-sm bg-muted px-2 py-1">Density: {signals.density ?? "not enough history"}</span><span className="rounded-sm bg-muted px-2 py-1">Counseling: {signals.counselingStatus ?? "not assessed"}</span>{signals.documentationEquityFlag && <span className="rounded-sm bg-amber-100 px-2 py-1 text-amber-900">{signals.documentationEquityFlag.replaceAll("_", " ")}</span>}{signals.lateCluster && <span className="rounded-sm bg-amber-100 px-2 py-1 text-amber-900">Late entry cluster</span>}{signals.lowArtifactDensity && <span className="rounded-sm bg-amber-100 px-2 py-1 text-amber-900">Low artifact density</span>}</div>{canSetContextNote && <><label className="mt-3 block text-sm font-medium">Rater context note<textarea value={contextNote} onChange={(event) => setContextNote(event.target.value)} placeholder="Explain leave, reassignment, or other context for this record." className="mt-1 min-h-20 w-full rounded-sm border border-input bg-background p-2" /></label><Button size="sm" className="mt-2" disabled={!contextNote.trim()} onClick={() => void saveContextNote()}>Save context note</Button></>}</section>}
    {canCreate && <form onSubmit={createGoal} className="grid gap-3 rounded-sm border border-border bg-card p-4 md:grid-cols-2"><h2 className="md:col-span-2 font-semibold">Draft a goal</h2><label className="text-sm font-medium">Dimension<select value={sectionKey} onChange={(event) => setSectionKey(event.target.value)} className="mt-1 block w-full rounded-sm border border-input bg-background p-2">{DIMENSIONS.map((dimension) => <option key={dimension}>{dimension}</option>)}</select></label><label className="text-sm font-medium">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 block w-full rounded-sm border border-input bg-background p-2">{GOAL_CATEGORIES.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label><label className="text-sm font-medium">Short title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className="mt-1 block w-full rounded-sm border border-input bg-background p-2" /></label><label className="text-sm font-medium">Target date (optional)<input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="mt-1 block w-full rounded-sm border border-input bg-background p-2" /></label><label className="text-sm font-medium md:col-span-2">Goal and expectation<textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 min-h-24 w-full rounded-sm border border-input bg-background p-2" /></label><div className="md:col-span-2"><Button disabled={!title.trim() || !description.trim()}>Save draft goal</Button></div></form>}
    <div className="space-y-3">{goals.length === 0 ? <p className="rounded-sm border border-dashed border-border p-4 text-sm text-muted-foreground">No goals have been created for this support form.</p> : goals.map((goal) => {
      const isActive = activeAction?.goalId === goal.id;
      const linkedEntryIds = new Set(progress?.id === goal.id ? progress.linkedEntries.map((link) => link.supportFormEntry.id) : []);
      const carryable = ["IN_PROGRESS", "NOT_ACHIEVED"].includes(goal.raterAssessment ?? goal.soldierAssessment ?? "");
      return <article key={goal.id} className="rounded-sm border border-border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-muted-foreground">{goal.sectionKey}</p><h2 className="font-semibold">{goal.title}</h2></div><span className="rounded-sm bg-muted px-2 py-1 text-xs font-medium">{goal.approvalStatus.replaceAll("_", " ")}</span></div><p className="mt-2 text-sm">{goal.description}</p>{goal.revisionNote && <p className="mt-2 text-sm text-amber-800">Rater revision: {goal.revisionNote}</p>}<div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground"><span>{goal.category?.replaceAll("_", " ") ?? "Uncategorized"}</span>{goal.targetDate && <span>Target: {new Date(`${goal.targetDate.slice(0, 10)}T00:00:00`).toLocaleDateString()}</span>}<span>{goal._count.linkedEntries} linked accomplishment{goal._count.linkedEntries === 1 ? "" : "s"}</span><span>Soldier: {goal.soldierAssessment?.replaceAll("_", " ") ?? "not assessed"}</span><span>Rater: {goal.raterAssessment?.replaceAll("_", " ") ?? "not assessed"}</span></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => void viewProgress(goal.id)}>View progress</Button>{canCreate && ["DRAFT", "NEEDS_REVISION"].includes(goal.approvalStatus) && <Button size="sm" onClick={() => void submitForReview(goal.id)}>Submit for rater review</Button>}{canCreate && <Button size="sm" variant="outline" onClick={() => openAction(goal.id, "SELF_ASSESSMENT")}>Update self-assessment</Button>}{canManageAsRater && goal.approvalStatus === "PENDING_RATER_REVIEW" && <Button size="sm" onClick={() => openAction(goal.id, "REVIEW")}>Review goal</Button>}{canManageAsRater && <Button size="sm" variant="outline" onClick={() => openAction(goal.id, "RATER_ASSESSMENT")}>Record rater assessment</Button>}{canManageAsRater && <Button size="sm" variant="outline" onClick={() => openAction(goal.id, "COUNSELING")}>Record counseling progress</Button>}{(canCreate || canManageAsRater) && <Button size="sm" variant="outline" onClick={() => openAction(goal.id, "EVIDENCE")}>Manage evidence</Button>}{canCarryForward && carryable && <Button size="sm" variant="outline" onClick={() => openAction(goal.id, "CARRY_FORWARD")}>Carry forward</Button>}</div>{isActive && <div className="mt-4 border-t border-border pt-4">{activeAction.action === "REVIEW" && <div className="space-y-3"><p className="text-sm font-medium">Rater review</p><label className="block text-sm">Establish at counseling (optional)<select value={counselingSessionId} onChange={(event) => setCounselingSessionId(event.target.value)} className="mt-1 block w-full rounded-sm border border-input bg-background p-2"><option value="">No linked counseling session</option>{counselingSessions.map((session) => <option key={session.id} value={session.id}>{session.type.replaceAll("_", " ")} - {new Date(session.sessionDate).toLocaleDateString()}</option>)}</select></label><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => void approveGoal(goal.id)}>Approve goal</Button><Button size="sm" variant="outline" onClick={() => setRevisionNote((current) => current || " ")}>Request revision</Button><Button size="sm" variant="ghost" onClick={() => setActiveAction(null)}>Cancel</Button></div>{revisionNote !== "" && <><label className="block text-sm">Revision guidance<textarea value={revisionNote} onChange={(event) => setRevisionNote(event.target.value)} className="mt-1 min-h-20 w-full rounded-sm border border-input bg-background p-2" /></label><Button size="sm" variant="outline" disabled={!revisionNote.trim()} onClick={() => void requestRevision(goal.id)}>Send revision request</Button></>}</div>}{activeAction.action === "SELF_ASSESSMENT" && <AssessmentEditor assessment={assessment} note={assessmentNote} onAssessment={setAssessment} onNote={setAssessmentNote} label="Soldier self-assessment" onSave={() => void saveAssessment(goal.id, "self-assessment")} onCancel={() => setActiveAction(null)} />}{activeAction.action === "RATER_ASSESSMENT" && <AssessmentEditor assessment={assessment} note={assessmentNote} onAssessment={setAssessment} onNote={setAssessmentNote} label="Rater assessment" onSave={() => void saveAssessment(goal.id, "rater-assessment")} onCancel={() => setActiveAction(null)} />}{activeAction.action === "COUNSELING" && <div className="space-y-3"><p className="text-sm font-medium">Counseling progress</p>{counselingSessions.length === 0 ? <p className="text-sm text-muted-foreground">No counseling sessions are recorded for this rating chain yet.</p> : <><label className="block text-sm">Counseling session<select value={counselingSessionId} onChange={(event) => setCounselingSessionId(event.target.value)} className="mt-1 block w-full rounded-sm border border-input bg-background p-2">{counselingSessions.map((session) => <option key={session.id} value={session.id}>{session.type.replaceAll("_", " ")} - {new Date(session.sessionDate).toLocaleDateString()}</option>)}</select></label><label className="block text-sm">Progress percentage<input type="number" min="0" max="100" value={counselingPercent} onChange={(event) => setCounselingPercent(event.target.value)} className="mt-1 block w-full rounded-sm border border-input bg-background p-2" /></label><label className="block text-sm">Counseling note (optional)<textarea value={counselingNote} onChange={(event) => setCounselingNote(event.target.value)} className="mt-1 min-h-20 w-full rounded-sm border border-input bg-background p-2" /></label><Button size="sm" onClick={() => void saveCounseling(goal.id)}>Save counseling progress</Button></>}<Button size="sm" variant="ghost" onClick={() => setActiveAction(null)}>Cancel</Button></div>}{activeAction.action === "EVIDENCE" && <div className="space-y-3"><p className="text-sm font-medium">Linked accomplishments</p>{progress?.id !== goal.id ? <p className="text-sm text-muted-foreground">Loading accomplishments...</p> : <><div className="space-y-2">{progress.linkedEntries.length ? progress.linkedEntries.map((link) => <div key={link.supportFormEntry.id} className="flex items-center justify-between gap-3 text-sm"><span>{new Date(link.supportFormEntry.entryDate).toLocaleDateString()} - {link.supportFormEntry.rawText}</span><Button size="sm" variant="ghost" onClick={() => void unlinkEntry(goal.id, link.supportFormEntry.id)}>Unlink</Button></div>) : <p className="text-sm text-muted-foreground">No accomplishments linked yet.</p>}</div>{form?.entries.filter((entry) => entry.entryType === "ACCOMPLISHMENT" && !linkedEntryIds.has(entry.id)).map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 text-sm"><span>{new Date(entry.entryDate).toLocaleDateString()} - {entry.rawText}</span><Button size="sm" variant="outline" onClick={() => void linkEntry(goal.id, entry.id)}>Link</Button></div>)}</>}<Button size="sm" variant="ghost" onClick={() => setActiveAction(null)}>Close</Button></div>}{activeAction.action === "CARRY_FORWARD" && <div className="space-y-3"><p className="text-sm font-medium">Carry this incomplete goal forward</p>{successorForms.length ? <><label className="block text-sm">Next-period support form<select value={targetSupportFormId} onChange={(event) => setTargetSupportFormId(event.target.value)} className="mt-1 block w-full rounded-sm border border-input bg-background p-2">{successorForms.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.ratingPeriodStart ? new Date(candidate.ratingPeriodStart).toLocaleDateString() : "Next period"} to {candidate.ratingPeriodEnd ? new Date(candidate.ratingPeriodEnd).toLocaleDateString() : "current"}</option>)}</select></label><Button size="sm" onClick={() => void carryForward(goal.id)}>Create carried-forward goal</Button></> : <p className="text-sm text-muted-foreground">No eligible next-period support form is available.</p>}<Button size="sm" variant="ghost" onClick={() => setActiveAction(null)}>Cancel</Button></div>}</div>}</article>;
    })}</div>
    {canCreate && goals.some((goal) => ["DRAFT", "NEEDS_REVISION"].includes(goal.approvalStatus)) && <section className="rounded-sm border border-border bg-card p-4"><h2 className="font-semibold">Revise a draft goal</h2><div className="mt-3 flex flex-wrap gap-2">{goals.filter((goal) => ["DRAFT", "NEEDS_REVISION"].includes(goal.approvalStatus)).map((goal) => <Button key={goal.id} size="sm" variant="outline" onClick={() => openEdit(goal)}>Edit {goal.title}</Button>)}</div></section>}
    {activeEditGoal && <section className="rounded-sm border border-border bg-card p-4"><GoalEditor sectionKey={editSectionKey} category={editCategory} title={editTitle} description={editDescription} targetDate={editTargetDate} onSectionKey={setEditSectionKey} onCategory={setEditCategory} onTitle={setEditTitle} onDescription={setEditDescription} onTargetDate={setEditTargetDate} onSave={() => void saveGoalEdit(activeEditGoal.id)} onCancel={() => setActiveAction(null)} /></section>}
    {progress && <section className="rounded-sm border border-border bg-card p-4"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Progress: {progress.title}</h2><p className="text-xs text-muted-foreground">Single-soldier counseling context. Rater assessment is authoritative.</p></div><Button size="sm" variant="ghost" onClick={() => setProgress(null)}>Close</Button></div><div className="mt-4 grid gap-4 md:grid-cols-2"><div><p className="text-xs font-semibold uppercase text-muted-foreground">Assessment</p><p className="mt-1 text-sm">Soldier: {progress.soldierAssessment?.replaceAll("_", " ") ?? "not assessed"}</p><p className="text-sm">Rater: {progress.raterAssessment?.replaceAll("_", " ") ?? "not assessed"}</p></div><ProgressSparkline values={progress.progressTrend.map((point) => point.percentAchieved)} /></div><div className="mt-4 space-y-2"><p className="text-xs font-semibold uppercase text-muted-foreground">Linked accomplishments</p>{progress.linkedEntries.length ? progress.linkedEntries.map((link) => <div key={link.supportFormEntry.id} className="border-l-2 border-primary/40 pl-3 text-sm">{new Date(link.supportFormEntry.entryDate).toLocaleDateString()} - {link.supportFormEntry.rawText}</div>) : <p className="text-sm text-muted-foreground">No accomplishments linked yet.</p>}</div></section>}
  </div>;
}

function AssessmentEditor({ assessment, note, onAssessment, onNote, label, onSave, onCancel }: { assessment: string; note: string; onAssessment: (value: string) => void; onNote: (value: string) => void; label: string; onSave: () => void; onCancel: () => void }) {
  return <div className="space-y-3"><p className="text-sm font-medium">{label}</p><label className="block text-sm">Assessment<select value={assessment} onChange={(event) => onAssessment(event.target.value)} className="mt-1 block w-full rounded-sm border border-input bg-background p-2">{ASSESSMENTS.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label><label className="block text-sm">Assessment note (optional)<textarea value={note} onChange={(event) => onNote(event.target.value)} className="mt-1 min-h-20 w-full rounded-sm border border-input bg-background p-2" /></label><div className="flex gap-2"><Button size="sm" onClick={onSave}>Save assessment</Button><Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button></div></div>;
}

function GoalEditor({ sectionKey, category, title, description, targetDate, onSectionKey, onCategory, onTitle, onDescription, onTargetDate, onSave, onCancel }: { sectionKey: string; category: string; title: string; description: string; targetDate: string; onSectionKey: (value: string) => void; onCategory: (value: string) => void; onTitle: (value: string) => void; onDescription: (value: string) => void; onTargetDate: (value: string) => void; onSave: () => void; onCancel: () => void }) {
  return <div className="grid gap-3 md:grid-cols-2"><h2 className="md:col-span-2 font-semibold">Edit goal</h2><label className="text-sm font-medium">Dimension<select value={sectionKey} onChange={(event) => onSectionKey(event.target.value)} className="mt-1 block w-full rounded-sm border border-input bg-background p-2">{DIMENSIONS.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="text-sm font-medium">Category<select value={category} onChange={(event) => onCategory(event.target.value)} className="mt-1 block w-full rounded-sm border border-input bg-background p-2">{GOAL_CATEGORIES.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label><label className="text-sm font-medium">Short title<input value={title} onChange={(event) => onTitle(event.target.value)} maxLength={120} className="mt-1 block w-full rounded-sm border border-input bg-background p-2" /></label><label className="text-sm font-medium">Target date (optional)<input type="date" value={targetDate} onChange={(event) => onTargetDate(event.target.value)} className="mt-1 block w-full rounded-sm border border-input bg-background p-2" /></label><label className="text-sm font-medium md:col-span-2">Goal and expectation<textarea value={description} onChange={(event) => onDescription(event.target.value)} className="mt-1 min-h-24 w-full rounded-sm border border-input bg-background p-2" /></label><div className="flex gap-2 md:col-span-2"><Button size="sm" disabled={!title.trim() || !description.trim()} onClick={onSave}>Save changes</Button><Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button></div></div>;
}

function messageFor(error: unknown) {
  if (error instanceof ApiError && typeof error.details === "object" && error.details && "error" in error.details) return String(error.details.error);
  return "Unable to load or update goals.";
}

function ProgressSparkline({ values }: { values: (number | null)[] }) {
  const points = values.filter((value): value is number => value !== null);
  if (!points.length) return <div><p className="text-xs font-semibold uppercase text-muted-foreground">Counseling progress</p><p className="mt-1 text-sm text-muted-foreground">No rater percentage recorded yet.</p></div>;
  const width = 180; const height = 52;
  const polyline = points.map((value, index) => `${points.length === 1 ? width / 2 : index * width / (points.length - 1)},${height - value / 100 * height}`).join(" ");
  return <div><p className="text-xs font-semibold uppercase text-muted-foreground">Counseling progress</p><svg className="mt-2 h-14 w-48 overflow-visible" viewBox={`0 0 ${width} ${height}`} aria-label="Goal percentage trend"><line x1="0" y1={height} x2={width} y2={height} stroke="currentColor" opacity="0.2" /><polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="2" /></svg><p className="text-xs text-muted-foreground">Latest rater judgment: {points.at(-1)}%</p></div>;
}

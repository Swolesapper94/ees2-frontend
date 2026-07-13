"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type Capability =
  | "VIEW_WORKFLOW_STATUS"
  | "VIEW_ADMINISTRATIVE_DATA"
  | "VIEW_SUPPORT_FORM"
  | "VIEW_PERMITTED_EVALUATION_DATA"
  | "ADD_DRAFT_SUPPORT_ENTRY"
  | "EDIT_OWN_DRAFT_SUPPORT_ENTRY"
  | "UPLOAD_ARTIFACT"
  | "ORGANIZE_ARTIFACT"
  | "COMPLETE_ADMINISTRATIVE_FIELD"
  | "RESPOND_TO_ADMIN_RETURN"
  | "REQUEST_SOLDIER_REVIEW"
  | "REQUEST_RATER_REVIEW"
  | "SEND_WORKFLOW_REMINDER"
  | "DOWNLOAD_WORKING_COPY"
  | "ADD_NON_EVALUATIVE_COMMENT";

type GrantType = "PERSONAL_ASSISTANT" | "RATING_OFFICIAL_ASSISTANT" | "SERVICING_ADMIN_ASSIGNMENT";
type GrantStatus = "PENDING" | "ACTIVE" | "DECLINED" | "EXPIRED" | "REVOKED" | "SUSPENDED";

interface GrantPerson {
  id: string;
  displayName: string;
  email: string;
}

interface AccessGrant {
  id: string;
  type: GrantType | null;
  status: GrantStatus;
  person: GrantPerson | null;
  grantor: GrantPerson | null;
  subject: GrantPerson | null;
  scope: { evaluationId?: string | null; supportFormId?: string | null; ratingAssignmentId?: string | null; unitId?: string | null };
  capabilities: Capability[];
  effectiveFrom: string | null;
  effectiveTo: string | null;
  justification: string | null;
  requiresReview: boolean;
  acceptedAt: string | null;
  revokedAt: string | null;
  canRevoke: boolean;
}

interface EvaluationOption {
  id: string;
  formType: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  ratingChain?: { ratedSoldier?: { firstName: string; lastName: string; rank: string } };
}

interface SupportFormOption {
  id: string;
  dutyTitle: string;
  ratingPeriodStart: string;
  ratingPeriodEnd: string | null;
  status: string;
}

interface EligibleUser {
  id: string;
  displayName: string;
  email: string;
  unit?: { name: string } | null;
}

interface GrantActivity {
  id: string;
  action: string;
  createdAt: string;
  delegationCapability: Capability | null;
  metadata: Record<string, unknown> | null;
  actor: { firstName: string; lastName: string; rank: string } | null;
}

const TYPE_LABEL: Record<GrantType, string> = {
  PERSONAL_ASSISTANT: "Evidence assistant",
  RATING_OFFICIAL_ASSISTANT: "Rating-official assistant",
  SERVICING_ADMIN_ASSIGNMENT: "Administrative assistant",
};

const SAFE_TEMPLATES: Record<GrantType, Capability[]> = {
  PERSONAL_ASSISTANT: [
    "VIEW_WORKFLOW_STATUS", "VIEW_SUPPORT_FORM", "ADD_DRAFT_SUPPORT_ENTRY",
    "EDIT_OWN_DRAFT_SUPPORT_ENTRY", "UPLOAD_ARTIFACT", "ORGANIZE_ARTIFACT",
    "REQUEST_SOLDIER_REVIEW", "SEND_WORKFLOW_REMINDER",
  ],
  RATING_OFFICIAL_ASSISTANT: [
    "VIEW_WORKFLOW_STATUS", "VIEW_ADMINISTRATIVE_DATA", "RESPOND_TO_ADMIN_RETURN",
    "SEND_WORKFLOW_REMINDER", "ADD_NON_EVALUATIVE_COMMENT", "REQUEST_RATER_REVIEW",
  ],
  SERVICING_ADMIN_ASSIGNMENT: [
    "VIEW_WORKFLOW_STATUS", "VIEW_ADMINISTRATIVE_DATA", "VIEW_SUPPORT_FORM",
    "VIEW_PERMITTED_EVALUATION_DATA", "COMPLETE_ADMINISTRATIVE_FIELD",
    "RESPOND_TO_ADMIN_RETURN", "SEND_WORKFLOW_REMINDER", "DOWNLOAD_WORKING_COPY",
  ],
};

function statusClass(status: GrantStatus) {
  if (status === "ACTIVE") return "bg-green-100 text-green-800";
  if (status === "PENDING") return "bg-amber-100 text-amber-800";
  if (status === "SUSPENDED") return "bg-red-100 text-red-800";
  return "bg-muted text-muted-foreground";
}

function scopeLabel(grant: AccessGrant) {
  if (grant.scope.supportFormId) return "Scoped support form";
  if (grant.scope.evaluationId) return "Scoped evaluation";
  if (grant.scope.ratingAssignmentId) return "Scoped rating assignment";
  return "Scoped administrative assignment";
}

function GrantCard({ grant, perspective, onRevoke, onActivity, onAccept, onDecline }: {
  grant: AccessGrant;
  perspective: "grantor" | "delegate";
  onRevoke: (grant: AccessGrant) => void;
  onActivity: (grant: AccessGrant) => void;
  onAccept: (grant: AccessGrant) => void;
  onDecline: (grant: AccessGrant) => void;
}) {
  const person = perspective === "grantor" ? grant.person : grant.subject ?? grant.grantor;
  return (
    <article className="rounded-sm border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{person?.displayName ?? "Access grant pending migration"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{grant.type ? TYPE_LABEL[grant.type] : "Legacy grant requiring review"} · {scopeLabel(grant)}</p>
        </div>
        <span className={`rounded-sm px-2 py-1 text-xs font-medium ${statusClass(grant.status)}`}>{grant.status.replace("_", " ")}</span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {grant.effectiveFrom && `From ${format(new Date(grant.effectiveFrom), "d MMM yyyy")}`}
        {grant.effectiveTo && ` through ${format(new Date(grant.effectiveTo), "d MMM yyyy")}`}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {grant.capabilities.map((capability) => <span key={capability} className="rounded-sm bg-muted px-2 py-1 text-[11px]">{capability.replaceAll("_", " ")}</span>)}
        {grant.capabilities.length === 0 && <span className="text-xs text-muted-foreground">No active capabilities</span>}
      </div>
      {grant.justification && <p className="mt-3 text-xs italic text-muted-foreground">{grant.justification}</p>}
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <button type="button" onClick={() => onActivity(grant)} className="text-primary hover:underline">View activity</button>
        {perspective === "delegate" && grant.status === "ACTIVE" && grant.scope.supportFormId && (
          <Link href={`/support-form?formId=${grant.scope.supportFormId}&assisting=${grant.id}`} className="text-primary hover:underline">Open scoped form</Link>
        )}
        {perspective === "delegate" && grant.status === "ACTIVE" && grant.scope.evaluationId && (
          <Link href={`/evaluations/${grant.scope.evaluationId}/admin?assisting=${grant.id}`} className="text-primary hover:underline">Open permitted evaluation details</Link>
        )}
        {perspective === "delegate" && grant.status === "PENDING" && <>
          <button type="button" onClick={() => onAccept(grant)} className="text-green-700 hover:underline">Accept</button>
          <button type="button" onClick={() => onDecline(grant)} className="text-red-700 hover:underline">Decline</button>
        </>}
        {perspective === "grantor" && grant.canRevoke && <button type="button" onClick={() => onRevoke(grant)} className="text-red-700 hover:underline">Revoke</button>}
      </div>
    </article>
  );
}

function CreateGrantModal({ evaluations, forms, onClose, onCreated }: { evaluations: EvaluationOption[]; forms: SupportFormOption[]; onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<GrantType>("PERSONAL_ASSISTANT");
  const [delegateQuery, setDelegateQuery] = useState("");
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [delegate, setDelegate] = useState<EligibleUser | null>(null);
  const [scopeKind, setScopeKind] = useState<"supportFormId" | "evaluationId">("supportFormId");
  const [scopeId, setScopeId] = useState("");
  const [effectiveTo, setEffectiveTo] = useState(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [justification, setJustification] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function searchUsers(value: string) {
    setDelegateQuery(value);
    if (value.trim().length < 2) return setEligibleUsers([]);
    const response = await api.get<{ users: EligibleUser[] }>(`/access-grants/eligible-users?query=${encodeURIComponent(value)}`);
    setEligibleUsers(response.users);
  }

  async function submit() {
    if (!delegate || !scopeId || !effectiveTo) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/access-grants", {
        delegateUserId: delegate.id,
        delegationType: type,
        [scopeKind]: scopeId,
        effectiveTo,
        justification: justification || undefined,
        capabilities: SAFE_TEMPLATES[type],
      });
      onCreated();
      onClose();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? "Unable to create this access grant. Confirm the selected scope and expiration." : "Unable to create this access grant.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="create-access-grant-title">
      <div className="w-full max-w-xl rounded-sm border border-border bg-background p-6 shadow-lg">
        <h2 id="create-access-grant-title" className="text-lg font-semibold">Grant Access and Assistance</h2>
        <p className="mt-1 text-sm text-muted-foreground">Step {step} of 5. The helper acts under their own account; every action is attributable.</p>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        {step === 1 && <div className="mt-5 space-y-2">
          {(Object.keys(TYPE_LABEL) as GrantType[]).map((candidate) => <button key={candidate} type="button" onClick={() => setType(candidate)} className={`w-full rounded-sm border p-3 text-left ${type === candidate ? "border-primary bg-primary/5" : "border-border"}`}>
            <p className="font-medium">{TYPE_LABEL[candidate]}</p>
            <p className="mt-1 text-xs text-muted-foreground">{candidate === "PERSONAL_ASSISTANT" ? "Draft entries, organize evidence, and request review." : candidate === "RATING_OFFICIAL_ASSISTANT" ? "Clerical preparation and workflow tracking; no rating authority." : "Authorized administrative processing within a specific scope."}</p>
          </button>)}
        </div>}
        {step === 2 && <div className="mt-5 space-y-3">
          <label className="block text-sm font-medium">Person helping</label>
          <input value={delegateQuery} onChange={(event) => searchUsers(event.target.value).catch(() => setError("User search failed."))} placeholder="Search name or email" className="w-full rounded-sm border border-input px-3 py-2 text-sm" />
          {eligibleUsers.map((user) => <button key={user.id} type="button" onClick={() => { setDelegate(user); setEligibleUsers([]); }} className={`w-full rounded-sm border p-2 text-left text-sm ${delegate?.id === user.id ? "border-primary bg-primary/5" : "border-border"}`}>{user.displayName} · {user.email}</button>)}
          {delegate && <p className="text-sm text-green-700">Selected: {delegate.displayName}</p>}
        </div>}
        {step === 3 && <div className="mt-5 space-y-3">
          <label className="block text-sm font-medium">Scope</label>
          <select aria-label="Access grant scope type" value={scopeKind} onChange={(event) => { setScopeKind(event.target.value as "supportFormId" | "evaluationId"); setScopeId(""); }} className="w-full rounded-sm border border-input px-3 py-2 text-sm">
            <option value="supportFormId">Specific support form</option>
            <option value="evaluationId">Specific evaluation</option>
          </select>
          <select aria-label="Scoped record" value={scopeId} onChange={(event) => setScopeId(event.target.value)} className="w-full rounded-sm border border-input px-3 py-2 text-sm">
            <option value="">Select a scoped record</option>
            {scopeKind === "supportFormId"
              ? forms.map((form) => <option key={form.id} value={form.id}>{form.dutyTitle} · {form.status} · {form.ratingPeriodStart.slice(0, 10)}</option>)
              : evaluations.map((evaluation) => <option key={evaluation.id} value={evaluation.id}>{evaluation.ratingChain?.ratedSoldier?.rank} {evaluation.ratingChain?.ratedSoldier?.lastName} · {evaluation.formType} · {evaluation.status}</option>)}
          </select>
        </div>}
        {step === 4 && <div className="mt-5 space-y-3">
          <label className="block text-sm font-medium">Expiration</label>
          <input aria-label="Access grant expiration" type="date" value={effectiveTo} onChange={(event) => setEffectiveTo(event.target.value)} className="w-full rounded-sm border border-input px-3 py-2 text-sm" />
          <label className="block text-sm font-medium">Justification (optional)</label>
          <textarea aria-label="Access grant justification" value={justification} onChange={(event) => setJustification(event.target.value)} className="w-full rounded-sm border border-input px-3 py-2 text-sm" rows={3} />
        </div>}
        {step === 5 && <div className="mt-5 space-y-3 rounded-sm border border-border bg-muted/30 p-4 text-sm">
          <p><strong>Person:</strong> {delegate?.displayName ?? "Not selected"}</p>
          <p><strong>Type:</strong> {TYPE_LABEL[type]}</p>
          <p><strong>Capabilities:</strong> {SAFE_TEMPLATES[type].map((capability) => capability.replaceAll("_", " ")).join(", ")}</p>
          <p><strong>Cannot do:</strong> Sign, acknowledge, make rating decisions, confirm evidence as a rater, change the rating chain, submit as an official, or appoint another helper.</p>
        </div>}
        <div className="mt-6 flex justify-between gap-3">
          <Button variant="outline" onClick={step === 1 ? onClose : () => setStep(step - 1)}> {step === 1 ? "Cancel" : "Back"} </Button>
          {step < 5 ? <Button onClick={() => setStep(step + 1)} disabled={(step === 2 && !delegate) || (step === 3 && !scopeId)}>Next</Button> : <Button onClick={submit} disabled={submitting || !delegate || !scopeId}>{submitting ? "Sending invitation…" : "Send invitation"}</Button>}
        </div>
      </div>
    </div>
  );
}

export default function AccessAndAssistancePage() {
  const [view, setView] = useState<"helping-me" | "i-assist">("helping-me");
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationOption[]>([]);
  const [forms, setForms] = useState<SupportFormOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [activity, setActivity] = useState<GrantActivity[] | null>(null);
  const [revokeGrant, setRevokeGrant] = useState<AccessGrant | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") === "i-assist") {
      setView("i-assist");
    }
  }, []);

  async function load(nextView = view) {
    setLoading(true);
    setError("");
    try {
      const [grantResponse, evaluationResponse, formResponse] = await Promise.all([
        api.get<{ grants: AccessGrant[] }>(`/access-grants?view=${nextView}`),
        api.get<EvaluationOption[]>("/evaluations"),
        api.get<SupportFormOption[]>("/support-forms"),
      ]);
      setGrants(grantResponse.grants);
      setEvaluations(evaluationResponse);
      setForms(formResponse.filter((form) => form.status !== "CONSUMED"));
    } catch {
      setError("Unable to load access grants.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [view]);

  async function revoke() {
    if (!revokeGrant) return;
    await api.post(`/access-grants/${revokeGrant.id}/revoke`, {});
    setRevokeGrant(null);
    load();
  }

  async function activityFor(grant: AccessGrant) {
    const response = await api.get<{ activity: GrantActivity[] }>(`/access-grants/${grant.id}/activity`);
    setActivity(response.activity);
  }

  async function respond(grant: AccessGrant, action: "accept" | "decline") {
    await api.post(`/access-grants/${grant.id}/${action}`, {});
    load();
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold tracking-tight">Access and Assistance</h1><p className="text-sm text-muted-foreground">Grant limited, time-bound help without transferring identity or rating authority.</p></div>
        {view === "helping-me" && <Button onClick={() => setShowCreate(true)}>Grant access</Button>}
      </div>
      <div className="mb-5 flex gap-2 border-b border-border">
        <button type="button" onClick={() => setView("helping-me")} className={`px-3 py-2 text-sm ${view === "helping-me" ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}>People helping me</button>
        <button type="button" onClick={() => setView("i-assist")} className={`px-3 py-2 text-sm ${view === "i-assist" ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}>People I assist</button>
      </div>
      {error && <p className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="text-sm text-muted-foreground">Loading access grants…</p> : grants.length === 0 ? <div className="rounded-sm border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{view === "helping-me" ? "You have not granted anyone access to assist with your evaluation work." : "You do not currently have any active assistance assignments."}</div> : <div className="space-y-3">{grants.map((grant) => <GrantCard key={grant.id} grant={grant} perspective={view === "helping-me" ? "grantor" : "delegate"} onRevoke={setRevokeGrant} onActivity={activityFor} onAccept={(grant) => respond(grant, "accept")} onDecline={(grant) => respond(grant, "decline")} />)}</div>}
      {showCreate && <CreateGrantModal evaluations={evaluations} forms={forms} onClose={() => setShowCreate(false)} onCreated={() => load()} />}
      {revokeGrant && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-sm border border-border bg-background p-5 shadow-lg"><h2 className="text-lg font-semibold">Revoke access grant?</h2><p className="mt-2 text-sm text-muted-foreground">Access stops immediately. The helper remains attributable in the activity history.</p><div className="mt-5 flex justify-end gap-3"><Button variant="outline" onClick={() => setRevokeGrant(null)}>Cancel</Button><Button variant="destructive" onClick={revoke}>Revoke access</Button></div></div></div>}
      {activity && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-2xl rounded-sm border border-border bg-background p-5 shadow-lg"><div className="flex justify-between gap-3"><h2 className="text-lg font-semibold">Grant activity</h2><Button variant="outline" size="sm" onClick={() => setActivity(null)}>Close</Button></div><div className="mt-4 max-h-96 space-y-3 overflow-auto">{activity.length === 0 ? <p className="text-sm text-muted-foreground">No activity has been recorded for this grant.</p> : activity.map((event) => <div key={event.id} className="border-l-2 border-primary/40 pl-3 text-sm"><p className="font-medium">{event.action.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-muted-foreground">{event.actor ? `${event.actor.rank} ${event.actor.firstName} ${event.actor.lastName}` : "System"} · {format(new Date(event.createdAt), "d MMM yyyy, HH:mm")}{event.delegationCapability ? ` · ${event.delegationCapability.replaceAll("_", " ")}` : ""}</p></div>)}</div></div></div>}
    </div>
  );
}

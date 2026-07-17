"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

type Official = { id: string; firstName: string; lastName: string; rank: string };
type Assignment = {
  id: string; effectiveFrom: string; effectiveTo: string | null; formCategory: "NCOER" | "OER";
  ratedSoldier: Official; rater: Official; intermediateRater: Official | null; seniorRater: Official; supplementaryReviewer: Official | null;
  unit: { name: string } | null;
};
type PopulationPerson = Official & { mos: string; category: string | null };
type Capabilities = { createDraft: boolean; editDraft: boolean; submit: boolean; approve: boolean; publish: boolean; manageDelegates: boolean; viewAudit: boolean };
type Scheme = { id: string; version: number; status: string; effectiveFrom: string; approvedAt: string | null; publishedAt: string | null; unit: { id: string; name: string } | null; assignments: Assignment[]; coverage: { eligiblePersonnel: PopulationPerson[]; unassignedPersonnel: PopulationPerson[] }; capabilities: Capabilities };
type Workspace = { scheme: Scheme | null; capabilities: { createDraft: boolean } };
type Candidate = Official & { ratingEligible: boolean };
type UnitScope = { id: string; name: string };

const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "Not recorded";
const dateValue = (value: Date) => value.toISOString().slice(0, 10);
const statusClass: Record<string, string> = { DRAFT: "bg-slate-100 text-slate-700", RETURNED: "bg-red-100 text-red-800", PENDING_APPROVAL: "bg-amber-100 text-amber-800", APPROVED: "bg-blue-100 text-blue-800", PUBLISHED: "bg-green-100 text-green-800", SUPERSEDED: "bg-gray-100 text-gray-700" };

export default function RatingSchemePage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [unitScopes, setUnitScopes] = useState<UnitScope[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(dateValue(new Date(Date.now() + 86_400_000)));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  async function loadWorkspace(unitId?: string) {
    setLoading(true); setError(null);
    try { const data = await api.get<Workspace>(`/rating-schemes/workspace${unitId ? `?unitId=${encodeURIComponent(unitId)}` : ""}`); setWorkspace(data); setScheme(data.scheme); }
    catch (requestError) { setError(messageFor(requestError, "Unable to load the rating scheme.")); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    void loadWorkspace();
    api.get<UnitScope[]>("/rating-schemes/available-units").then((units) => {
      setUnitScopes(units);
      if (units.length) {
        setSelectedUnitId(units[0]!.id);
        if (units.length > 1) void loadWorkspace(units[0]!.id);
      }
    }).catch(() => {});
  }, []);

  async function refreshScheme(id: string) { setScheme(await api.get<Scheme>(`/rating-schemes/${id}`)); }
  async function postAction(path: string, body?: unknown) {
    setBusy(true); setError(null);
    try { const result = await api.post<{ id: string }>(path, body); await refreshScheme(result.id); }
    catch (requestError) { setError(messageFor(requestError, "The requested action could not be completed.")); }
    finally { setBusy(false); }
  }
  async function createDraft() { await postAction("/rating-schemes", { unitId: selectedUnitId || undefined, effectiveFrom, changeReason: "Initial prospective immediate-unit rating scheme" }); }
  async function copyCurrent() { if (scheme) await postAction(`/rating-schemes/${scheme.id}/copy`, { effectiveFrom, changeReason: "Prospective rating scheme update" }); }
  async function openBuilder() {
    if (!scheme) return;
    setBusy(true); setError(null);
    try { setCandidates(await api.get<Candidate[]>(`/rating-schemes/${scheme.id}/candidates`)); setBuilderOpen(true); }
    catch (requestError) { setError(messageFor(requestError, "Draft editing is not authorized.")); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading rating scheme...</div>;
  if (!workspace) return <div className="p-6 text-sm text-red-700">{error ?? "Unable to load the rating scheme."}</div>;
  if (!scheme) return <NoPublishedScheme canCreate={workspace.capabilities.createDraft} effectiveFrom={effectiveFrom} setEffectiveFrom={setEffectiveFrom} busy={busy} error={error} onCreate={createDraft} unitScopes={unitScopes} selectedUnitId={selectedUnitId} onSelectUnit={(unitId) => { setSelectedUnitId(unitId); void loadWorkspace(unitId); }} />;

  const isPublished = scheme.status === "PUBLISHED" || scheme.status === "SUPERSEDED";
  return <div className="p-6 space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-bold tracking-tight">Rating Scheme</h1><p className="mt-0.5 text-sm text-muted-foreground">View the official rating relationships for your immediate unit and manage proposed changes.</p><p className="mt-2 text-sm font-medium">{scheme.unit?.name ?? "Immediate unit"} <span className="text-muted-foreground">/</span> Version {scheme.version}</p></div>
      <div className="flex flex-wrap items-end gap-2">
        {unitScopes.length > 1 && <label className="text-xs text-muted-foreground">Immediate unit<select value={selectedUnitId || scheme.unit?.id || ""} onChange={(event) => { setSelectedUnitId(event.target.value); void loadWorkspace(event.target.value); }} className="mt-1 block h-9 rounded-sm border border-input bg-background px-2 text-sm text-foreground">{unitScopes.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>}
        {scheme.capabilities.createDraft && isPublished && <><label className="text-xs text-muted-foreground">Next effective date<input aria-label="Next scheme effective date" type="date" value={effectiveFrom} min={dateValue(new Date(Date.now() + 86_400_000))} onChange={(event) => setEffectiveFrom(event.target.value)} className="mt-1 block h-9 rounded-sm border border-input bg-background px-2 text-sm text-foreground" /></label><Button variant="outline" disabled={busy} onClick={copyCurrent}>Copy current scheme</Button></>}
        {scheme.capabilities.editDraft && <Button disabled={busy} onClick={openBuilder}>Add assignment</Button>}
        {scheme.capabilities.submit && <Button disabled={busy} onClick={() => postAction(`/rating-schemes/${scheme.id}/submit`)}>Submit for approval</Button>}
        {scheme.capabilities.approve && <Button disabled={busy} onClick={() => postAction(`/rating-schemes/${scheme.id}/approve`, {})}>Approve</Button>}
        {scheme.capabilities.publish && <Button disabled={busy} onClick={() => postAction(`/rating-schemes/${scheme.id}/publish`)}>Publish</Button>}
      </div>
    </header>
    {error && <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
      <Metric label="Rated personnel" value={scheme.coverage.eligiblePersonnel.length} />
      <Metric label="Complete assignments" value={scheme.assignments.filter((assignment) => assignment.rater && assignment.seniorRater).length} />
      <Metric label="Missing assignments" value={scheme.coverage.unassignedPersonnel.length} />
      <Metric label="Status" value={scheme.status.replaceAll("_", " ")} />
      <Metric label="Effective" value={formatDate(scheme.effectiveFrom)} />
      <Metric label="Approved" value={formatDate(scheme.approvedAt)} />
      <Metric label="Published" value={formatDate(scheme.publishedAt)} />
    </section>
    <section className="overflow-x-auto border border-border bg-card">
      <table className="min-w-full text-left text-sm"><thead className="border-b border-border bg-muted/30 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Rated Soldier</th><th className="px-4 py-3">Unit / Section</th><th className="px-4 py-3">Rater</th><th className="px-4 py-3">Intermediate</th><th className="px-4 py-3">Senior Rater</th><th className="px-4 py-3">Effective dates</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{scheme.assignments.map((assignment) => <tr key={assignment.id} onClick={() => setSelected(assignment)} className="cursor-pointer border-b border-border hover:bg-muted/30"><td className="px-4 py-3 font-medium">{fullName(assignment.ratedSoldier)}</td><td className="px-4 py-3 text-muted-foreground">{assignment.unit?.name ?? scheme.unit?.name ?? "Immediate unit"}</td><td className="px-4 py-3">{fullName(assignment.rater)}</td><td className="px-4 py-3">{assignment.intermediateRater ? fullName(assignment.intermediateRater) : "-"}</td><td className="px-4 py-3">{fullName(assignment.seniorRater)}</td><td className="px-4 py-3 text-muted-foreground">{formatDate(assignment.effectiveFrom)} - {assignment.effectiveTo ? formatDate(assignment.effectiveTo) : "Open"}</td><td className="px-4 py-3"><span className={`rounded-sm px-2 py-1 text-xs font-medium ${statusClass[scheme.status] ?? "bg-gray-100 text-gray-700"}`}>{scheme.status.replaceAll("_", " ")}</span></td></tr>)}{scheme.coverage.unassignedPersonnel.map((person) => <tr key={person.id} className="border-b border-border bg-amber-50/50 last:border-0"><td className="px-4 py-3 font-medium">{fullName(person)}</td><td className="px-4 py-3 text-muted-foreground">{scheme.unit?.name ?? "Immediate unit"}</td><td className="px-4 py-3 text-muted-foreground">Unassigned</td><td className="px-4 py-3 text-muted-foreground">-</td><td className="px-4 py-3 text-muted-foreground">Unassigned</td><td className="px-4 py-3 text-muted-foreground">-</td><td className="px-4 py-3"><span className="rounded-sm bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">ASSIGNMENT MISSING</span></td></tr>)}</tbody></table>
    </section>
    {builderOpen && <AssignmentBuilder candidates={candidates} scheme={scheme} busy={busy} onCancel={() => setBuilderOpen(false)} onSave={async (body) => { await postAction(`/rating-schemes/${scheme.id}/assignments`, body); setBuilderOpen(false); }} />}
    {selected && <RelationshipDrawer assignment={selected} scheme={scheme} onClose={() => setSelected(null)} />}
  </div>;
}

function NoPublishedScheme({ canCreate, effectiveFrom, setEffectiveFrom, busy, error, onCreate, unitScopes, selectedUnitId, onSelectUnit }: { canCreate: boolean; effectiveFrom: string; setEffectiveFrom: (value: string) => void; busy: boolean; error: string | null; onCreate: () => Promise<void>; unitScopes: UnitScope[]; selectedUnitId: string; onSelectUnit: (unitId: string) => void }) {
  return <div className="p-6"><h1 className="text-2xl font-bold tracking-tight">Rating Scheme</h1><p className="mt-1 text-sm text-muted-foreground">No published rating scheme is available for this immediate unit.</p>{unitScopes.length > 1 && <label className="mt-4 block max-w-md text-sm font-medium">Immediate unit<select value={selectedUnitId} onChange={(event) => onSelectUnit(event.target.value)} className="mt-1 block w-full rounded-sm border border-input bg-background p-2">{unitScopes.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>}{canCreate && <div className="mt-6 max-w-md border border-border bg-card p-4"><h2 className="font-semibold">Create first draft</h2><label className="mt-3 block text-sm font-medium">Prospective effective date<input type="date" value={effectiveFrom} min={dateValue(new Date(Date.now() + 86_400_000))} onChange={(event) => setEffectiveFrom(event.target.value)} className="mt-1 block w-full rounded-sm border border-input bg-background p-2" /></label><Button className="mt-4" disabled={busy} onClick={() => void onCreate()}>Create new draft</Button></div>}{error && <p className="mt-4 text-sm text-red-700">{error}</p>}</div>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="border border-border bg-card p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>; }
function fullName(user: Official) { return `${user.rank} ${user.lastName}, ${user.firstName}`; }
function messageFor(error: unknown, fallback: string) { return error instanceof ApiError && typeof error.details === "object" && error.details && "error" in error.details ? String(error.details.error) : fallback; }

function RelationshipDrawer({ assignment, scheme, onClose }: { assignment: Assignment; scheme: Scheme; onClose: () => void }) {
  const people: Array<[string, Official | null]> = [["Rated Soldier", assignment.ratedSoldier], ["Rater", assignment.rater], ["Intermediate Rater", assignment.intermediateRater], ["Senior Rater", assignment.seniorRater], ["Supplementary Reviewer", assignment.supplementaryReviewer]];
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/30" role="dialog" aria-modal="true"><div className="h-full w-full max-w-md overflow-y-auto bg-background p-6 shadow-xl"><div className="flex justify-between"><h2 className="text-lg font-bold">Rating Relationship</h2><Button variant="ghost" size="sm" onClick={onClose}>Close</Button></div><div className="mt-6 space-y-4">{people.map(([label, person]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{person ? fullName(person) : "Not assigned"}</p></div>)}<div><p className="text-xs text-muted-foreground">Effective dates</p><p className="font-medium">{formatDate(assignment.effectiveFrom)} - {assignment.effectiveTo ? formatDate(assignment.effectiveTo) : "Open"}</p></div><div><p className="text-xs text-muted-foreground">Scheme record</p><p className="font-medium">Version {scheme.version}; approved {formatDate(scheme.approvedAt)}; published {formatDate(scheme.publishedAt)}</p></div></div></div></div>;
}

function AssignmentBuilder({ candidates, scheme, busy, onCancel, onSave }: { candidates: Candidate[]; scheme: Scheme; busy: boolean; onCancel: () => void; onSave: (body: Record<string, unknown>) => Promise<void> }) {
  const [form, setForm] = useState({ ratedSoldierId: "", raterId: "", seniorRaterId: "", intermediateRaterId: "", supplementaryReviewerId: "", effectiveFrom: dateValue(new Date(scheme.effectiveFrom)), formCategory: "NCOER" as "NCOER" | "OER", changeReason: "Prospective rating scheme assignment" });
  const update = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value });
  const personnelSelect = (label: string, key: "ratedSoldierId" | "raterId" | "seniorRaterId" | "intermediateRaterId" | "supplementaryReviewerId", optional = false, ratedOnly = false) => <label className="block text-sm font-medium">{label}<select value={form[key]} onChange={(event) => update(key, event.target.value)} className="mt-1 w-full rounded-sm border border-input bg-background p-2"><option value="">{optional ? "Not assigned" : "Select personnel"}</option>{candidates.filter((candidate) => !ratedOnly || candidate.ratingEligible).map((candidate) => <option key={candidate.id} value={candidate.id}>{fullName(candidate)}</option>)}</select></label>;
  return <section className="border border-border bg-card p-4"><div className="flex items-center justify-between"><h2 className="font-semibold">Add proposed assignment</h2><Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button></div><form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void onSave({ ...form, intermediateRaterId: form.intermediateRaterId || null, supplementaryReviewerId: form.supplementaryReviewerId || null }); }}><>{personnelSelect("Rated Soldier", "ratedSoldierId", false, true)}{personnelSelect("Rater", "raterId")}{personnelSelect("Senior Rater", "seniorRaterId")}{personnelSelect("Intermediate Rater", "intermediateRaterId", true)}{personnelSelect("Supplementary Reviewer", "supplementaryReviewerId", true)}</><label className="block text-sm font-medium">Form family<select value={form.formCategory} onChange={(event) => update("formCategory", event.target.value)} className="mt-1 w-full rounded-sm border border-input bg-background p-2"><option value="NCOER">NCOER</option><option value="OER">OER</option></select></label><label className="block text-sm font-medium">Effective from<input type="date" value={form.effectiveFrom} onChange={(event) => update("effectiveFrom", event.target.value)} className="mt-1 w-full rounded-sm border border-input bg-background p-2" /></label><label className="block text-sm font-medium">Change reason<input value={form.changeReason} onChange={(event) => update("changeReason", event.target.value)} className="mt-1 w-full rounded-sm border border-input bg-background p-2" /></label><div className="md:col-span-2"><Button disabled={busy || !form.ratedSoldierId || !form.raterId || !form.seniorRaterId}>{busy ? "Saving..." : "Add assignment"}</Button></div></form></section>;
}
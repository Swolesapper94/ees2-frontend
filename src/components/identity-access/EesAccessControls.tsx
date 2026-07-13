"use client";

import { useEffect, useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

interface Unit { id: string; name: string; }
interface Scope { id: string; scopeType: string; expiresAt: string | null; unit: Unit | null; }

export interface EesAccessRecord {
  id: string;
  accessReviewStatus: string;
  applicationSupportRole: string;
  breakGlassEligible: boolean;
  temporaryAdminExpiresAt: string | null;
  administrativeScopes: Scope[];
}

const readable = (value: string) => value.replaceAll("_", " ");
const date = (value: string | null) => value ? new Date(value).toLocaleDateString() : "No expiration";

export function EesAccessControls({ record, onChanged }: { record: EesAccessRecord; onChanged: () => void }) {
  const [accessReviewStatus, setAccessReviewStatus] = useState(record.accessReviewStatus);
  const [applicationSupportRole, setApplicationSupportRole] = useState(record.applicationSupportRole);
  const [breakGlassEligible, setBreakGlassEligible] = useState(record.breakGlassEligible);
  const [temporaryAdminExpiresAt, setTemporaryAdminExpiresAt] = useState(record.temporaryAdminExpiresAt?.slice(0, 10) ?? "");
  const [scopeType, setScopeType] = useState("SERVICING_ADMINISTRATION");
  const [scopeUnitId, setScopeUnitId] = useState("");
  const [scopeExpiresAt, setScopeExpiresAt] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const field = "mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm";

  useEffect(() => { api.get<Unit[]>("/units").then(setUnits).catch(() => setUnits([])); }, []);

  async function save() {
    setBusy(true); setMessage(null);
    try {
      await api.patch(`/admin/identity-access/records/${record.id}/access`, { accessReviewStatus, applicationSupportRole, breakGlassEligible, temporaryAdminExpiresAt: temporaryAdminExpiresAt || null });
      setMessage("EES access controls updated and audited.");
      onChanged();
    } catch { setMessage("Unable to update EES access controls."); } finally { setBusy(false); }
  }
  async function addScope() {
    setBusy(true); setMessage(null);
    try {
      await api.post(`/admin/identity-access/records/${record.id}/scopes`, { scopeType, unitId: scopeUnitId || null, expiresAt: scopeExpiresAt || null });
      setMessage("Administrative scope assigned and audited.");
      onChanged();
    } catch { setMessage("Unable to assign this administrative scope."); } finally { setBusy(false); }
  }
  async function removeScope(id: string) {
    setBusy(true); setMessage(null);
    try {
      await api.delete(`/admin/identity-access/scopes/${id}`);
      setMessage("Administrative scope removed and audited.");
      onChanged();
    } catch { setMessage("Unable to remove this administrative scope."); } finally { setBusy(false); }
  }

  return <section className="border-t border-border pt-5"><h3 className="text-sm font-semibold">EES-specific access controls</h3><p className="mt-1 text-sm text-muted-foreground">These settings affect EES access only. They do not edit source identity data or rating authority.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Access review<select value={accessReviewStatus} onChange={(event) => setAccessReviewStatus(event.target.value)} className={field}><option value="CURRENT">Current</option><option value="PENDING_REVIEW">Pending review</option><option value="EXCEPTION_REVIEW">Exception review</option></select></label><label className="text-sm font-medium">EES support role<select value={applicationSupportRole} onChange={(event) => setApplicationSupportRole(event.target.value)} className={field}><option value="NONE">None</option><option value="SUPPORT">Support</option><option value="ADMINISTRATOR">Administrator</option></select></label><label className="text-sm font-medium">Temporary administrator expiration<input type="date" value={temporaryAdminExpiresAt} onChange={(event) => setTemporaryAdminExpiresAt(event.target.value)} className={field} /></label><label className="flex items-center gap-2 self-end pb-2 text-sm font-medium"><input type="checkbox" checked={breakGlassEligible} onChange={(event) => setBreakGlassEligible(event.target.checked)} />Break-glass eligible</label></div><Button className="mt-3" variant="outline" disabled={busy} onClick={() => void save()}><ShieldCheck className="h-4 w-4" />Save EES access controls</Button><div className="mt-5 border-t border-border pt-5"><h4 className="text-sm font-semibold">Assign servicing scope</h4><div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="text-sm font-medium">Scope type<select value={scopeType} onChange={(event) => setScopeType(event.target.value)} className={field}><option value="IDENTITY_ACCESS">Identity access</option><option value="SERVICING_ADMINISTRATION">Servicing administration</option><option value="BREAK_GLASS">Break glass</option></select></label><label className="text-sm font-medium">Unit<select value={scopeUnitId} onChange={(event) => setScopeUnitId(event.target.value)} className={field}><option value="">All units</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label><label className="text-sm font-medium">Expires<input type="date" value={scopeExpiresAt} onChange={(event) => setScopeExpiresAt(event.target.value)} className={field} /></label></div><Button className="mt-3" variant="outline" disabled={busy} onClick={() => void addScope()}><Plus className="h-4 w-4" />Assign scope</Button></div>{record.administrativeScopes.length > 0 && <div className="mt-4 space-y-2">{record.administrativeScopes.map((scope) => <div key={scope.id} className="flex items-center justify-between gap-3 border border-border p-3 text-sm"><span>{readable(scope.scopeType)} · {scope.unit?.name ?? "All units"} · {date(scope.expiresAt)}</span><Button size="sm" variant="outline" disabled={busy} onClick={() => void removeScope(scope.id)}>Remove</Button></div>)}</div>}{message && <p className="mt-3 text-sm text-blue-900">{message}</p>}</section>;
}

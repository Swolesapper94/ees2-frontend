"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { format } from "date-fns";

interface DelegateUser {
  id: string;
  firstName: string;
  lastName: string;
  rank: string;
  email: string;
}

interface DelegateRecord {
  id: string;
  accessLevel: "VIEW_ONLY" | "PUSH_ALONG";
  effectiveDate: string;
  expiryDate?: string | null;
  isActive: boolean;
  appointedReason?: string | null;
  delegateUser: DelegateUser;
}

interface DelegatedPrincipal {
  id: string;
  accessLevel: "VIEW_ONLY" | "PUSH_ALONG";
  effectiveDate: string;
  expiryDate?: string | null;
  principal: {
    id: string;
    firstName: string;
    lastName: string;
    rank: string;
    ratedOnChains: Array<{
      evaluations: Array<{ id: string; status: string; formType: string }>;
    }>;
  };
}

interface DelegatesData {
  myDelegates: DelegateRecord[];
  delegatedTo: DelegatedPrincipal[];
}

function AppointDelegateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    delegateUserId: "",
    accessLevel: "VIEW_ONLY" as "VIEW_ONLY" | "PUSH_ALONG",
    effectiveDate: new Date().toISOString().split("T")[0] ?? "",
    expiryDate: "",
    appointedReason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!form.delegateUserId) { setError("Enter a user ID or email"); return; }
    setLoading(true);
    try {
      await api.post("/delegates", {
        ...form,
        expiryDate: form.expiryDate || undefined,
        appointedReason: form.appointedReason || undefined,
      });
      onSuccess();
      onClose();
    } catch {
      setError("Failed to appoint delegate. Check the user ID.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-sm shadow-[var(--shadow-modal)] w-full max-w-md mx-4 p-6">
        <h2 className="text-base font-semibold mb-4">Appoint a Delegate</h2>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Delegate User ID</label>
            <input
              value={form.delegateUserId}
              onChange={(e) => setForm({ ...form, delegateUserId: e.target.value })}
              placeholder="User ID from directory"
              aria-label="Delegate user ID"
              className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Access Level</label>
            <select
              aria-label="Delegate access level"
              value={form.accessLevel}
              onChange={(e) => setForm({ ...form, accessLevel: e.target.value as "VIEW_ONLY" | "PUSH_ALONG" })}
              className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="VIEW_ONLY">View Only — can see eval status</option>
              <option value="PUSH_ALONG">Push Along — can send chain reminders</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Effective Date</label>
              <input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date (optional)</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason (optional)</label>
            <input
              value={form.appointedReason}
              onChange={(e) => setForm({ ...form, appointedReason: e.target.value })}
              placeholder="e.g. Deployed — CENTCOM AOR"
              className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-sm border border-border">Cancel</button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded-sm bg-primary text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Appointing…" : "Appoint"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DelegatedAccessSection() {
  const [data, setData] = useState<DelegatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  function load() {
    api.get<DelegatesData>("/delegates").then(setData).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function revoke(id: string) {
    await api.delete(`/delegates/${id}`);
    load();
  }

  async function remind(id: string) {
    await api.post(`/delegates/${id}/remind`);
  }

  if (loading) return null;
  if (!data) return null;
  if (data.myDelegates.length === 0 && data.delegatedTo.length === 0) return null;

  return (
    <div className="space-y-6">
      {showModal && (
        <AppointDelegateModal onClose={() => setShowModal(false)} onSuccess={load} />
      )}

      {/* My Delegates */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            MY DELEGATES
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs text-blue-600 hover:underline"
          >
            + Appoint Delegate
          </button>
        </div>
        {data.myDelegates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No delegates appointed.</p>
        ) : (
          <div className="space-y-2">
            {data.myDelegates.map((d) => (
              <div key={d.id} className="rounded-sm border border-border bg-card p-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {d.delegateUser.rank} {d.delegateUser.lastName}, {d.delegateUser.firstName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {d.accessLevel === "PUSH_ALONG" ? "Push Along" : "View Only"} ·
                    Active from {format(new Date(d.effectiveDate), "d MMM yyyy")}
                    {d.expiryDate && ` thru ${format(new Date(d.expiryDate), "d MMM yyyy")}`}
                  </p>
                  {d.appointedReason && (
                    <p className="text-xs text-muted-foreground italic">{d.appointedReason}</p>
                  )}
                </div>
                <button
                  onClick={() => revoke(d.id)}
                  className="text-xs text-red-600 hover:underline shrink-0"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
        {data.myDelegates.length === 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            + Appoint a delegate
          </button>
        )}
      </div>

      {/* Delegated to me */}
      {data.delegatedTo.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            DELEGATED ACCESS
          </h2>
          <div className="space-y-2">
            {data.delegatedTo.map((d) => {
              const latestEval = d.principal.ratedOnChains[0]?.evaluations[0];
              return (
                <div key={d.id} className="rounded-sm border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {d.principal.rank} {d.principal.lastName}, {d.principal.firstName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Delegated access · {d.accessLevel === "PUSH_ALONG" ? "Push Along" : "View Only"}
                        {d.expiryDate && ` · Active thru ${format(new Date(d.expiryDate), "d MMM yyyy")}`}
                      </p>
                      {latestEval && (
                        <p className="text-xs mt-1">
                          Status: <span className="font-medium">{latestEval.status.replace(/_/g, " ")}</span>
                        </p>
                      )}
                    </div>
                    {d.accessLevel === "PUSH_ALONG" && (
                      <button
                        onClick={() => remind(d.id)}
                        className="text-xs text-amber-600 hover:underline shrink-0"
                      >
                        Send Reminder
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

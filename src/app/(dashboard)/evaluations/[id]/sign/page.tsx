"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api/client";

type SignRole = "RATER" | "SENIOR_RATER" | "REVIEWER" | "SOLDIER";

interface Signature {
  id: string;
  role: SignRole;
  status: "PENDING" | "SIGNED" | "DECLINED";
  signedAt: string | null;
  declineReason: string | null;
}

const ROLE_LABELS: Record<SignRole, string> = {
  RATER: "Rater",
  SENIOR_RATER: "Senior Rater",
  REVIEWER: "Supplemental Reviewer",
  SOLDIER: "Rated Soldier",
};

const ROLE_ORDER: SignRole[] = ["RATER", "SENIOR_RATER", "REVIEWER", "SOLDIER"];

export default function SignPage() {
  const params = useParams();
  const id = params.id as string;

  const [signatures, setSignatures] = useState<Partial<Record<SignRole, Signature>>>({});
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<SignRole | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [showDecline, setShowDecline] = useState<SignRole | null>(null);

  async function loadSigs() {
    const ev = await api.get<{ signatures: Signature[] }>(`/evaluations/${id}`);
    const map: Partial<Record<SignRole, Signature>> = {};
    for (const sig of ev.signatures ?? []) map[sig.role as SignRole] = sig;
    setSignatures(map);
  }

  useEffect(() => {
    loadSigs().finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSign(role: SignRole) {
    setSigning(role);
    await api.post(`/evaluations/${id}/sign`, { role, action: "SIGN" });
    await loadSigs();
    setSigning(null);
  }

  async function handleDecline(role: SignRole) {
    setSigning(role);
    await api.post(`/evaluations/${id}/sign`, {
      role,
      action: "DECLINE",
      declineReason,
    });
    await loadSigs();
    setSigning(null);
    setShowDecline(null);
    setDeclineReason("");
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-xl font-bold tracking-tight">Signatures</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Each member of the rating chain must sign or decline.
      </p>

      <div className="space-y-3">
        {ROLE_ORDER.map((role) => {
          const sig = signatures[role];
          const isSigned = sig?.status === "SIGNED";
          const isDeclined = sig?.status === "DECLINED";
          const isBusy = signing === role;

          return (
            <div
              key={role}
              className="flex items-center justify-between rounded-sm border border-border p-4"
            >
              <div>
                <p className="text-sm font-medium">{ROLE_LABELS[role]}</p>
                {isSigned && (
                  <p className="text-xs text-green-600">
                    ✓ Signed {sig.signedAt ? new Date(sig.signedAt).toLocaleDateString() : ""}
                  </p>
                )}
                {isDeclined && (
                  <p className="text-xs text-red-600">
                    ✗ Declined: {sig.declineReason ?? "(no reason given)"}
                  </p>
                )}
                {!sig && <p className="text-xs text-muted-foreground">Pending</p>}
              </div>

              {!isSigned && !isDeclined && (
                <div className="flex gap-2">
                  {showDecline === role ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="Reason for decline"
                        className="rounded-sm border border-input p-1 text-xs w-40"
                      />
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDecline(role)}
                        className="text-xs text-destructive"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDecline(null)}
                        className="text-xs text-muted-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleSign(role)}
                        className="rounded-sm bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                      >
                        {isBusy ? "Signing…" : "Sign"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDecline(role)}
                        className="rounded-sm border border-input px-3 py-1.5 text-xs"
                      >
                        Decline
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
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

interface EvalUser {
  firstName: string;
  lastName: string;
}

const ROLE_LABELS: Record<SignRole, string> = {
  RATER: "Rater",
  SENIOR_RATER: "Senior Rater",
  REVIEWER: "Supplemental Reviewer",
  SOLDIER: "Rated Soldier",
};

const ROLE_ORDER: SignRole[] = ["RATER", "SENIOR_RATER", "REVIEWER", "SOLDIER"];

type SignStep = "REVIEW" | "CONFIRM";

export default function SignPage() {
  const params = useParams();
  const id = params.id as string;

  const [signatures, setSignatures] = useState<Partial<Record<SignRole, Signature>>>({});
  const [currentUser, setCurrentUser] = useState<EvalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<SignRole | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [showDecline, setShowDecline] = useState<SignRole | null>(null);

  // 2-step consent state
  const [consentRole, setConsentRole] = useState<SignRole | null>(null);
  const [consentStep, setConsentStep] = useState<SignStep>("REVIEW");
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [typedName, setTypedName] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  const expectedName = currentUser
    ? `${currentUser.lastName.toUpperCase()}, ${currentUser.firstName.toUpperCase()}`
    : "";

  async function loadData() {
    const [ev, dashboard] = await Promise.all([
      api.get<{ signatures: Signature[] }>(`/evaluations/${id}`),
      api.get<{ myUser: EvalUser }>("/dashboard"),
    ]);
    const map: Partial<Record<SignRole, Signature>> = {};
    for (const sig of ev.signatures ?? []) map[sig.role as SignRole] = sig;
    setSignatures(map);
    setCurrentUser(dashboard.myUser);
  }

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Track scroll in the review pane
  function handlePreviewScroll() {
    const el = previewRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
    if (atBottom) setScrolledToBottom(true);
  }

  function openConsentFlow(role: SignRole) {
    setConsentRole(role);
    setConsentStep("REVIEW");
    setScrolledToBottom(false);
    setTypedName("");
  }

  async function confirmSign() {
    if (!consentRole) return;
    if (typedName.toUpperCase() !== expectedName) return;
    setSigning(consentRole);
    try {
      await api.post(`/evaluations/${id}/sign`, {
        role: consentRole,
        action: "SIGN",
        nameConfirmation: typedName,
      });
      await loadData();
    } finally {
      setSigning(null);
      setConsentRole(null);
    }
  }

  async function handleDecline(role: SignRole) {
    setSigning(role);
    await api.post(`/evaluations/${id}/sign`, {
      role,
      action: "DECLINE",
      declineReason,
    });
    await loadData();
    setSigning(null);
    setShowDecline(null);
    setDeclineReason("");
  }

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;

  // 2-step consent overlay
  if (consentRole) {
    return (
      <div className="max-w-lg">
        <div className="mb-4 flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${consentStep === "REVIEW" ? "bg-[#1E3A5F] text-white" : "bg-[#4B5320] text-white"}`}>
            {consentStep === "REVIEW" ? "1" : "✓"}
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${consentStep === "CONFIRM" ? "bg-[#1E3A5F] text-white" : "bg-muted text-muted-foreground"}`}>
            2
          </div>
        </div>

        {consentStep === "REVIEW" ? (
          <div>
            <h2 className="text-base font-semibold mb-1">Step 1 — Review Evaluation</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Read the complete evaluation before signing. Scroll to the bottom to continue.
            </p>
            <div
              ref={previewRef}
              onScroll={handlePreviewScroll}
              className="h-64 overflow-y-auto rounded-sm border border-border bg-muted/30 p-4 text-sm space-y-2 mb-4"
            >
              <p className="font-medium">Evaluation ID: {id}</p>
              <p className="text-muted-foreground">Signing as: {ROLE_LABELS[consentRole]}</p>
              <div className="border-t border-border pt-2 mt-2">
                <p className="text-xs text-muted-foreground italic">
                  Scroll to the bottom to confirm you have read this evaluation in its entirety.
                </p>
                <div className="h-40" />
                <p className="text-xs text-[#4B5320] font-medium">✓ End of document — you may now proceed to sign.</p>
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setConsentRole(null)} className="px-3 py-1.5 text-sm rounded-sm border border-border">
                Cancel
              </button>
              <button
                onClick={() => { if (scrolledToBottom) setConsentStep("CONFIRM"); }}
                disabled={!scrolledToBottom}
                className="px-3 py-1.5 text-sm rounded-sm bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scrolledToBottom ? "Continue →" : "Scroll to continue"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-base font-semibold mb-1">Step 2 — Confirm Identity</h2>
            <p className="text-sm text-muted-foreground mb-4">
              By signing, you confirm you have reviewed this evaluation and understand you cannot retract without administrative action.
            </p>
            <div className="rounded-sm border border-border bg-muted/30 p-3 mb-4 text-sm">
              <p className="text-muted-foreground mb-1">Type your full name to confirm:</p>
              <p className="font-mono text-xs mb-2 text-muted-foreground">Expected: {expectedName}</p>
              <input
                value={typedName}
                onChange={(e) => setTypedName(e.target.value.toUpperCase())}
                placeholder="LAST, FIRST"
                className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm font-mono uppercase"
              />
              {typedName && (
                <p className={`text-xs mt-1 ${typedName === expectedName ? "text-[#4B5320]" : "text-red-600"}`}>
                  {typedName === expectedName ? "✓ Name matches" : "✗ Does not match"}
                </p>
              )}
            </div>
            <div className="flex justify-between">
              <button onClick={() => setConsentStep("REVIEW")} className="px-3 py-1.5 text-sm rounded-sm border border-border">
                ← Back
              </button>
              <button
                onClick={confirmSign}
                disabled={signing !== null || typedName !== expectedName}
                className="px-3 py-1.5 text-sm rounded-sm bg-primary text-primary-foreground disabled:opacity-50"
              >
                {signing ? "Signing…" : "Sign Evaluation"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-lg p-6">
      <h1 className="mb-1 text-xl font-bold tracking-tight">Signatures</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Each member of the rating chain must sign or decline. Signing requires scroll confirmation and name verification.
      </p>

      <div className="space-y-3">
        {ROLE_ORDER.map((role) => {
          const sig = signatures[role];
          const isSigned = sig?.status === "SIGNED";
          const isDeclined = sig?.status === "DECLINED";
          const isBusy = signing === role;

          return (
            <div key={role} className="flex items-center justify-between rounded-sm border border-border p-4">
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
                      <button type="button" disabled={isBusy} onClick={() => handleDecline(role)} className="text-xs text-destructive">
                        Confirm
                      </button>
                      <button type="button" onClick={() => setShowDecline(null)} className="text-xs text-muted-foreground">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => openConsentFlow(role)}
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

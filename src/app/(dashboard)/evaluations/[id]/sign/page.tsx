"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api/client";
import {
  SECTION_LABELS,
  RATING_BINARY_LABELS,
  RATING_FOUR_LEVEL_LABELS,
  SENIOR_RATER_LABELS,
} from "@/lib/utils/form-constants";
import type { EvalSection, EvalStatus, SeniorRaterRating } from "@/types/evaluation";import { Skeleton } from "@/components/ui/skeleton";
// ── Types ────────────────────────────────────────────────────────────────────

type SignRole = "RATER" | "SENIOR_RATER" | "REVIEWER" | "SOLDIER";

interface Signature {
  id: string;
  role: SignRole;
  status: "PENDING" | "SIGNED" | "DECLINED";
  signedAt: string | null;
  declineReason: string | null;
}

interface EvalDetail {
  id: string;
  status: EvalStatus;
  formType: string;
  periodStart: string;
  periodEnd: string;
  ratedMonths: number;
  reasonForSubmission: string;
  principalDutyTitle: string | null;
  dutyMosc: string | null;
  dailyDutiesScope: string | null;
  areasOfSpecialEmphasis: string | null;
  appointedDuties: string | null;
  seniorRaterRating: SeniorRaterRating | null;
  requiresSupplementaryReview: boolean;
  sections: EvalSection[];
  signatures: Signature[];
  ratingChain: {
    ratedSoldier: { firstName: string; lastName: string; rank: string; mos: string };
    rater: { firstName: string; lastName: string; rank: string };
    seniorRater: { firstName: string; lastName: string; rank: string };
    reviewer?: { firstName: string; lastName: string; rank: string } | null;
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<SignRole, string> = {
  RATER: "Rater",
  SENIOR_RATER: "Senior Rater",
  REVIEWER: "Supplemental Reviewer",
  SOLDIER: "Rated Soldier",
};

const ROLE_ORDER: SignRole[] = ["RATER", "SENIOR_RATER", "REVIEWER", "SOLDIER"];

const PART_IV_ORDER = [
  "CHARACTER",
  "PRESENCE",
  "INTELLECT",
  "LEADS",
  "DEVELOPS",
  "ACHIEVES",
] as const;

// ── Eval Preview ──────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm">{value ?? "—"}</span>
    </div>
  );
}

function SectionBlock({ sec }: { sec: EvalSection }) {
  const rating = sec.ratingBinary
    ? RATING_BINARY_LABELS[sec.ratingBinary]
    : sec.ratingFourLevel
      ? RATING_FOUR_LEVEL_LABELS[sec.ratingFourLevel]
      : null;
  return (
    <div className="border border-border rounded-sm p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[#1E3A5F]">
          {SECTION_LABELS[sec.section] ?? sec.section}
        </span>
        {rating && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${
            sec.ratingBinary === "DID_NOT_MEET_STANDARD" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}>{rating}</span>
        )}
      </div>
      {sec.finalBullets.length > 0 ? (
        <ul className="space-y-1">
          {sec.finalBullets.map((b, i) => <li key={i} className="text-sm leading-snug">{b}</li>)}
        </ul>
      ) : (
        <p className="text-xs italic text-muted-foreground">No bullets entered.</p>
      )}
    </div>
  );
}

function EvalPreview({
  ev,
  scrollRef,
  onScroll,
}: {
  ev: EvalDetail;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
}) {
  const s = ev.ratingChain.ratedSoldier;
  const rater = ev.ratingChain.rater;
  const sr = ev.ratingChain.seniorRater;
  const reviewer = ev.ratingChain.reviewer;
  const partIVSections = ev.sections.filter((sec) =>
    (PART_IV_ORDER as readonly string[]).includes(sec.section),
  );
  const raterOverall = ev.sections.find((sec) => sec.section === "RATER_OVERALL");
  const srOverall = ev.sections.find((sec) => sec.section === "SENIOR_RATER_OVERALL");
  const soldierComments = ev.sections.find((sec) => sec.section === "SOLDIER_COMMENTS");

  return (
    <div ref={scrollRef} onScroll={onScroll} className="overflow-y-auto h-full pr-2">
      {/* Header */}
      <div className="mb-5 rounded-sm border-2 border-[#1E3A5F] bg-[#1E3A5F]/5 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1E3A5F]">
              {ev.formType.replace(/_/g, "-")}
            </p>
            <p className="text-lg font-bold mt-0.5">
              {s.rank} {s.lastName.toUpperCase()}, {s.firstName}
            </p>
            <p className="text-sm text-muted-foreground">{s.mos} · {ev.principalDutyTitle ?? "—"}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Period: {ev.periodStart?.slice(0, 10)} → {ev.periodEnd?.slice(0, 10)}</p>
            <p>{ev.ratedMonths} rated months · {ev.reasonForSubmission}</p>
          </div>
        </div>
      </div>

      {/* Part I */}
      <section className="mb-5">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Part I — Administrative Data
        </h3>
        <div className="rounded-sm border border-border bg-card p-3">
          <Row label="Soldier" value={`${s.rank} ${s.lastName}, ${s.firstName}`} />
          <Row label="MOS" value={s.mos} />
          <Row label="Rater" value={`${rater.rank} ${rater.lastName}, ${rater.firstName}`} />
          <Row label="Senior Rater" value={`${sr.rank} ${sr.lastName}, ${sr.firstName}`} />
          {reviewer && <Row label="Supp. Reviewer" value={`${reviewer.rank} ${reviewer.lastName}, ${reviewer.firstName}`} />}
          <Row label="Reason" value={ev.reasonForSubmission} />
        </div>
      </section>

      {/* Part III */}
      {(ev.principalDutyTitle || ev.dailyDutiesScope) && (
        <section className="mb-5">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Part III — Duty Description
          </h3>
          <div className="rounded-sm border border-border bg-card p-3">
            <Row label="Duty Title" value={ev.principalDutyTitle} />
            {ev.dutyMosc && <Row label="MOSC" value={ev.dutyMosc} />}
            {ev.dailyDutiesScope && <Row label="Daily Duties" value={ev.dailyDutiesScope} />}
            {ev.areasOfSpecialEmphasis && <Row label="Special Emphasis" value={ev.areasOfSpecialEmphasis} />}
            {ev.appointedDuties && <Row label="Appointed Duties" value={ev.appointedDuties} />}
          </div>
        </section>
      )}

      {/* Part IV */}
      <section className="mb-5">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Part IV — Performance Assessment
        </h3>
        <div className="space-y-2">
          {partIVSections.length > 0
            ? partIVSections.map((sec) => <SectionBlock key={sec.id} sec={sec} />)
            : <p className="text-xs italic text-muted-foreground">No Part IV sections found.</p>}
        </div>
      </section>

      {/* Rater Overall */}
      {raterOverall && raterOverall.finalBullets.length > 0 && (
        <section className="mb-5">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Part V — Rater Overall
          </h3>
          <SectionBlock sec={raterOverall} />
        </section>
      )}

      {/* SR Overall */}
      {srOverall && (
        <section className="mb-5">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Part VI — Senior Rater
          </h3>
          <div className="rounded-sm border border-border bg-card p-3">
            {ev.seniorRaterRating && (
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Rating:</span>
                <span className="text-sm font-bold text-[#1E3A5F]">{SENIOR_RATER_LABELS[ev.seniorRaterRating]}</span>
              </div>
            )}
            {srOverall.finalBullets.length > 0 && (
              <ul className="space-y-1">
                {srOverall.finalBullets.map((b, i) => <li key={i} className="text-sm leading-snug">{b}</li>)}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Soldier Comments */}
      {soldierComments && soldierComments.finalBullets.length > 0 && (
        <section className="mb-5">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Rated Soldier Comments
          </h3>
          <SectionBlock sec={soldierComments} />
        </section>
      )}

      <div className="py-4 text-center text-xs text-muted-foreground border-t border-border mt-2">
        ─── End of Evaluation ───
      </div>
    </div>
  );
}

// ── Signature Panel ───────────────────────────────────────────────────────────

function SignaturePanel({
  signatures,
  requiresReviewer,
  signing,
  showDecline,
  declineReason,
  consentRole,
  consentReady,
  typedName,
  expectedName,
  onInitSign,
  onDeclineOpen,
  onDeclineConfirm,
  onDeclineCancel,
  onDeclineReasonChange,
  onTypedNameChange,
  onConfirmSign,
  onCancelConsent,
}: {
  signatures: Partial<Record<SignRole, Signature>>;
  requiresReviewer: boolean;
  signing: SignRole | null;
  showDecline: SignRole | null;
  declineReason: string;
  consentRole: SignRole | null;
  consentReady: boolean;
  typedName: string;
  expectedName: string;
  onInitSign: (role: SignRole) => void;
  onDeclineOpen: (role: SignRole) => void;
  onDeclineConfirm: (role: SignRole) => void;
  onDeclineCancel: () => void;
  onDeclineReasonChange: (v: string) => void;
  onTypedNameChange: (v: string) => void;
  onConfirmSign: () => void;
  onCancelConsent: () => void;
}) {
  const visibleRoles = requiresReviewer ? ROLE_ORDER : ROLE_ORDER.filter((r) => r !== "REVIEWER");

  if (consentRole) {
    const nameMatch = typedName.toUpperCase() === expectedName;
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Signing as {ROLE_LABELS[consentRole]}
          </p>
          <h2 className="text-sm font-semibold">Confirm Your Signature</h2>
        </div>

        <div className={`rounded-sm border p-3 text-sm ${consentReady
          ? "border-green-400 bg-green-50 text-green-700"
          : "border-amber-300 bg-amber-50 text-amber-700"}`}>
          {consentReady
            ? <p>✓ You have reviewed the full evaluation.</p>
            : <p>↑ Scroll through the evaluation on the left to unlock signing.</p>}
        </div>

        <div className="rounded-sm border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground mb-1">Type your full name to confirm identity:</p>
          <p className="font-mono text-xs text-muted-foreground mb-2">Expected: <strong>{expectedName}</strong></p>
          <input
            value={typedName}
            onChange={(e) => onTypedNameChange(e.target.value.toUpperCase())}
            placeholder="LAST, FIRST"
            disabled={!consentReady}
            className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm font-mono uppercase disabled:opacity-40 disabled:cursor-not-allowed"
          />
          {typedName && (
            <p className={`text-xs mt-1 font-medium ${nameMatch ? "text-green-600" : "text-red-600"}`}>
              {nameMatch ? "✓ Name matches" : "✗ Name does not match"}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirmSign}
            disabled={!consentReady || !nameMatch || signing !== null}
            className="w-full rounded-sm bg-[#4B5320] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {signing ? "Signing…" : `Sign as ${ROLE_LABELS[consentRole]}`}
          </button>
          <button onClick={onCancelConsent}
            className="w-full rounded-sm border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">Signatures</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Each rating chain member must sign or decline.</p>
      </div>

      {visibleRoles.map((role) => {
        const sig = signatures[role];
        const isSigned = sig?.status === "SIGNED";
        const isDeclined = sig?.status === "DECLINED";
        const isBusy = signing === role;
        return (
          <div key={role} className={`rounded-sm border p-3 text-sm ${
            isSigned ? "border-green-200 bg-green-50" : isDeclined ? "border-red-200 bg-red-50" : "border-border bg-card"}`}>
            <p className="font-semibold text-sm mb-0.5">{ROLE_LABELS[role]}</p>
            {isSigned && <p className="text-xs text-green-700">✓ Signed {sig.signedAt ? new Date(sig.signedAt).toLocaleDateString() : ""}</p>}
            {isDeclined && <p className="text-xs text-red-700">✗ Declined: {sig.declineReason ?? "(no reason)"}</p>}
            {!sig && <p className="text-xs text-muted-foreground">Pending</p>}

            {!isSigned && !isDeclined && (
              <div className="mt-2">
                {showDecline === role ? (
                  <div className="flex flex-col gap-1.5">
                    <input type="text" value={declineReason} onChange={(e) => onDeclineReasonChange(e.target.value)}
                      placeholder="Reason for declining…"
                      className="rounded-sm border border-input px-2 py-1.5 text-xs w-full" />
                    <div className="flex gap-2">
                      <button onClick={() => onDeclineConfirm(role)} disabled={isBusy}
                        className="flex-1 rounded-sm bg-red-600 px-2 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                        Confirm Decline
                      </button>
                      <button onClick={onDeclineCancel}
                        className="flex-1 rounded-sm border border-border px-2 py-1.5 text-xs">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => onInitSign(role)} disabled={isBusy}
                      className="flex-1 rounded-sm bg-[#4B5320] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                      {isBusy ? "…" : "Sign"}
                    </button>
                    <button onClick={() => onDeclineOpen(role)}
                      className="flex-1 rounded-sm border border-input px-3 py-1.5 text-xs">
                      Decline
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SignPage() {
  const params = useParams();
  const id = params.id as string;

  const [evalData, setEvalData] = useState<EvalDetail | null>(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<SignRole | null>(null);
  const [showDecline, setShowDecline] = useState<SignRole | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [consentRole, setConsentRole] = useState<SignRole | null>(null);
  const [consentReady, setConsentReady] = useState(false);
  const [typedName, setTypedName] = useState("");

  const evalScrollRef = useRef<HTMLDivElement>(null);

  const sigMap: Partial<Record<SignRole, Signature>> = {};
  for (const sig of evalData?.signatures ?? []) sigMap[sig.role as SignRole] = sig;

  const expectedName = currentUserName.toUpperCase();

  async function loadData() {
    const [ev, dashboard] = await Promise.all([
      api.get<EvalDetail>(`/evaluations/${id}`),
      api.get<{ myUser: { firstName: string; lastName: string } }>("/dashboard"),
    ]);
    setEvalData(ev);
    if (dashboard.myUser) {
      setCurrentUserName(
        `${dashboard.myUser.lastName.toUpperCase()}, ${dashboard.myUser.firstName.toUpperCase()}`,
      );
    }
  }

  useEffect(() => {
    loadData().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleEvalScroll() {
    const el = evalScrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) setConsentReady(true);
  }

  function openConsent(role: SignRole) {
    setConsentRole(role);
    setConsentReady(false);
    setTypedName("");
    evalScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmSign() {
    if (!consentRole || typedName.toUpperCase() !== expectedName) return;
    setSigning(consentRole);
    try {
      await api.post(`/evaluations/${id}/sign`, { role: consentRole, action: "SIGN", nameConfirmation: typedName });
      await loadData();
      setConsentRole(null);
    } finally {
      setSigning(null);
    }
  }

  async function handleDeclineConfirm(role: SignRole) {
    setSigning(role);
    await api.post(`/evaluations/${id}/sign`, { role, action: "DECLINE", declineReason });
    await loadData();
    setSigning(null);
    setShowDecline(null);
    setDeclineReason("");
  }

  if (loading) return (
    <div className="p-6 max-w-2xl space-y-4">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-64" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-sm border border-border p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
  if (!evalData) return <p className="p-6 text-sm text-red-600">Evaluation not found.</p>;

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Left: Evaluation Document */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden border-r border-border">
        <div className="shrink-0 px-6 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Evaluation Document
          </p>
          {consentRole && !consentReady && (
            <p className="text-xs text-amber-600 font-medium animate-pulse">↓ Scroll to bottom to enable signing</p>
          )}
          {consentRole && consentReady && (
            <p className="text-xs text-green-600 font-medium">✓ Fully reviewed</p>
          )}
        </div>
        <div className="flex-1 overflow-hidden px-6 py-4">
          <EvalPreview ev={evalData} scrollRef={evalScrollRef} onScroll={handleEvalScroll} />
        </div>
      </div>

      {/* Right: Signature Panel */}
      <div className="w-80 shrink-0 flex flex-col overflow-hidden">
        <div className="shrink-0 px-5 py-3 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {consentRole ? "Sign Evaluation" : "Signatures"}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <SignaturePanel
            signatures={sigMap}
            requiresReviewer={evalData.requiresSupplementaryReview}
            signing={signing}
            showDecline={showDecline}
            declineReason={declineReason}
            consentRole={consentRole}
            consentReady={consentReady}
            typedName={typedName}
            expectedName={expectedName}
            onInitSign={openConsent}
            onDeclineOpen={(role) => setShowDecline(role)}
            onDeclineConfirm={handleDeclineConfirm}
            onDeclineCancel={() => { setShowDecline(null); setDeclineReason(""); }}
            onDeclineReasonChange={setDeclineReason}
            onTypedNameChange={setTypedName}
            onConfirmSign={confirmSign}
            onCancelConsent={() => setConsentRole(null)}
          />
        </div>
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { resolveFormType } from "@/lib/utils/army-ranks";

const REASONS = [
  "Annual",
  "Change of Rater",
  "Change of Duty",
  "Relief for Cause",
  "Retirement / Separation",
  "Senior Rater Option",
  "Complete the Record",
] as const;

interface RatingChain {
  id: string;
  ratedSoldier: {
    id: string;
    firstName: string;
    lastName: string;
    rank: string;
    mos: string;
    dutyTitle?: string | null;
  };
  rater: { firstName: string; lastName: string; rank: string };
  seniorRater: { firstName: string; lastName: string; rank: string };
  ratingSchemeAssignmentId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

interface SupportForm {
  id: string;
  isActive: boolean;
  status?: string;
  _count?: { entries: number };
  dutyTitle?: string;
}

interface WizardState {
  step: 1 | 2 | 3 | 4 | 5;
  ratingChainId: string;
  chain: RatingChain | null;
  periodStart: string;
  periodEnd: string;
  reasonForSubmission: string;
  supportFormId?: string;
}

interface EvalCreationWizardProps {
  /** Pre-fill for soldier self-initiation — skips step 1 */
  prefillChainId?: string;
  onCancel?: () => void;
}

export function EvalCreationWizard({ prefillChainId, onCancel }: EvalCreationWizardProps) {
  const router = useRouter();
  const [chains, setChains] = useState<RatingChain[]>([]);
  const [supportForm, setSupportForm] = useState<SupportForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<WizardState>({
    step: prefillChainId ? 2 : 1,
    ratingChainId: prefillChainId ?? "",
    chain: null,
    periodStart: "",
    periodEnd: "",
    reasonForSubmission: "Annual",
  });

  // Load rating chains
  useEffect(() => {
    api
      .get<RatingChain[]>("/rating-chains?purpose=evaluation-creation&role=rater")
      .then(setChains)
      .catch(() => setError("Could not load rating chains"))
      .finally(() => setLoading(false));
  }, []);

  // If prefillChainId given, resolve chain immediately
  useEffect(() => {
    if (prefillChainId && chains.length) {
      const c = chains.find((c) => c.id === prefillChainId);
      if (c) setState((s) => ({ ...s, chain: c }));
    }
  }, [prefillChainId, chains]);

  // When chain selected, check for existing support form
  useEffect(() => {
    if (!state.chain) return;
    api
      .get<SupportForm[]>(`/support-forms?soldierId=${state.chain.ratedSoldier.id}`)
      .then((forms) => setSupportForm(forms.find((form) => form.isActive && form.status !== "CONSUMED") ?? null))
      .catch(() => setSupportForm(null));
  }, [state.chain]);

  function selectChain(chainId: string) {
    const c = chains.find((c) => c.id === chainId);
    setState((s) => ({ ...s, ratingChainId: chainId, chain: c ?? null }));
  }

  const formInfo = state.chain ? resolveFormType(state.chain.ratedSoldier.rank) : null;

  async function handleCreate() {
    if (!state.chain || !state.periodStart || !state.periodEnd) return;
    setSubmitting(true);
    try {
      const periodStart = new Date(state.periodStart);
      const periodEnd = new Date(state.periodEnd);
      const ratedMonths = Math.round(
        (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24 * 30),
      );

      const created = await api.post<{ id: string }>("/evaluations", {
        ratingChainId: state.ratingChainId,
        ratingSchemeAssignmentId: state.chain.ratingSchemeAssignmentId,
        formType: formInfo?.formType ?? "NCOER_9_1",
        periodStart,
        periodEnd,
        ratedMonths,
        reasonForSubmission: state.reasonForSubmission,
        supportFormId: state.supportFormId,
      });

      router.push(`/evaluations/${created.id}/admin`);
    } catch (error) {
      const serverMessage = error instanceof ApiError &&
        typeof error.details === "object" &&
        error.details !== null &&
        "error" in error.details &&
        typeof error.details.error === "string"
        ? error.details.error
        : null;
      setError(serverMessage ?? "Failed to create evaluation. Please try again.");
      setSubmitting(false);
    }
  }

  const stepTitles = ["Select Soldier", "Confirm Form Type", "Rating Period", "Link Support Form", "Review & Launch"];

  return (
    <div className="max-w-xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {stepTitles.map((title, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3 | 4 | 5;
          const isCurrent = state.step === stepNum;
          const isDone = state.step > stepNum;
          return (
            <div key={stepNum} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCurrent
                    ? "bg-[#1E3A5F] text-white"
                    : isDone
                      ? "bg-[#4B5320] text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? "✓" : stepNum}
              </div>
              {i < stepTitles.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1 — Select Soldier */}
      {state.step === 1 && (
        <div>
          <h2 className="text-base font-semibold mb-1">Step 1 — Select Rated Soldier</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choose from your active rating chains.
          </p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-2">
              {chains.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectChain(c.id)}
                  className={`w-full text-left rounded-sm border p-3 transition-colors ${
                    state.ratingChainId === c.id
                      ? "border-[#1E3A5F] bg-[#1E3A5F]/5"
                      : "border-border hover:border-[#1E3A5F]/50"
                  }`}
                >
                  <p className="font-medium text-sm">
                    {c.ratedSoldier.rank} {c.ratedSoldier.lastName}, {c.ratedSoldier.firstName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.ratedSoldier.mos} · Rater: {c.rater.rank} {c.rater.lastName} · SR: {c.seniorRater.rank} {c.seniorRater.lastName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Effective from {new Date(c.effectiveFrom).toLocaleDateString()}</p>
                </button>
              ))}
              {chains.length === 0 && (
                <p className="text-sm text-muted-foreground">No active rating chains. Contact your unit admin.</p>
              )}
            </div>
          )}
          <div className="flex justify-between mt-6">
            {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
            <Button
              disabled={!state.ratingChainId}
              onClick={() => setState((s) => ({ ...s, step: 2 }))}
              className="ml-auto"
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 — Confirm Form Type */}
      {state.step === 2 && state.chain && formInfo && (
        <div>
          <h2 className="text-base font-semibold mb-1">Step 2 — Form Type</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Auto-selected based on rank. Override requires admin authorization.
          </p>
          <div className="rounded-sm border border-border bg-muted/30 p-4 mb-4">
            <p className="text-sm font-medium">
              {state.chain.ratedSoldier.rank} {state.chain.ratedSoldier.lastName}
            </p>
            <p className="text-sm mt-1">
              <span className="font-medium">{formInfo.evalType}</span> — {formInfo.formType.replace(/_/g, " ")}
            </p>
            {!formInfo.builderAvailable && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-sm p-2">
                OER builder is in development. Support form and milestones are fully functional.
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Rating chain: {state.chain.rater.rank} {state.chain.rater.lastName} (Rater) /&nbsp;
            {state.chain.seniorRater.rank} {state.chain.seniorRater.lastName} (SR)
          </p>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setState((s) => ({ ...s, step: prefillChainId ? 2 : 1 }))}>← Back</Button>
            <Button onClick={() => setState((s) => ({ ...s, step: 3 }))}>Next →</Button>
          </div>
        </div>
      )}

      {/* Step 3 — Rating Period */}
      {state.step === 3 && (
        <div>
          <h2 className="text-base font-semibold mb-1">Step 3 — Rating Period</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Set the evaluation period and reason for submission.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Period Start</label>
              <input
                type="date"
                aria-label="Period start date"
                value={state.periodStart}
                onChange={(e) => setState((s) => ({ ...s, periodStart: e.target.value }))}
                className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Period End</label>
              <input
                type="date"
                aria-label="Period end date"
                value={state.periodEnd}
                onChange={(e) => setState((s) => ({ ...s, periodEnd: e.target.value }))}
                className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason for Submission</label>
              <select
                aria-label="Reason for submission"
                value={state.reasonForSubmission}
                onChange={(e) => setState((s) => ({ ...s, reasonForSubmission: e.target.value }))}
                className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setState((s) => ({ ...s, step: 2 }))}>← Back</Button>
            <Button
              disabled={!state.periodStart || !state.periodEnd}
              onClick={() => setState((s) => ({ ...s, step: 4 }))}
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Step 4 — Link Support Form */}
      {state.step === 4 && (
        <div>
          <h2 className="text-base font-semibold mb-1">Step 4 — Link Support Form</h2>
          <p className="text-sm text-muted-foreground mb-4">
            A finalized support form is required before an evaluation can be created. The server validates the form linked to the selected rating assignment.
          </p>
          {supportForm ? (
            <div className="rounded-sm border border-[#4B5320]/30 bg-[#4B5320]/5 p-4 mb-4">
              <p className="text-sm font-medium text-[#4B5320]">Assignment-linked support form found</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {supportForm._count?.entries ?? 0} entries logged
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setState((s) => ({ ...s, supportFormId: supportForm.id }))}
                  className={`px-3 py-1.5 text-xs rounded-sm border transition-colors ${
                    state.supportFormId === supportForm.id
                      ? "border-[#4B5320] bg-[#4B5320] text-white"
                      : "border-border"
                  }`}
                >
                  Link this form
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-sm border border-amber-200 bg-amber-50 p-4 mb-4">
              <p className="text-sm text-amber-700">No visible active support form found.</p>
              <p className="text-xs text-amber-600 mt-1">
                Evaluation creation will be rejected until the selected assignment has a finalized, hard-complete support form.
              </p>
            </div>
          )}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setState((s) => ({ ...s, step: 3 }))}>← Back</Button>
            <Button onClick={() => setState((s) => ({ ...s, step: 5 }))}>Next →</Button>
          </div>
        </div>
      )}

      {/* Step 5 — Review + Launch */}
      {state.step === 5 && state.chain && formInfo && (
        <div>
          <h2 className="text-base font-semibold mb-1">Step 5 — Review & Launch</h2>
          <p className="text-sm text-muted-foreground mb-4">Confirm everything looks right, then create the evaluation.</p>
          <div className="rounded-sm border border-border bg-muted/30 p-4 space-y-3 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rated Soldier</span>
              <span className="font-medium">
                {state.chain.ratedSoldier.rank} {state.chain.ratedSoldier.lastName}, {state.chain.ratedSoldier.firstName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Form Type</span>
              <span className="font-medium">{formInfo.formType.replace(/_/g, " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period</span>
              <span className="font-medium">{state.periodStart} – {state.periodEnd}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reason</span>
              <span className="font-medium">{state.reasonForSubmission}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Support Form</span>
              <span className="font-medium">{state.supportFormId ? "Selected" : "Validated by server"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rater</span>
              <span className="font-medium">{state.chain.rater.rank} {state.chain.rater.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Senior Rater</span>
              <span className="font-medium">{state.chain.seniorRater.rank} {state.chain.seniorRater.lastName}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Creating this evaluation will auto-generate 8 AR 623-3 milestones.
          </p>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setState((s) => ({ ...s, step: 4 }))}>← Back</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating…" : "Create Evaluation"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

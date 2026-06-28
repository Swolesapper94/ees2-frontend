"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import type { EvalFormType } from "@/types/evaluation";

// Soldier-selectable reason codes only (rater-only codes are excluded per §15)
const SOLDIER_REASON_CODES = [
  { value: "Annual", label: "Annual" },
  { value: "Change of Rater", label: "Change of Rater" },
  { value: "Complete the Record", label: "Complete the Record" },
];

interface RatingChain {
  id: string;
  ratedSoldier: {
    id: string;
    firstName: string;
    lastName: string;
    rank: string;
    mos: string;
  };
  rater: { firstName: string; lastName: string; rank: string };
  seniorRater: { firstName: string; lastName: string; rank: string };
  periodStart?: string;
}

function rankToFormType(rank: string): EvalFormType {
  if (rank === "SGT") return "NCOER_9_1";
  if (["SSG", "SFC", "MSG", "FIRST_SERGEANT"].includes(rank)) return "NCOER_9_2";
  if (["SGM", "CSM", "SMA"].includes(rank)) return "NCOER_9_3";
  // Officers
  if (["SECOND_LT", "FIRST_LT"].includes(rank)) return "OER_67_10_1";
  if (rank === "CPT") return "OER_67_10_2";
  if (["MAJ", "LTC", "COL"].includes(rank)) return "OER_67_10_3";
  return "NCOER_9_1";
}

const FORM_TYPE_LABELS: Record<string, string> = {
  NCOER_9_1: "DA 2166-9-1 (SGT)",
  NCOER_9_2: "DA 2166-9-2 (SSG–1SG/MSG)",
  NCOER_9_3: "DA 2166-9-3 (CSM/SGM/SMA)",
  OER_67_10_1: "DA 67-10-1 (2LT, 1LT)",
  OER_67_10_2: "DA 67-10-2 (CPT)",
  OER_67_10_3: "DA 67-10-3 (MAJ–COL)",
};

interface SoldierInitWizardProps {
  chains: RatingChain[];
  /** The soldier's own rating chain ID (pre-select if known) */
  myChainId?: string;
  onCancel: () => void;
}

export function SoldierInitWizard({ chains, myChainId, onCancel }: SoldierInitWizardProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [chainId, setChainId] = useState(myChainId ?? chains[0]?.id ?? "");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [reason, setReason] = useState("Annual");

  // Step 2
  const [supportFile, setSupportFile] = useState<File | null>(null);
  const [skipped, setSkipped] = useState(false);

  const selectedChain = chains.find((c) => c.id === chainId);
  const soldier = selectedChain?.ratedSoldier;
  const formType = soldier ? rankToFormType(soldier.rank) : "NCOER_9_1";

  // ─── Step 1: Identity & Period ────────────────────────────────────────────

  const step1Valid =
    !!chainId && !!periodStart && !!periodEnd && !!reason;

  // ─── Step 2: Support Form Upload (skippable) ──────────────────────────────

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) { setSupportFile(f); setSkipped(false); }
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      // Create the evaluation
      const created = await api.post<{ id: string }>("/evaluations", {
        ratingChainId: chainId,
        formType,
        periodStart,
        periodEnd,
        ratedMonths: Math.round(
          (new Date(periodEnd).getTime() - new Date(periodStart).getTime()) /
            (1000 * 60 * 60 * 24 * 30),
        ),
        reasonForSubmission: reason,
      });

      // If support form was uploaded, send it to the pipeline
      if (supportFile && !skipped) {
        const formData = new FormData();
        formData.append("file", supportFile);
        await api.upload(`/support-form-uploads/${created.id}`, formData);
      }

      router.push(`/evaluations/${created.id}/admin`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.");
      setSubmitting(false);
    }
  }

  // ─── Progress indicator ───────────────────────────────────────────────────

  const STEPS = [
    "Identity & Period",
    "Support Form",
    "Review & Submit",
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => {
          const num = i + 1;
          const isActive = step === num;
          const isDone = step > num;
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    isDone
                      ? "bg-[#1A3010] text-white"
                      : isActive
                        ? "border-2 border-[#1A3010] text-[#1A3010]"
                        : "border-2 border-border text-muted-foreground",
                  )}
                >
                  {isDone ? "✓" : num}
                </div>
                <span className={cn("text-[10px]", isActive ? "text-foreground font-medium" : "text-muted-foreground")}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 flex-1 mx-1 mt-[-10px]", isDone ? "bg-[#1A3010]" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Soldier</label>
            <select
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
              className="w-full rounded border border-input bg-background p-2 text-sm"
            >
              {chains.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ratedSoldier.rank} {c.ratedSoldier.lastName},{" "}
                  {c.ratedSoldier.firstName}
                </option>
              ))}
            </select>
          </div>

          {soldier && (
            <div className="rounded border border-border bg-muted/30 p-3 text-sm space-y-0.5">
              <p><span className="font-medium">Rank:</span> {soldier.rank}</p>
              <p><span className="font-medium">MOS:</span> {soldier.mos}</p>
              <p><span className="font-medium">Form type:</span> {FORM_TYPE_LABELS[formType] ?? formType}</p>
              <p className="text-xs text-muted-foreground mt-1">Form type auto-determined by rank (AR 623-3)</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Period Start (FROM)</label>
              <input
                type="date"
                required
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full rounded border border-input bg-background p-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Period End (THRU)</label>
              <input
                type="date"
                required
                value={periodEnd}
                min={periodStart}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full rounded border border-input bg-background p-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Reason for Submission</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded border border-input bg-background p-2 text-sm"
            >
              {SOLDIER_REASON_CODES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Relief for Cause and other administrative codes are set by your rater.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-sm mb-1">Upload Your Support Form</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Upload your DA 2166-9-1A support form to help your rater write your evaluation.
              AI will extract your accomplishments and generate bullet suggestions — your rater
              reviews and approves everything.
            </p>

            {/* Drop zone */}
            {!supportFile && !skipped && (
              <div
                className="rounded border-2 border-dashed border-border p-6 text-center hover:border-primary/50 hover:bg-muted/20 cursor-pointer transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setSupportFile(f); setSkipped(false); }
                  }}
                />
                <p className="text-sm font-medium">Drop PDF or image here</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPEG, PNG, WEBP · Max 20 MB</p>
                <p className="text-xs text-muted-foreground">Handwritten forms supported</p>
              </div>
            )}

            {supportFile && (
              <div className="flex items-center justify-between rounded border border-green-200 bg-green-50 p-3">
                <div>
                  <p className="text-sm font-medium text-green-800">{supportFile.name}</p>
                  <p className="text-xs text-green-700">
                    {(supportFile.size / 1024).toFixed(0)} KB — will be processed after submission
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSupportFile(null)}
                  className="text-xs text-green-800 underline"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Skip option */}
            {!supportFile && (
              <div className="mt-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipped}
                    onChange={(e) => setSkipped(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-muted-foreground">
                    Skip for now — I&apos;ll upload later, or my rater will write without it.
                    You can upload from your Dashboard any time while the eval is in progress.
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: Review ── */}
      {step === 3 && selectedChain && (
        <div className="space-y-4">
          <div className="rounded border border-border bg-card p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Soldier</span>
              <span className="font-medium">
                {soldier?.rank} {soldier?.lastName}, {soldier?.firstName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Form</span>
              <span className="font-medium">{FORM_TYPE_LABELS[formType] ?? formType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rating Period</span>
              <span className="font-medium">
                {periodStart} → {periodEnd}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reason</span>
              <span className="font-medium">{reason}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rater</span>
              <span>{selectedChain.rater.rank} {selectedChain.rater.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Support Form</span>
              <span className={supportFile ? "text-green-700 font-medium" : "text-muted-foreground"}>
                {supportFile ? `✓ ${supportFile.name}` : skipped ? "Skipping" : "Not uploaded"}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Submitting will create the evaluation record and notify your rater.
            {supportFile && " Your support form will be processed automatically."}
          </p>

          {error && (
            <p className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <button
          type="button"
          onClick={step === 1 ? onCancel : () => setStep((s) => s - 1)}
          className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          {step === 1 ? "Cancel" : "← Back"}
        </button>
        {step < 3 ? (
          <button
            type="button"
            disabled={step === 1 && !step1Valid}
            onClick={() => setStep((s) => s + 1)}
            className="rounded bg-[#1A3010] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {step === 2 && !supportFile && !skipped ? "Skip →" : "Next →"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded bg-[#1A3010] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting && (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Submit to My Rater
          </button>
        )}
      </div>
    </div>
  );
}

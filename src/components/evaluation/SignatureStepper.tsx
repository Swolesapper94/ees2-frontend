"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { EvalStatus } from "@/types/evaluation";

interface SignatureStepperProps {
  status: EvalStatus;
  requiresSupplementaryReview: boolean;
  className?: string;
}

const BASE_STEPS: { status: EvalStatus; label: string }[] = [
  { status: "RATER_IN_PROGRESS", label: "Rater" },
  { status: "PENDING_SENIOR_RATER", label: "Senior Rater" },
  { status: "PENDING_SOLDIER_ACK", label: "Soldier Ack" },
  { status: "PENDING_SUPPLEMENTARY_REVIEW", label: "Reviewer" },
  { status: "PENDING_FINAL_FORM_REVIEW", label: "Final Review" },
  { status: "COMPLETE", label: "Complete" },
];

/**
 * Read-only overview of the regulated signature sequence. Any of the four
 * roles can see how far the evaluation has progressed toward completion —
 * the actionable "sign as me" controls stay in SignaturePanel, scoped to the
 * caller's own assigned role. Deliberately no celebratory animation here:
 * this is a legal-weight record, not a checkout flow.
 */
export function SignatureStepper({ status, requiresSupplementaryReview, className }: SignatureStepperProps) {
  const steps = BASE_STEPS.filter((step) => step.status !== "PENDING_SUPPLEMENTARY_REVIEW" || requiresSupplementaryReview);
  const isTerminalDone = status === "SUBMITTED" || status === "ACCEPTED";
  const currentIndex = isTerminalDone ? steps.length - 1 : steps.findIndex((step) => step.status === status);

  if (status === "RETURNED") {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-status-tint-overdue text-status-overdue">
          <X className="h-3.5 w-3.5" />
        </span>
        <span className="font-medium text-status-overdue">Returned — needs correction before it can re-enter signing.</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)} aria-label="Signature sequence">
      {steps.map((step, index) => {
        const isDone = currentIndex >= 0 && index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div key={step.status} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-150",
                  isDone && "border-transparent bg-status-tint-complete text-status-complete",
                  isCurrent && "border-status-pending bg-status-tint-pending text-status-pending",
                  !isDone && !isCurrent && "border-border bg-muted text-muted-foreground",
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-[11px] font-medium",
                  isDone && "text-status-complete",
                  isCurrent && "text-status-pending",
                  !isDone && !isCurrent && "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1.5 h-px flex-1 transition-colors duration-300",
                  isDone ? "bg-status-complete/40" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import type { EvalStatus } from "@/types/evaluation";

export interface RatingChainStatusProps {
  status: EvalStatus;
  rater: string;
  seniorRater: string;
  reviewer?: string;
}

const STATUS_LABEL: Record<EvalStatus, string> = {
  DRAFT: "Draft",
  RATER_COMPLETE: "Rater Complete",
  PENDING_SENIOR_RATER: "Pending Senior Rater",
  PENDING_SOLDIER_ACK: "Pending Soldier Acknowledgement",
  PENDING_REVIEWER: "Pending Reviewer",
  COMPLETE: "Complete",
  SUBMITTED: "Submitted",
};

export function RatingChainStatus({
  status,
  rater,
  seniorRater,
  reviewer,
}: RatingChainStatusProps) {
  return (
    <div className="rounded-sm border border-border bg-card p-3 text-sm">
      <p className="mb-2 font-medium">{STATUS_LABEL[status]}</p>
      <ul className="space-y-0.5 text-muted-foreground">
        <li>Rater: {rater}</li>
        <li>Senior Rater: {seniorRater}</li>
        {reviewer ? <li>Reviewer: {reviewer}</li> : null}
      </ul>
    </div>
  );
}

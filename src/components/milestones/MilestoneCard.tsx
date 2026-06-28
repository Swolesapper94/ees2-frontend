"use client";

import { format, isPast, isWithinInterval, addDays } from "date-fns";
import { SuspenseBadge, type MilestoneStatusType } from "./SuspenseBadge";
import { api } from "@/lib/api/client";
import { useState } from "react";

const MILESTONE_LABELS: Record<string, string> = {
  INITIAL_COUNSELING_DUE:  "Initial Counsel",
  QUARTERLY_COUNSELING_1:  "Q1 Counsel",
  QUARTERLY_COUNSELING_2:  "Q2 Counsel",
  QUARTERLY_COUNSELING_3:  "Q3 Counsel",
  RATER_SECTION_DUE:       "Rater Due",
  SENIOR_RATER_DUE:        "SR Due",
  SOLDIER_ACK_DUE:         "Soldier Ack",
  EVAL_SUBMISSION_DUE:     "Submit",
};

interface Milestone {
  id: string;
  type: string;
  status: MilestoneStatusType;
  dueDate: string;
  completedAt?: string | null;
  waivedReason?: string | null;
}

interface MilestoneCardProps {
  milestone: Milestone;
  canComplete?: boolean;
  onUpdate?: () => void;
}

export function MilestoneCard({ milestone, canComplete, onUpdate }: MilestoneCardProps) {
  const [loading, setLoading] = useState(false);

  const dueDate = new Date(milestone.dueDate);
  const now = new Date();

  // Compute display status
  let displayStatus: MilestoneStatusType = milestone.status;
  if (milestone.status === "UPCOMING" || milestone.status === "DUE_SOON") {
    if (isPast(dueDate)) {
      displayStatus = "OVERDUE";
    } else if (isWithinInterval(dueDate, { start: now, end: addDays(now, 7) })) {
      displayStatus = "DUE_SOON";
    }
  }

  async function handleComplete() {
    setLoading(true);
    try {
      await api.patch(`/milestones/${milestone.id}/complete`);
      onUpdate?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-sm border border-border bg-card p-3 shadow-[var(--shadow-card)]">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{MILESTONE_LABELS[milestone.type] ?? milestone.type}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Due {format(dueDate, "d MMM yyyy")}
          {milestone.completedAt && (
            <span className="ml-2">· Completed {format(new Date(milestone.completedAt), "d MMM")}</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <SuspenseBadge status={displayStatus} />
        {canComplete && displayStatus !== "COMPLETE" && displayStatus !== "WAIVED" && (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="text-xs text-blue-600 hover:underline disabled:opacity-50"
          >
            Mark Done
          </button>
        )}
      </div>
    </div>
  );
}

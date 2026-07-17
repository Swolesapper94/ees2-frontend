"use client";

import { format, isPast, isWithinInterval, addDays } from "date-fns";
import { cn } from "@/lib/utils/cn";

const MILESTONE_SHORT: Record<string, string> = {
  INITIAL_COUNSELING_DUE: "Init",
  QUARTERLY_COUNSELING_1: "Q1",
  QUARTERLY_COUNSELING_2: "Q2",
  QUARTERLY_COUNSELING_3: "Q3",
  RATER_SECTION_DUE:      "Rater",
  SENIOR_RATER_DUE:       "SR",
  SOLDIER_ACK_DUE:        "Ack",
  EVAL_SUBMISSION_DUE:    "Submit",
};

const MILESTONE_META: Record<string, { label: string; owner: string }> = {
  INITIAL_COUNSELING_DUE: { label: "Initial counseling", owner: "Rater" },
  QUARTERLY_COUNSELING_1: { label: "Quarterly counseling 1", owner: "Rater" },
  QUARTERLY_COUNSELING_2: { label: "Quarterly counseling 2", owner: "Rater" },
  QUARTERLY_COUNSELING_3: { label: "Quarterly counseling 3", owner: "Rater" },
  RATER_SECTION_DUE: { label: "Rater section", owner: "Rater" },
  SENIOR_RATER_DUE: { label: "Senior rater section", owner: "Senior Rater" },
  SOLDIER_ACK_DUE: { label: "Soldier acknowledgment", owner: "Rated Soldier" },
  EVAL_SUBMISSION_DUE: { label: "Evaluation submission", owner: "Rater" },
};

interface Milestone {
  type: string;
  status: string;
  dueDate: string;
  completedAt?: string | null;
}

interface SuspenseTimelineProps {
  milestones: Milestone[];
  className?: string;
}

function getMilestoneColor(m: Milestone): string {
  if (m.status === "COMPLETE") return "bg-[#4B5320] text-white";
  if (m.status === "WAIVED") return "bg-slate-200 text-slate-500";
  const due = new Date(m.dueDate);
  const now = new Date();
  if (isPast(due)) return "bg-red-600 text-white";
  if (isWithinInterval(due, { start: now, end: addDays(now, 7) })) return "bg-amber-500 text-white";
  return "bg-gray-200 text-gray-600";
}

export function SuspenseTimeline({ milestones, className }: SuspenseTimelineProps) {
  const ordered = [...milestones].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1 overflow-x-auto">
        {ordered.map((m, i) => {
          const meta = MILESTONE_META[m.type] ?? { label: m.type, owner: "Assigned official" };
          const status = m.status === "COMPLETE" ? "Complete" : m.status === "WAIVED" ? "Waived" : isPast(new Date(m.dueDate)) ? "Overdue" : isWithinInterval(new Date(m.dueDate), { start: new Date(), end: addDays(new Date(), 7) }) ? "Due soon" : "Upcoming";
          return (
            <div key={m.type} className="flex items-center gap-1 shrink-0">
              <div
                title={`${meta.label}: due ${format(new Date(m.dueDate), "d MMM yyyy")}. Owner: ${meta.owner}. Status: ${status}.`}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-sm text-[10px] font-bold uppercase",
                  getMilestoneColor(m),
                )}
              >
                {m.status === "COMPLETE" ? "✓" : m.status === "WAIVED" ? "—" : MILESTONE_SHORT[m.type]?.[0] ?? "?"}
              </div>
              {i < ordered.length - 1 && <div className="h-px w-4 shrink-0 bg-border" />}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span><span className="mr-1 inline-block h-2 w-2 bg-[#4B5320]" />Complete</span>
        <span><span className="mr-1 inline-block h-2 w-2 bg-red-600" />Overdue</span>
        <span><span className="mr-1 inline-block h-2 w-2 bg-amber-500" />Due within 7 days</span>
        <span><span className="mr-1 inline-block h-2 w-2 bg-gray-300" />Upcoming</span>
        <span><span className="mr-1 inline-block h-2 w-2 bg-slate-200" />Waived</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Dates are generated when the evaluation starts. Overdue status updates automatically; only the designated owner may complete or waive a milestone, and every manual change is audited.
      </p>
    </div>
  );
}

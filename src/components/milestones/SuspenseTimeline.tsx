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
    <div className={cn("flex items-center gap-1 overflow-x-auto", className)}>
      {ordered.map((m, i) => (
        <div key={m.type} className="flex items-center gap-1 shrink-0">
          <div
            title={`${MILESTONE_SHORT[m.type] ?? m.type} — ${format(new Date(m.dueDate), "d MMM")}`}
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-sm text-[10px] font-bold uppercase",
              getMilestoneColor(m),
            )}
          >
            {m.status === "COMPLETE" ? "✓" : m.status === "WAIVED" ? "—" : MILESTONE_SHORT[m.type]?.[0] ?? "?"}
          </div>
          {i < ordered.length - 1 && (
            <div className="w-4 h-px bg-border shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

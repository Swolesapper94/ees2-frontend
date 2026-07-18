"use client";

import { format, isPast, isWithinInterval, addDays } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { milestoneDefinition } from "@/lib/utils/milestones";

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

function getMilestoneStatus(m: Milestone): string {
  if (m.status === "COMPLETE") return "Complete";
  if (m.status === "WAIVED") return "Waived";
  if (isPast(new Date(m.dueDate))) return "Overdue";
  if (isWithinInterval(new Date(m.dueDate), { start: new Date(), end: addDays(new Date(), 7) })) return "Due soon";
  return "Upcoming";
}

export function SuspenseTimeline({ milestones, className }: SuspenseTimelineProps) {
  const ordered = [...milestones].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {ordered.map((m) => {
          const meta = milestoneDefinition(m.type);
          const status = getMilestoneStatus(m);
          return (
            <div
              key={m.type}
              className="rounded-sm border border-border bg-card p-2.5 text-xs"
              title={`${meta.label}: ${meta.why}`}
            >
              <div
                className={cn(
                  "mb-2 inline-flex rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase",
                  getMilestoneColor(m),
                )}
              >
                {status}
              </div>
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-foreground">{meta.label}</p>
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {meta.shortLabel}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Owner:</span> {meta.owner}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Due:</span> {format(new Date(m.dueDate), "d MMM yyyy")}
                </p>
                <p className="text-muted-foreground">{meta.dueRule}</p>
                <p className="text-muted-foreground">{meta.why}</p>
              </div>
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
        These dates are generated when the evaluation starts. They keep counseling, rater drafting, senior-rater review, soldier acknowledgment, and final submission from slipping into a last-minute scramble. Manual completions and waivers are audited.
      </p>
    </div>
  );
}

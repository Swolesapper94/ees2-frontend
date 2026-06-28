"use client";

import { format, isPast, isWithinInterval, addDays } from "date-fns";
import { cn } from "@/lib/utils/cn";

const MILESTONE_COLS: { key: string; label: string }[] = [
  { key: "INITIAL_COUNSELING_DUE", label: "Init Counsel" },
  { key: "QUARTERLY_COUNSELING_1",  label: "Q1" },
  { key: "QUARTERLY_COUNSELING_2",  label: "Q2" },
  { key: "QUARTERLY_COUNSELING_3",  label: "Q3" },
  { key: "RATER_SECTION_DUE",       label: "Rater" },
  { key: "SENIOR_RATER_DUE",        label: "SR" },
  { key: "EVAL_SUBMISSION_DUE",     label: "Submit" },
];

interface Milestone { type: string; status: string; dueDate: string }
interface SoldierRow {
  soldierName: string;
  soldierRank: string;
  evalId?: string | null;
  milestones: Milestone[];
}

interface FormationSuspenseViewProps {
  rows: SoldierRow[];
}

function cellStyle(m: Milestone | undefined): string {
  if (!m) return "text-gray-300";
  if (m.status === "COMPLETE") return "text-[#4B5320] font-bold";
  if (m.status === "WAIVED") return "text-slate-400";
  const due = new Date(m.dueDate);
  const now = new Date();
  if (isPast(due)) return "text-red-600 font-bold";
  if (isWithinInterval(due, { start: now, end: addDays(now, 7) })) return "text-amber-600 font-semibold";
  return "text-gray-400";
}

function cellIcon(m: Milestone | undefined): string {
  if (!m) return "—";
  if (m.status === "COMPLETE") return "✓";
  if (m.status === "WAIVED") return "W";
  const due = new Date(m.dueDate);
  const now = new Date();
  if (isPast(due)) return "✗";
  if (isWithinInterval(due, { start: now, end: addDays(now, 7) })) {
    const days = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    return `⚠${days}d`;
  }
  return format(due, "d MMM");
}

export function FormationSuspenseView({ rows }: FormationSuspenseViewProps) {
  if (!rows.length) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No soldiers to display.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 pr-4 text-left font-medium text-muted-foreground w-48">Soldier</th>
            {MILESTONE_COLS.map((col) => (
              <th key={col.key} className="py-2 px-2 text-center font-medium text-muted-foreground text-xs w-20">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={cn("border-b border-border/50", i % 2 === 0 ? "bg-background" : "bg-muted/30")}>
              <td className="py-2 pr-4 font-medium">
                <span className="text-xs text-muted-foreground mr-1">{row.soldierRank}</span>
                {row.soldierName}
              </td>
              {MILESTONE_COLS.map((col) => {
                const m = row.milestones.find((m) => m.type === col.key);
                return (
                  <td key={col.key} className={cn("py-2 px-2 text-center text-xs", cellStyle(m))}>
                    {cellIcon(m)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

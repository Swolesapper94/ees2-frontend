"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SectionKey } from "@/types/evaluation";
import { SECTION_VISUALS, type PartIVSectionKey } from "@/lib/utils/section-visuals";

export interface SectionNavProps {
  evalId: string;
  /** Per-dimension completion, when known — drives checkmarks and the Part IV progress bar. */
  sections?: { section: SectionKey; isComplete: boolean }[];
}

const STEPS: { slug: string; label: string; sectionKey?: PartIVSectionKey }[] = [
  { slug: "admin", label: "Admin Data" },
  { slug: "duty", label: "Duty Description" },
  { slug: "timeline", label: "Timeline" },
  { slug: "character", label: "Character", sectionKey: "CHARACTER" },
  { slug: "presence", label: "Presence", sectionKey: "PRESENCE" },
  { slug: "intellect", label: "Intellect", sectionKey: "INTELLECT" },
  { slug: "leads", label: "Leads", sectionKey: "LEADS" },
  { slug: "develops", label: "Develops", sectionKey: "DEVELOPS" },
  { slug: "achieves", label: "Achieves", sectionKey: "ACHIEVES" },
  { slug: "senior-rater", label: "Senior Rater" },
  { slug: "review", label: "Review" },
  { slug: "sign", label: "Sign" },
  { slug: "final-review", label: "Final Form Review" },
];

const PART_IV_KEYS: PartIVSectionKey[] = ["CHARACTER", "PRESENCE", "INTELLECT", "LEADS", "DEVELOPS", "ACHIEVES"];

export function SectionNav({ evalId, sections }: SectionNavProps) {
  const pathname = usePathname();
  const completionByKey = new Map((sections ?? []).map((entry) => [entry.section, entry.isComplete]));
  const partIVDone = PART_IV_KEYS.filter((key) => completionByKey.get(key)).length;
  const hasSectionData = sections !== undefined;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {hasSectionData && (
        <div className="rounded-sm border border-border bg-card p-3 shadow-card" aria-label={`${partIVDone} of ${PART_IV_KEYS.length} Part IV dimensions complete`}>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Part IV progress</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">Leadership dimensions</p>
            </div>
            <span className={cn("text-lg font-bold", partIVDone === PART_IV_KEYS.length ? "text-status-complete" : "text-foreground")}>
              {partIVDone}<span className="text-xs font-medium text-muted-foreground">/6</span>
            </span>
          </div>
          <div className="mt-3 grid grid-cols-6 gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={PART_IV_KEYS.length} aria-valuenow={partIVDone}>
            {PART_IV_KEYS.map((key) => {
              const visual = SECTION_VISUALS[key];
              const complete = Boolean(completionByKey.get(key));
              return (
                <div key={key} className="text-center" title={`${visual.label}: ${complete ? "complete" : "incomplete"}`}>
                  <div className={cn("h-1.5 rounded-full transition-all duration-200", complete ? visual.segment : "bg-muted")} />
                  <span className={cn("mt-1 block text-[9px] font-semibold", complete ? visual.text : "text-muted-foreground/60")}>{visual.shortLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <nav className="flex min-w-0 gap-1 overflow-x-auto pb-1 md:flex-col md:gap-0.5 md:overflow-visible md:pb-0">
        {STEPS.map((step) => {
          const href = `/evaluations/${evalId}/${step.slug}`;
          const active = pathname === href;
          const isComplete = step.sectionKey ? completionByKey.get(step.sectionKey) : undefined;
          const visual = step.sectionKey ? SECTION_VISUALS[step.sectionKey] : null;
          const Icon = visual?.Icon;
          return (
            <Link
              key={step.slug}
              href={href}
              className={cn(
                "group flex min-h-9 shrink-0 items-center justify-between gap-2 rounded-sm border border-transparent px-2.5 py-1.5 text-sm transition-all duration-150 md:w-full",
                active && visual && `${visual.surface} ${visual.border} ${visual.text} font-semibold shadow-sm`,
                active && !visual && "border-border bg-accent font-medium text-accent-foreground",
                !active && "text-muted-foreground hover:border-border hover:bg-card hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                {Icon && (
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-sm", active ? visual?.iconSurface : "bg-muted text-muted-foreground group-hover:text-foreground")}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                )}
                <span>{step.label}</span>
              </span>
              {isComplete !== undefined && (
                isComplete ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-status-tint-complete text-status-complete" aria-label="Complete">
                    <Check className="h-3 w-3" />
                  </span>
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-label="Incomplete" />
                )
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

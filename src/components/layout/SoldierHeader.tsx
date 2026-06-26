import { cn } from "@/lib/utils/cn";

export interface SoldierHeaderProps {
  name: string; // "SMITH, JAMES R."
  rank: string; // "SGT"
  mos: string; // "11B"
  dutyTitle: string; // "Rifleman, B Co 2-504 PIR"
  periodStart: string; // "20240601"
  periodEnd: string; // "20250531"
  rater: string; // "SSG Jones"
  seniorRater: string; // "SFC Davis"
  className?: string;
}

/**
 * Persistent rated-soldier identity strip. Always visible on eval pages —
 * the rater is never writing into a blank form. See start.md §8.
 */
export function SoldierHeader({
  name,
  rank,
  mos,
  dutyTitle,
  periodStart,
  periodEnd,
  rater,
  seniorRater,
  className,
}: SoldierHeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 bg-soldier text-soldier-text",
        "border-b border-black/20 px-6 py-2.5 text-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold tracking-wide">
          {rank} {name}
        </span>
        <span className="opacity-50">│</span>
        <span className="font-mono">{mos}</span>
        <span className="opacity-50">│</span>
        <span>{dutyTitle}</span>
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-90">
        <span className="font-mono">
          Period: {periodStart}–{periodEnd}
        </span>
        <span className="opacity-50">│</span>
        <span>
          Rating Chain: {rater} / {seniorRater}
        </span>
      </div>
    </div>
  );
}

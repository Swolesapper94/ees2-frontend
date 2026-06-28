"use client";

interface GradeTab {
  grade: string;
  isNco: boolean;
}

interface RankTabsProps {
  grades: GradeTab[];
  activeGrade: string;
  onChange: (grade: string) => void;
}

/**
 * Rank tabs — dynamic, one tab per grade where user has SR'd at least one eval.
 * Spec §6b — active tab in blue, inactive in slate.
 */
export function RankTabs({ grades, activeGrade, onChange }: RankTabsProps) {
  return (
    <div className="flex gap-1 flex-wrap border-b border-slate-200 pb-2 mb-3">
      {grades.map((g) => {
        const isActive = g.grade === activeGrade;
        return (
          <button
            key={g.grade}
            type="button"
            onClick={() => onChange(g.grade)}
            className={[
              "px-2.5 py-1 text-xs rounded-sm border transition-colors",
              isActive
                ? "border-blue-400 text-blue-700 font-medium bg-blue-50"
                : "border-slate-200 text-slate-500 bg-transparent hover:bg-slate-100",
            ].join(" ")}
          >
            {g.grade === "FIRST_SERGEANT" ? "1SG" : g.grade}
            {!g.isNco && (
              <span className="ml-1 text-[9px] text-slate-400">OER</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

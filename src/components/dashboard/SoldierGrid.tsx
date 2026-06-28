"use client";

import { useState } from "react";
import { SoldierCard, type SoldierCardData } from "@/components/dashboard/SoldierCard";

type RoleFilter = "ALL" | "RATER" | "SENIOR_RATER";

interface SoldierGridProps {
  soldierChains: SoldierCardData[];
}

/**
 * Zone B — My Soldiers section.
 * Only renders when the user has at least one active chain as rater or SR.
 */
export function SoldierGrid({ soldierChains }: SoldierGridProps) {
  const [filter, setFilter] = useState<RoleFilter>("ALL");

  if (soldierChains.length === 0) return null;

  const raterCount = soldierChains.filter((s) => s.myRole === "RATER").length;
  const srCount = soldierChains.filter((s) => s.myRole === "SENIOR_RATER").length;

  const visible =
    filter === "ALL"
      ? soldierChains
      : soldierChains.filter((s) =>
          filter === "RATER" ? s.myRole === "RATER" : s.myRole === "SENIOR_RATER",
        );

  const filterBtn = (label: string, value: RoleFilter) => (
    <button
      key={value}
      onClick={() => setFilter(value)}
      className={
        "rounded-sm border px-3 py-1 text-xs font-medium transition-colors duration-150 " +
        (filter === value
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted text-muted-foreground")
      }
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Header + filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          My Soldiers ({soldierChains.length})
        </h2>
        <div className="flex gap-1.5">
          {filterBtn("All", "ALL")}
          {raterCount > 0 && filterBtn(`As Rater (${raterCount})`, "RATER")}
          {srCount > 0 && filterBtn(`As Senior Rater (${srCount})`, "SENIOR_RATER")}
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((data) => (
          <SoldierCard key={data.chainId} data={data} />
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useApiGet } from "@/lib/api/hooks";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface FormationSoldier {
  id: string;
  rank: string;
  firstName: string;
  lastName: string;
  mos: string;
  unitName?: string;
  rater?: { firstName: string; lastName: string; rank: string } | null;
  evalStatus: string;
  evalId?: string | null;
  overdueMilestoneCount: number;
  isOverdue: boolean;
  hasChainGap: boolean;
  lastChainRater?: { firstName: string; lastName: string; rank: string } | null;
  lastChainEndDate?: string | null;
}

interface FormationData {
  formation: FormationSoldier[];
  stats: {
    totalSoldiers: number;
    completeCount: number;
    completePercent: number;
    overdueCount: number;
    chainGapCount: number;
  };
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  NOT_STARTED:                  { label: "Not Started",      className: "bg-gray-100 text-gray-600" },
  DRAFT:                        { label: "Draft",            className: "bg-slate-100 text-slate-600" },
  RATER_IN_PROGRESS:            { label: "In Progress",      className: "bg-blue-50 text-blue-700" },
  PENDING_SENIOR_RATER:         { label: "Pending SR",       className: "bg-amber-50 text-amber-700" },
  PENDING_SOLDIER_ACK:          { label: "Pending Ack",      className: "bg-amber-50 text-amber-700" },
  PENDING_SUPPLEMENTARY_REVIEW: { label: "Pending Review",   className: "bg-amber-50 text-amber-700" },
  COMPLETE:                     { label: "Complete",         className: "bg-green-50 text-green-700" },
  SUBMITTED:                    { label: "Submitted",        className: "bg-green-50 text-green-700" },
  ACCEPTED:                     { label: "Accepted",         className: "bg-green-100 text-green-800" },
  RETURNED:                     { label: "Returned",         className: "bg-red-50 text-red-700" },
};

export default function CommanderPage() {
  const { data, error, isLoading } = useApiGet<FormationData>("/commander/formation");
  const [search, setSearch] = useState("");

  if (isLoading) return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-sm border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-sm border border-border bg-card p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
  if (error || !data) return <div className="p-6 text-sm text-red-600">API error {error?.status ?? 'Unknown'}: {error?.message ?? 'Failed to load formation'}</div>;

  const filtered = data.formation.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.lastName.toLowerCase().includes(q) ||
      s.firstName.toLowerCase().includes(q) ||
      s.rank.toLowerCase().includes(q)
    );
  });

  const { stats } = data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Formation Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All soldiers in your command — status visibility only, not eval content.
        </p>
      </div>

      {/* Chain-gap alert — Soldiers whose most recent rating chain ended
          with no active replacement (PCS/change-of-rater gap, a recurring
          appeals-driving failure mode called out in product research). */}
      {stats.chainGapCount > 0 && (
        <div className="rounded-sm border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            ⚠️ {stats.chainGapCount} Soldier{stats.chainGapCount !== 1 ? "s" : ""} with an open rating-chain gap
          </p>
          <p className="mt-1 text-xs text-amber-700">
            These Soldiers&apos; most recent rating chain ended with no active
            replacement assigned — the exact PCS/change-of-rater gap that
            drives NCOER appeals when left undocumented. Assign a new chain
            promptly.
          </p>
          <ul className="mt-2 space-y-1">
            {data.formation.filter((s) => s.hasChainGap).map((s) => (
              <li key={s.id} className="text-xs text-amber-800">
                <span className="font-medium">{s.rank} {s.lastName}, {s.firstName}</span>
                {s.lastChainRater && (
                  <> — last rated by {s.lastChainRater.rank} {s.lastChainRater.lastName}</>
                )}
                {s.lastChainEndDate && (
                  <> (chain ended {format(new Date(s.lastChainEndDate), "d MMM yyyy")})</>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stat bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Soldiers</p>
          <p className="text-3xl font-bold mt-0.5">{stats.totalSoldiers}</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Evals Complete</p>
          <p className="text-3xl font-bold mt-0.5 text-[#4B5320]">
            {stats.completeCount} <span className="text-base font-normal text-muted-foreground">({stats.completePercent}%)</span>
          </p>
        </div>
        <div className={`rounded-sm border p-4 ${stats.overdueCount > 0 ? "border-red-200 bg-red-50" : "border-border bg-card"}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Overdue</p>
          <p className={`text-3xl font-bold mt-0.5 ${stats.overdueCount > 0 ? "text-red-700" : ""}`}>{stats.overdueCount}</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Not Started</p>
          <p className="text-3xl font-bold mt-0.5">
            {data.formation.filter((s) => s.evalStatus === "NOT_STARTED").length}
          </p>
        </div>
        <div className={`rounded-sm border p-4 ${stats.chainGapCount > 0 ? "border-amber-200 bg-amber-50" : "border-border bg-card"}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Chain Gaps</p>
          <p className={`text-3xl font-bold mt-0.5 ${stats.chainGapCount > 0 ? "text-amber-700" : ""}`}>{stats.chainGapCount}</p>
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or rank…"
        className="w-full max-w-xs rounded-sm border border-input bg-background px-3 py-1.5 text-sm"
      />

      {/* Formation table */}
      <div className="rounded-sm border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="py-2 px-3 text-left font-medium text-muted-foreground">Soldier</th>
              <th className="py-2 px-3 text-left font-medium text-muted-foreground hidden md:table-cell">MOS</th>
              <th className="py-2 px-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Rater</th>
              <th className="py-2 px-3 text-left font-medium text-muted-foreground">Eval Status</th>
              <th className="py-2 px-3 text-left font-medium text-muted-foreground">Overdue</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const badge = STATUS_BADGE[s.evalStatus] ?? { label: s.evalStatus, className: "bg-gray-100 text-gray-600" };
              return (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-3 font-medium">
                    {s.isOverdue && (
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 shrink-0" title="Overdue milestone" />
                    )}
                    {s.hasChainGap && (
                      <span className="inline-block rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700 mr-2" title="No active rating chain">
                        Gap
                      </span>
                    )}
                    {s.rank} {s.lastName}, {s.firstName}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground hidden md:table-cell">{s.mos}</td>
                  <td className="py-2 px-3 text-muted-foreground hidden lg:table-cell">
                    {s.rater ? `${s.rater.rank} ${s.rater.lastName}` : "—"}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-1.5 py-0.5 text-xs rounded-sm ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    {s.overdueMilestoneCount > 0 ? (
                      <span className="text-xs text-red-600 font-medium">{s.overdueMilestoneCount}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No soldiers match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

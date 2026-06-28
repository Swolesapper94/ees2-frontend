"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { format } from "date-fns";

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
}

interface FormationData {
  formation: FormationSoldier[];
  stats: {
    totalSoldiers: number;
    completeCount: number;
    completePercent: number;
    overdueCount: number;
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
  const [data, setData] = useState<FormationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get<FormationData>("/commander/formation")
      .then(setData)
      .catch((err) => setError(err.status === 403 ? "Commander role required." : "Could not load formation."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading formation…</div>;
  if (error || !data) return <div className="p-6 text-sm text-red-600">{error}</div>;

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

      {/* Stat bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

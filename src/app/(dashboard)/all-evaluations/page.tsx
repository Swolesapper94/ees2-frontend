"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { Evaluation, EvalStatus } from "@/types/evaluation";

const STATUS_LABELS: Record<EvalStatus, string> = {
  DRAFT: "Draft",
  RATER_IN_PROGRESS: "Rater In Progress",
  PENDING_SENIOR_RATER: "Pending Senior Rater",
  PENDING_SOLDIER_ACK: "Pending Soldier Ack",
  PENDING_SUPPLEMENTARY_REVIEW: "Pending Review",
  COMPLETE: "Complete",
  SUBMITTED: "Submitted",
  ACCEPTED: "Accepted",
  RETURNED: "Returned",
};

const STATUS_COLORS: Record<EvalStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  RATER_IN_PROGRESS: "bg-blue-100 text-blue-700",
  PENDING_SENIOR_RATER: "bg-amber-100 text-amber-700",
  PENDING_SOLDIER_ACK: "bg-orange-100 text-orange-700",
  PENDING_SUPPLEMENTARY_REVIEW: "bg-purple-100 text-purple-700",
  COMPLETE: "bg-green-100 text-green-700",
  SUBMITTED: "bg-emerald-100 text-emerald-700",
  ACCEPTED: "bg-emerald-200 text-emerald-900",
  RETURNED: "bg-red-100 text-red-700",
};

interface EvalWithChain extends Evaluation {
  ratingChain?: {
    ratedSoldier?: { firstName: string; lastName: string; rank: string };
    rater?: { firstName: string; lastName: string; rank: string };
    seniorRater?: { firstName: string; lastName: string; rank: string };
  };
}

const ALL_STATUSES = Object.keys(STATUS_LABELS) as EvalStatus[];

export default function AllEvaluationsPage() {
  const [evals, setEvals] = useState<EvalWithChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<EvalStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get<EvalWithChain[]>("/evaluations")
      .then(setEvals)
      .catch(() => setError("Failed to load evaluations"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = evals.filter((e) => {
    if (filterStatus !== "ALL" && e.status !== filterStatus) return false;
    if (search.trim()) {
      const soldier = e.ratingChain?.ratedSoldier;
      const name = soldier
        ? `${soldier.lastName} ${soldier.firstName} ${soldier.rank}`
        : e.id;
      if (!name.toLowerCase().includes(search.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Evaluations</h1>
          <p className="text-sm text-muted-foreground">
            Every evaluation in the system.
          </p>
        </div>
        <Button asChild>
          <Link href="/evaluations/new">Start NCOER</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by soldier name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-sm border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as EvalStatus | "ALL")}
          className="rounded-sm border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {(search || filterStatus !== "ALL") && (
          <button
            onClick={() => { setSearch(""); setFilterStatus("ALL"); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-sm border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {evals.length === 0 ? "No evaluations yet." : "No evaluations match your filters."}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            Showing {filtered.length} of {evals.length} evaluation{evals.length !== 1 ? "s" : ""}
          </p>
          {filtered.map((e) => {
            const soldier = e.ratingChain?.ratedSoldier;
            const rater = e.ratingChain?.rater;
            const soldierName = soldier
              ? `${soldier.lastName}, ${soldier.firstName} (${soldier.rank})`
              : e.id;
            const raterName = rater
              ? `${rater.rank} ${rater.lastName}`
              : "—";
            return (
              <Link
                key={e.id}
                href={`/evaluations/${e.id}/admin`}
                className="flex items-center justify-between rounded-sm border border-border bg-card p-4 hover:bg-accent transition-colors"
              >
                <div>
                  <p className="font-medium">{soldierName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {e.formType.replace(/_/g, "-")} · Rater: {raterName} · Period:{" "}
                    {e.periodStart?.toString().slice(0, 10)} →{" "}
                    {e.periodEnd?.toString().slice(0, 10)}
                  </p>
                </div>
                <span
                  className={`rounded-sm px-2 py-1 text-xs font-medium ${STATUS_COLORS[e.status]}`}
                >
                  {STATUS_LABELS[e.status]}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

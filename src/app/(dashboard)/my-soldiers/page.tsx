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
  };
}

export default function MySoldiersPage() {
  const [evals, setEvals] = useState<EvalWithChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<EvalWithChain[]>("/evaluations?role=rater")
      .then(setEvals)
      .catch(() => setError("Failed to load soldiers' evaluations"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Soldiers</h1>
          <p className="text-sm text-muted-foreground">
            Evaluations for soldiers in your rating chain.
          </p>
        </div>
        <Button asChild>
          <Link href="/evaluations/new?mode=rater">Start NCOER</Link>
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}
      {error && (
        <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && evals.length === 0 && (
        <div className="rounded-sm border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No evaluations found where you are the rater.
          </p>
          <Button asChild className="mt-4">
            <Link href="/evaluations/new?mode=rater">Start an NCOER</Link>
          </Button>
        </div>
      )}

      {evals.length > 0 && (
        <div className="space-y-3">
          {evals.map((e) => {
            const soldier = e.ratingChain?.ratedSoldier;
            const name = soldier
              ? `${soldier.lastName}, ${soldier.firstName} (${soldier.rank})`
              : e.id;
            return (
              <Link
                key={e.id}
                href={`/evaluations/${e.id}/admin`}
                className="flex items-center justify-between rounded-sm border border-border bg-card p-4 hover:bg-accent transition-colors"
              >
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {e.formType.replace(/_/g, "-")} · Period:{" "}
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

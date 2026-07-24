"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useApiGet } from "@/lib/api/hooks";
import type { Evaluation, EvalStatus } from "@/types/evaluation";
import { Skeleton } from "@/components/ui/skeleton";
import { RankInsignia } from "@/components/ui/RankInsignia";
import { rankAbbr } from "@/lib/utils/army-ranks";
import { formatReturnReason, latestReturn } from "@/lib/utils/return-reasons";

const STATUS_LABELS: Record<EvalStatus, string> = {
  DRAFT: "Draft",
  RATER_IN_PROGRESS: "Rater In Progress",
  PENDING_SENIOR_RATER: "Pending Senior Rater",
  PENDING_SOLDIER_ACK: "Pending Soldier Ack",
  PENDING_SUPPLEMENTARY_REVIEW: "Pending Review",
  PENDING_FINAL_FORM_REVIEW: "Pending Final Form Review",
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
  PENDING_FINAL_FORM_REVIEW: "bg-amber-100 text-amber-800",
  COMPLETE: "bg-green-100 text-green-700",
  SUBMITTED: "bg-emerald-100 text-emerald-700",
  ACCEPTED: "bg-emerald-200 text-emerald-900",
  RETURNED: "bg-red-100 text-red-700",
};

interface EvalWithChain extends Evaluation {
  ratingChain?: {
    ratedSoldier?: { firstName: string; lastName: string; rank: string };
  };
}

export default function EvaluationsPage() {
  const { data: evals = [], error, isLoading } = useApiGet<EvalWithChain[]>("/evaluations", {
    refreshInterval: 30_000,
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assigned Evaluations</h1>
          <p className="text-sm text-muted-foreground">
            NCOERs and OERs you can access through your rating-chain role.
          </p>
        </div>
        <Button asChild>
          <Link href="/evaluations/new">Start Evaluation</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-sm border border-border bg-card p-4 flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          API error {error.status}: {error.message}
        </div>
      )}

      {!isLoading && !error && evals.length === 0 && (
        <div className="rounded-sm border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No assigned evaluations yet.</p>
          <Button asChild className="mt-4">
            <Link href="/evaluations/new">Start an evaluation</Link>
          </Button>
        </div>
      )}

      {evals.length > 0 && (
        <div className="space-y-3">
          {evals.map((e) => {
            const soldier = e.ratingChain?.ratedSoldier;
            const activeReturn = e.status === "RETURNED" ? latestReturn(e.returns) : undefined;
            return (
              <Link
                key={e.id}
                href={`/evaluations/${e.id}/admin`}
                className="flex items-center justify-between rounded-sm border border-border bg-card p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  {soldier && <RankInsignia rank={soldier.rank} size="md" />}
                  <div>
                    <p className="font-medium">
                      {soldier
                        ? `${rankAbbr(soldier.rank)} ${soldier.lastName}, ${soldier.firstName}`
                        : e.id}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {e.formType.replace(/_/g, "-")} · Period:{" "}
                      {e.periodStart?.toString().slice(0, 10)} →{" "}
                      {e.periodEnd?.toString().slice(0, 10)}
                    </p>
                    {activeReturn && (
                      <p className="mt-1 text-xs font-medium text-red-700">
                        Returned: {formatReturnReason(activeReturn.returnReason)}
                        {activeReturn.notes ? ` - ${activeReturn.notes}` : ""}
                      </p>
                    )}
                  </div>
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


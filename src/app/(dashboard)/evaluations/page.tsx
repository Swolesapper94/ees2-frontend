"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useApiGet } from "@/lib/api/hooks";
import type { Evaluation } from "@/types/evaluation";
import { Skeleton } from "@/components/ui/skeleton";
import { RankInsignia } from "@/components/ui/RankInsignia";
import { rankAbbr } from "@/lib/utils/army-ranks";
import { formatReturnReason, latestReturn } from "@/lib/utils/return-reasons";
import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

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
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={ClipboardList}
        eyebrow="Rating-chain work"
        title="Assigned Evaluations"
        description="NCOERs and OERs you can access through your assigned rating-chain role."
        tone="info"
        actions={<Button asChild><Link href="/evaluations/new">Start Evaluation</Link></Button>}
      />

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
        <EmptyState
          icon={ClipboardList}
          title="No assigned evaluations yet"
          description="Once a rating assignment is published for you, it will show up here."
          action={
            <Button asChild>
              <Link href="/evaluations/new">Start an evaluation</Link>
            </Button>
          }
        />
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
                className="flex flex-col items-start justify-between gap-3 rounded-sm border border-border bg-card p-4 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-panel sm:flex-row sm:items-center"
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
                <StatusBadge status={e.status} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}


"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useApiGet } from "@/lib/api/hooks";
import type { Evaluation } from "@/types/evaluation";
import { Skeleton } from "@/components/ui/skeleton";
import { RankInsignia } from "@/components/ui/RankInsignia";
import { rankAbbr } from "@/lib/utils/army-ranks";
import { formatReturnReason, latestReturn } from "@/lib/utils/return-reasons";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  rank: string;
  email: string;
}

interface EvalWithChain extends Evaluation {
  ratingChain?: {
    ratedSoldier?: { firstName: string; lastName: string; rank: string };
    rater?: { firstName: string; lastName: string; rank: string };
  };
}

interface CounselingData {
  overallPct: number;
  byType: Record<string, { complete: number; total: number }>;
  overdueSoldiers: Array<{ name: string; type: string }>;
}

export default function MySoldiersPage() {
  const { data: currentUser } = useApiGet<CurrentUser>("/users/me");
  const { data: evals = [], error, isLoading } = useApiGet<EvalWithChain[]>("/evaluations?role=rater", {
    refreshInterval: 30_000,
  });
  const { data: counselingData } = useApiGet<CounselingData>("/dashboard/counseling");

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={Users}
        eyebrow="Rater workspace"
        title="My Soldiers"
        description="Monitor counseling and complete evaluations for Soldiers in your assigned rating chains."
        tone="people"
        actions={<Button asChild><Link href="/evaluations/new?mode=rater">Start NCOER</Link></Button>}
      />
      {/* Current User Card */}
      {isLoading && !currentUser ? (
        <div className="mb-6 rounded-sm border border-border bg-card p-4">
          <Skeleton className="h-6 w-64" />
        </div>
      ) : currentUser ? (
        <div className="mb-6 rounded-sm border-2 border-primary/50 bg-primary/5 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">You</p>
          <div className="mt-2 flex items-center gap-3">
            <RankInsignia rank={currentUser.rank} size="md" />
            <div>
              <p className="font-semibold">
                {rankAbbr(currentUser.rank)} {currentUser.lastName}, {currentUser.firstName}
              </p>
              <p className="text-xs text-muted-foreground">{currentUser.email}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Counseling Overdue Alert */}
      {counselingData && counselingData.overdueSoldiers.length > 0 && (
        <div className="mb-6 rounded-sm border-l-4 border-l-red-500 border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">
            ⚠️ {counselingData.overdueSoldiers.length} soldier{counselingData.overdueSoldiers.length !== 1 ? 's' : ''} with overdue counseling
          </p>
          <div className="mt-3 space-y-2">
            {counselingData.overdueSoldiers.map((s, i) => (
              <p key={i} className="text-xs text-red-800">
                • <span className="font-medium">{s.name}</span> — {s.type.replace(/_/g, ' ').toLowerCase()}
              </p>
            ))}
          </div>
          <div className="mt-3">
            <p className="text-xs text-red-700 mb-2">
              Counseling compliance: <span className="font-semibold">{counselingData.overallPct}%</span> complete
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
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
        <EmptyState icon={Users} title="No assigned evaluations yet" description="Published rating assignments where you are the rater will appear here." action={<Button asChild><Link href="/evaluations/new?mode=rater">Start an NCOER</Link></Button>} />
      )}

      {evals.length > 0 && (
        <div className="space-y-3">
          {evals.map((e) => {
            const soldier = e.ratingChain?.ratedSoldier;
            const activeReturn = e.status === "RETURNED" ? latestReturn(e.returns) : undefined;
            return (
              <div
                key={e.id}
                className="flex flex-col items-stretch justify-between gap-3 rounded-sm border border-border bg-card p-4 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-panel sm:flex-row sm:items-center"
              >
                <Link href={`/evaluations/${e.id}/admin`} className="min-w-0 flex flex-1 items-center gap-3">
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
                </Link>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-3">
                  <StatusBadge status={e.status} />
                  {e.supportFormId && <Button variant="outline" size="sm" asChild><Link href={`/support-form?formId=${e.supportFormId}`}>Record observation</Link></Button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

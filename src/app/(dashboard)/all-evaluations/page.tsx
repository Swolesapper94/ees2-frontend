"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useApiGet } from "@/lib/api/hooks";
import { ApiError, api } from "@/lib/api/client";
import type { Evaluation, EvalStatus } from "@/types/evaluation";
import { Skeleton } from "@/components/ui/skeleton";
import { RankInsignia } from "@/components/ui/RankInsignia";
import { rankAbbr } from "@/lib/utils/army-ranks";

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
    rater?: { firstName: string; lastName: string; rank: string };
    seniorRater?: { firstName: string; lastName: string; rank: string };
  };
}

const ALL_STATUSES = Object.keys(STATUS_LABELS) as EvalStatus[];

export default function AllEvaluationsPage() {
  const { data: evals = [], error, isLoading, mutate } = useApiGet<EvalWithChain[]>("/evaluations", {
    refreshInterval: 30_000,
  });
  const [filterStatus, setFilterStatus] = useState<EvalStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [evaluationToDelete, setEvaluationToDelete] = useState<EvalWithChain | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleDelete() {
    if (!evaluationToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/evaluations/${evaluationToDelete.id}`);
      await mutate(evals.filter((evaluation) => evaluation.id !== evaluationToDelete.id), false);
      setEvaluationToDelete(null);
    } catch (requestError) {
      const message = requestError instanceof ApiError &&
        typeof requestError.details === "object" && requestError.details !== null &&
        "error" in requestError.details && typeof requestError.details.error === "string"
        ? requestError.details.error
        : "Unable to delete this evaluation.";
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  }

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
          aria-label="Filter evaluations by status"
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

      {!isLoading && !error && filtered.length === 0 && (
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
            const raterName = rater
              ? `${rankAbbr(rater.rank)} ${rater.lastName}`
              : "—";
            const deletable = e.status === "DRAFT" || e.status === "RATER_IN_PROGRESS";
            return (
              <div
                key={e.id}
                className="flex items-center justify-between gap-4 rounded-sm border border-border bg-card p-4 transition-colors hover:bg-accent"
              >
                <Link href={`/evaluations/${e.id}/admin`} className="min-w-0 flex flex-1 items-center gap-3">
                <div className="flex items-center gap-3">
                  {soldier && <RankInsignia rank={soldier.rank} size="md" />}
                  <div>
                    <p className="font-medium">
                      {soldier
                        ? `${rankAbbr(soldier.rank)} ${soldier.lastName}, ${soldier.firstName}`
                        : e.id}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {e.formType.replace(/_/g, "-")} · Rater: {raterName} · Period:{" "}
                      {e.periodStart?.toString().slice(0, 10)} →{" "}
                      {e.periodEnd?.toString().slice(0, 10)}
                    </p>
                  </div>
                </div>
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`rounded-sm px-2 py-1 text-xs font-medium ${STATUS_COLORS[e.status]}`}
                >
                  {STATUS_LABELS[e.status]}
                </span>
                  {deletable && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setEvaluationToDelete(e);
                      }}
                      className="rounded-sm border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {evaluationToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-evaluation-title"
        >
          <div className="w-full max-w-md rounded-sm border border-border bg-background p-5 shadow-lg">
            <h2 id="delete-evaluation-title" className="text-lg font-semibold">Delete this draft evaluation?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {evaluationToDelete.ratingChain?.ratedSoldier
                ? `${rankAbbr(evaluationToDelete.ratingChain.ratedSoldier.rank)} ${evaluationToDelete.ratingChain.ratedSoldier.lastName}'s ${evaluationToDelete.formType.replace(/_/g, "-")} will be removed.`
                : "This evaluation will be removed."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              The evaluation, AI suggestions/uploads, milestones, and comments will be deleted. Its consumed support form will be restored for a new attempt.
            </p>
            {deleteError && <p className="mt-3 text-sm text-red-700">{deleteError}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEvaluationToDelete(null)}
                disabled={deleting}
                className="rounded-sm border border-input px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-sm bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete Draft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

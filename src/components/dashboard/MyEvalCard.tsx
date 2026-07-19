"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { CountdownLabel } from "@/components/dashboard/CountdownLabel";
import { RatingSchemeLineage } from "@/components/dashboard/RatingSchemeLineage";
import { rankAbbr } from "@/lib/utils/army-ranks";
import type { DisplayStatus } from "@/components/dashboard/StatusBadge";
import type { EvalFormType } from "@/types/evaluation";

// ── Form label helper ─────────────────────────────────────────────
const FORM_LABELS: Record<EvalFormType, string> = {
  NCOER_9_1: "DA 2166-9-1",
  NCOER_9_2: "DA 2166-9-2",
  NCOER_9_3: "DA 2166-9-3",
  OER_67_10_1: "DA 67-10-1",
  OER_67_10_1A: "DA 67-10-1A",
  OER_67_10_2: "DA 67-10-2",
  OER_67_10_2A: "DA 67-10-2A",
  OER_67_10_3: "DA 67-10-3",
  OER_67_10_4: "DA 67-10-4",
};

// ── Types ─────────────────────────────────────────────────────────
interface User {
  firstName: string;
  lastName: string;
  rank: string;
  dutyTitle?: string | null;
  unit?: { name: string } | null;
}

interface Eval {
  id: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  sections?: { isComplete: boolean }[];
  milestones?: { dueDate: string; type: string }[];
}

interface ChainData {
  id: string;
  rater: User;
  seniorRater: User;
  reviewer?: User | null;
  periodEnd?: string | null;
}

interface MyEvalCardProps {
  soldier: User;
  chain: ChainData;
  latestEval: Eval | null;
  activeSupportFormId: string | null;
  activeSupportFormEntryCount: number;
  formType: EvalFormType;
  evalType: "NCOER" | "OER";
  builderAvailable: boolean;
}

function getDisplayStatus(eval_: Eval | null): DisplayStatus {
  if (!eval_) return "NOT_STARTED";
  return eval_.status as DisplayStatus;
}

function getPrimaryDueDate(eval_: Eval | null, chain: ChainData): string | null {
  if (eval_?.milestones?.length) {
    const submission = eval_.milestones.find(
      (m) => m.type === "EVAL_SUBMISSION_DUE",
    );
    if (submission) return submission.dueDate;
  }
  return chain.periodEnd ?? null;
}

export function MyEvalCard({
  soldier,
  chain,
  latestEval,
  activeSupportFormId,
  activeSupportFormEntryCount,
  formType,
  evalType,
  builderAvailable,
}: MyEvalCardProps) {
  const status = getDisplayStatus(latestEval);
  const dueDate = getPrimaryDueDate(latestEval, chain);
  const rank = rankAbbr(soldier.rank);

  // ── OER stub ──────────────────────────────────────────────────
  if (!builderAvailable) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            My Evaluation
          </h2>
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-semibold text-sm">
                {rank} {soldier.lastName}, {soldier.firstName}
              </span>
              <span className="text-xs text-muted-foreground">
                {evalType} · {FORM_LABELS[formType]}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              OER builder is in development. Your support form is fully
              functional now — start logging accomplishments for your next OER.
            </p>
            <div className="mt-3">
              <Link href={activeSupportFormId ? `/support-form?formId=${activeSupportFormId}` : "/support-form"}>
                <Button variant="outline" size="sm">
                  View Support Form
                  {activeSupportFormEntryCount > 0
                    ? ` · ${activeSupportFormEntryCount} entries`
                    : ""}{" "}
                  →
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <RatingSchemeLineage
          soldier={soldier}
          rater={chain.rater}
          seniorRater={chain.seniorRater}
          reviewer={chain.reviewer}
        />
      </div>
    );
  }

  // ── Primary CTA by status ─────────────────────────────────────
  const primaryCTA = (() => {
    switch (status) {
      case "NOT_STARTED":
        return { label: "Initiate My Evaluation", href: "/evaluations/new" };
      case "DRAFT":
      case "RATER_IN_PROGRESS":
        return {
          label: "Continue My Evaluation",
          href: latestEval ? `/evaluations/${latestEval.id}` : "/evaluations/new",
        };
      case "PENDING_SOLDIER_ACK":
        return {
          label: "Review & Sign Evaluation",
          href: latestEval ? `/evaluations/${latestEval.id}/sign` : "#",
        };
      default:
        return {
          label: "View Evaluation",
          href: latestEval ? `/evaluations/${latestEval.id}` : "#",
        };
    }
  })();

  const supportFormLabel =
    activeSupportFormEntryCount > 0
      ? `Support Form · ${activeSupportFormEntryCount} entries →`
      : status === "NOT_STARTED"
        ? "Start Support Form"
        : "View Support Form →";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          My Evaluation
        </h2>
        <div className="rounded-sm border border-border bg-card p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">
                {rank} {soldier.lastName}, {soldier.firstName}
              </p>
              {soldier.dutyTitle && (
                <p className="text-xs text-muted-foreground">
                  {soldier.dutyTitle}
                  {soldier.unit?.name ? ` · ${soldier.unit.name}` : ""}
                </p>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {evalType} · {FORM_LABELS[formType]}
            </span>
          </div>

          {/* Period */}
          {latestEval && (
            <p className="mt-2 text-xs text-muted-foreground font-mono">
              Period:{" "}
              {new Date(latestEval.periodStart).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}{" "}
              –{" "}
              {new Date(latestEval.periodEnd).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}

          {/* Status + due date */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusBadge status={status} />
            {dueDate && (
              <span className="text-xs text-muted-foreground">
                Due <CountdownLabel dueDate={dueDate} />
              </span>
            )}
          </div>

          {/* CTAs */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link href={primaryCTA.href}>
              <Button size="sm">{primaryCTA.label}</Button>
            </Link>
            <Link href={activeSupportFormId ? `/support-form?formId=${activeSupportFormId}` : "/support-form"}>
              <Button variant="outline" size="sm">
                {supportFormLabel}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Zone A, Part 2 — Rating Scheme */}
      <RatingSchemeLineage
        soldier={soldier}
        rater={chain.rater}
        seniorRater={chain.seniorRater}
        reviewer={chain.reviewer}
      />
    </div>
  );
}

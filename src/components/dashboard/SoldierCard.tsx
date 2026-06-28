"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { CountdownLabel } from "@/components/dashboard/CountdownLabel";
import { rankAbbr } from "@/lib/utils/army-ranks";
import type { DisplayStatus } from "@/components/dashboard/StatusBadge";
import type { EvalFormType } from "@/types/evaluation";

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

interface Eval {
  id: string;
  status: string;
  periodEnd: string;
  sections?: { isComplete: boolean }[];
  milestones?: { dueDate: string; type: string }[];
}

interface OverdueMilestone {
  type: string;
  daysOverdue: number;
}

export interface SoldierCardData {
  chainId: string;
  soldier: {
    id: string;
    firstName: string;
    lastName: string;
    rank: string;
    mos: string;
    dutyTitle?: string | null;
    unit?: { name: string } | null;
  };
  myRole: "RATER" | "SENIOR_RATER";
  latestEval: Eval | null;
  activeSupportFormEntryCount: number;
  sectionCompletionPercent: number;
  overdueMilestone: OverdueMilestone | null;
  formType: EvalFormType;
  evalType: "NCOER" | "OER";
  builderAvailable: boolean;
}

function getStatus(eval_: Eval | null): DisplayStatus {
  if (!eval_) return "NOT_STARTED";
  return eval_.status as DisplayStatus;
}

function getDueDate(eval_: Eval | null): string | null {
  if (!eval_) return null;
  const submission = eval_.milestones?.find(
    (m) => m.type === "EVAL_SUBMISSION_DUE",
  );
  return submission?.dueDate ?? eval_.periodEnd ?? null;
}

function getCTA(
  status: DisplayStatus,
  role: "RATER" | "SENIOR_RATER",
  evalId: string | undefined,
  builderAvailable: boolean,
): { label: string; href: string; disabled: boolean } {
  if (!builderAvailable) {
    return {
      label: "Support Form →",
      href: evalId
        ? `/evaluations/${evalId}/duty`
        : "#",
      disabled: false,
    };
  }

  const base = evalId ? `/evaluations/${evalId}` : "/evaluations/new";

  if (role === "RATER") {
    switch (status) {
      case "NOT_STARTED":
        return { label: "Start Evaluation", href: "/evaluations/new", disabled: false };
      case "DRAFT":
        return { label: "Continue Draft", href: base, disabled: false };
      case "RATER_IN_PROGRESS":
        return { label: "Continue Evaluation", href: base, disabled: false };
      case "PENDING_SENIOR_RATER":
      case "PENDING_SOLDIER_ACK":
        return { label: "Awaiting Soldier Sig", href: base, disabled: true };
      default:
        return { label: "View Evaluation", href: base, disabled: false };
    }
  } else {
    // SENIOR_RATER
    switch (status) {
      case "NOT_STARTED":
        return { label: "Start Evaluation", href: "/evaluations/new", disabled: false };
      case "DRAFT":
      case "RATER_IN_PROGRESS":
        return { label: "Awaiting Rater", href: "#", disabled: true };
      case "PENDING_SENIOR_RATER":
        return { label: "Complete SR Section", href: `${base}/senior-rater`, disabled: false };
      default:
        return { label: "View Evaluation", href: base, disabled: false };
    }
  }
}

export function SoldierCard({ data }: { data: SoldierCardData }) {
  const {
    soldier,
    myRole,
    latestEval,
    sectionCompletionPercent,
    overdueMilestone,
    formType,
    evalType,
    builderAvailable,
  } = data;

  const status = getStatus(latestEval);
  const dueDate = getDueDate(latestEval);
  const cta = getCTA(status, myRole, latestEval?.id, builderAvailable);
  const rank = rankAbbr(soldier.rank);

  return (
    <div className="relative flex flex-col rounded-sm border border-border bg-card overflow-hidden shadow-card">

      {/* OVERDUE banner */}
      {overdueMilestone && (
        <div className="px-3 py-1 text-xs font-medium bg-status-overdue text-white">
          ✗ OVERDUE — {overdueMilestone.type.replace(/_/g, " ")} ·{" "}
          {overdueMilestone.daysOverdue}d past due
        </div>
      )}

      <div className="flex flex-col gap-2.5 p-4">
        {/* Role + form type */}
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>{myRole === "RATER" ? "Rater" : "Senior Rater"}</span>
          <span>{evalType} · {FORM_LABELS[formType]}</span>
        </div>

        {/* Soldier name */}
        <div>
          <p className="font-semibold leading-tight">
            {rank} {soldier.lastName}, {soldier.firstName.charAt(0)}.
          </p>
          <p className="text-xs text-muted-foreground">
            {soldier.mos}
            {soldier.dutyTitle ? ` · ${soldier.dutyTitle}` : ""}
            {soldier.unit?.name ? `, ${soldier.unit.name}` : ""}
          </p>
        </div>

        {/* Due date + status */}
        {dueDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Due {new Date(dueDate).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</span>
            <span className="font-semibold">
              <CountdownLabel dueDate={dueDate} />
            </span>
          </div>
        )}
        <StatusBadge status={status} />

        {/* Progress bar — only for evals in progress */}
        {builderAvailable && latestEval && sectionCompletionPercent > 0 && (
          <div>
            <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
              <span>Sections complete</span>
              <span>{sectionCompletionPercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-status-progress transition-all duration-200"
                style={{ width: `${sectionCompletionPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* OER in-dev notice */}
        {!builderAvailable && (
          <p className="text-xs text-muted-foreground italic">
            OER builder in development
          </p>
        )}

        {/* CTA */}
        {cta.disabled ? (
          <Button size="sm" variant="outline" disabled className="w-full mt-1">
            {cta.label}
          </Button>
        ) : (
          <Link href={cta.href} className="mt-1">
            <Button size="sm" className="w-full">{cta.label}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

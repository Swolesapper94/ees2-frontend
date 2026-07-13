"use client";

import { MyEvalCard } from "@/components/dashboard/MyEvalCard";
import { SoldierGrid } from "@/components/dashboard/SoldierGrid";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { MyRatingTrendPanel } from "@/components/dashboard/MyRatingTrendPanel";
import type { SoldierCardData } from "@/components/dashboard/SoldierCard";
import type { EvalFormType } from "@/types/evaluation";
import { PeopleHelpingMeSummary } from "@/components/access-assistance/PeopleHelpingMeSummary";
import { PeopleIAssistSummary } from "@/components/access-assistance/PeopleIAssistSummary";
import { DashboardAnalyticsHeader } from "@/components/dashboard/DashboardAnalyticsHeader";

// ── Types matching the /api/dashboard response shape ─────────────

interface ChainUser {
  firstName: string;
  lastName: string;
  rank: string;
  mos: string;
  dutyTitle?: string | null;
  unit?: { name: string } | null;
}

interface DashboardEval {
  id: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  sections?: { isComplete: boolean }[];
  milestones?: { dueDate: string; type: string }[];
}

interface MyChainData {
  id: string;
  ratedSoldier: ChainUser;
  rater: ChainUser;
  seniorRater: ChainUser;
  reviewer?: ChainUser | null;
  periodEnd?: string | null;
  latestEval: DashboardEval | null;
  activeSupportFormEntryCount: number;
  formType: EvalFormType;
  evalType: "NCOER" | "OER";
  builderAvailable: boolean;
}

interface MyUser {
  firstName: string;
  lastName: string;
  rank: string;
  profilePictureUrl?: string | null;
}

export interface DashboardShellProps {
  myChain: MyChainData | null;
  soldierChains: SoldierCardData[];
  userRoles: string[];
  myUser?: MyUser;
  dashboardRecap: string;
}

/**
 * Top-level dashboard layout.
 * Zone A (My Evaluation) is always visible.
 * Zone B (My Soldiers) only renders when soldierChains.length > 0.
 * Assistance assignments remain separate from direct rating-chain dashboard data.
 */
export function DashboardShell({ myChain, soldierChains, userRoles, myUser, dashboardRecap }: DashboardShellProps) {
  return (
    <div className="flex flex-col gap-8 p-6">
      {myUser && (
        <DashboardGreeting
          firstName={myUser.firstName}
          lastName={myUser.lastName}
          rank={myUser.rank}
          profilePictureUrl={myUser.profilePictureUrl}
          recap={dashboardRecap}
        />
      )}

      <DashboardAnalyticsHeader userRoles={userRoles} />

      {/* Zone A — My Evaluation */}
      {myChain ? (
        <MyEvalCard
          soldier={myChain.ratedSoldier}
          chain={{
            id: myChain.id,
            rater: myChain.rater,
            seniorRater: myChain.seniorRater,
            reviewer: myChain.reviewer,
            periodEnd: myChain.periodEnd,
          }}
          latestEval={myChain.latestEval}
          activeSupportFormEntryCount={myChain.activeSupportFormEntryCount}
          formType={myChain.formType}
          evalType={myChain.evalType}
          builderAvailable={myChain.builderAvailable}
        />
      ) : (
        <div className="rounded-sm border border-border bg-card p-4 text-sm text-muted-foreground">
          No active rating chain found. Contact your unit admin to be assigned
          to a rating chain.
        </div>
      )}

      {/* Self-referential trend — the Soldier's own rating history, never
          compared to peers. Renders nothing until ≥2 finalized evals exist. */}
      <MyRatingTrendPanel />

      {/* Zone B — My Soldiers (only when present) */}
      <SoldierGrid soldierChains={soldierChains} />

      <PeopleHelpingMeSummary />
      <PeopleIAssistSummary />
    </div>
  );
}


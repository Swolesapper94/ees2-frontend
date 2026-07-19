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
import { UserAvatar } from "@/components/ui/UserAvatar";

// ── Types matching the /api/dashboard response shape ─────────────

interface ChainUser {
  firstName: string;
  lastName: string;
  rank: string;
  mos: string;
  dutyTitle?: string | null;
  unit?: { name: string } | null;
}

interface PersonnelProfile {
  rank?: string;
  payGrade?: string;
  component?: string;
  branchOrMOS?: string;
  dutyTitle?: string;
  unitName?: string | null;
  unitUic?: string | null;
  assignmentStartDate?: string;
  assignmentEndDate?: string | null;
  acftStatus?: string;
  acftScore?: number;
  acftDate?: string;
  heightInches?: number;
  weightPounds?: number;
  bodyCompositionStatus?: string;
  bodyCompositionEffectiveDate?: string;
  personnelSource?: string;
  sourceLabel?: string | null;
  sourceStatus?: string;
  lastRefreshed?: string | null;
  profilePhotoUrl?: string | null;
  profilePhotoSource?: string | null;
  profilePhotoSourceLabel?: string | null;
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
  assignmentSource?: "RATING_SCHEME_ASSIGNMENT" | "LEGACY_RATING_CHAIN";
  assignmentEffectiveDate?: string;
  periodEnd?: string | null;
  latestEval: DashboardEval | null;
  activeSupportFormId: string | null;
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
  personnelProfile?: PersonnelProfile;
}

export interface DashboardShellProps {
  myChain: MyChainData | null;
  soldierChains: SoldierCardData[];
  userRoles: string[];
  myUser?: MyUser;
  dashboardRecap: string;
}

function formatDate(value?: string | null): string {
  if (!value) return "Not listed";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value ?? "Not listed"}</dd>
    </div>
  );
}

function SourceBadge({ children, tone = "neutral" }: { children: string; tone?: "neutral" | "green" | "amber" }) {
  const className = tone === "green"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-border bg-muted/40 text-foreground";
  return <span className={`rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${className}`}>{children}</span>;
}

function CurrentArmyProfile({ profile, myChain, user }: { profile?: PersonnelProfile; myChain: MyChainData | null; user?: MyUser }) {
  if (!profile) return null;
  const acft = [profile.acftStatus, profile.acftScore ? `${profile.acftScore}` : null].filter(Boolean).join(" · ");
  const heightWeight = [profile.heightInches ? `${profile.heightInches} in` : null, profile.weightPounds ? `${profile.weightPounds} lb` : null].filter(Boolean).join(" / ");
  const initials = user ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() || user.rank.slice(0, 2) : "--";
  const photoUrl = profile.profilePhotoUrl ?? user?.profilePictureUrl ?? null;
  return (
    <details className="rounded-sm border border-border bg-card p-4">
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 [&::-webkit-details-marker]:hidden" aria-label="Toggle Current Army Profile">
        <div className="flex min-w-0 items-start gap-3">
          <UserAvatar src={photoUrl} initials={initials} alt={`${profile.rank ?? user?.rank ?? "User"} profile photo`} size="md" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Current Army Profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">Authoritative personnel context for the signed-in user.</p>
            {profile.profilePhotoSource && <p className="mt-1 text-xs text-muted-foreground">Photo source: {profile.profilePhotoSource} {profile.profilePhotoSourceLabel ? `- ${profile.profilePhotoSourceLabel}` : ""}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <SourceBadge>{profile.personnelSource ?? "IPPS-A"}</SourceBadge>
          {profile.sourceLabel && <SourceBadge tone="amber">{profile.sourceLabel}</SourceBadge>}
          <SourceBadge tone="green">{profile.sourceStatus ?? "CURRENT"}</SourceBadge>
          <span className="px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Click to expand</span>
        </div>
      </summary>
      <p className="mt-3 text-xs text-muted-foreground">
        Personnel source: {profile.personnelSource ?? "IPPS-A"} {profile.sourceLabel ? `- ${profile.sourceLabel}` : ""} · Last refreshed: {formatDate(profile.lastRefreshed)}
      </p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Rank / grade" value={[profile.rank, profile.payGrade].filter(Boolean).join(" / ")} />
        <Field label="Component" value={profile.component} />
        <Field label="MOS / branch" value={profile.branchOrMOS} />
        <Field label="Duty title" value={profile.dutyTitle} />
        <Field label="Unit" value={profile.unitName} />
        <Field label="UIC" value={profile.unitUic} />
        <Field label="Assignment effective" value={formatDate(profile.assignmentStartDate ?? myChain?.assignmentEffectiveDate)} />
        <Field label="ACFT" value={acft || "Not listed"} />
        <Field label="ACFT date" value={formatDate(profile.acftDate)} />
        <Field label="Height / weight" value={heightWeight || "Not listed"} />
        <Field label="Body composition" value={profile.bodyCompositionStatus} />
        <Field label="Body composition date" value={formatDate(profile.bodyCompositionEffectiveDate)} />
      </dl>
    </details>
  );
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
          dutyTitle={myUser.personnelProfile?.dutyTitle}
          unitName={myUser.personnelProfile?.unitName}
          recap={dashboardRecap}
        />
      )}

      <CurrentArmyProfile profile={myUser?.personnelProfile} myChain={myChain} user={myUser} />

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
          activeSupportFormId={myChain.activeSupportFormId}
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


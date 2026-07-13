"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { MetricTooltip } from "../shared/MetricTooltip";
import { RankTabs } from "./RankTabs";
import { DistributionBars } from "./DistributionBars";
import { ProfileCallout } from "./ProfileCallout";
import { LifetimeStats } from "./LifetimeStats";

interface GradeData {
  grade: string;
  isNco: boolean;
  counts: { MQ: number; HQ: number; Q: number; NQ: number };
  total: number;
  mqPct: number;
  cap: number;
  recommended: number;
  cushion: number;
  misfire: boolean;
  approaching: boolean;
  newProfile: boolean;
}

interface SrProfileData {
  grades: GradeData[];
  totalRendered: number;
  onTime: number;
  onTimePct: number;
  misfireCount: number;
}

const SR_PANEL_TOOLTIP =
  "Your SR profile is a running record at HRC of how you have rated every NCO and officer at each grade. HRC selection boards use your profile to calibrate the weight of your ratings. A 'misfire' occurs when your MOST QUALIFIED percentage exceeds the cap for that grade — the rating is downgraded automatically at HRC and flagged on the timeliness report. You are responsible for managing your own profile. (DA PAM 623-3 §3-19)";

/**
 * SR Profile Health panel — conditional, SR users only.
 * Spec §6 — full-width, blue accent border, rank tabs + distribution bars.
 */
export function SrProfilePanel() {
  const [data, setData] = useState<SrProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGrade, setActiveGrade] = useState<string>("");

  useEffect(() => {
    api.get<SrProfileData>("/dashboard/sr-profile")
      .then((d) => {
        setData(d);
        if (d.grades.length > 0) setActiveGrade(d.grades[0].grade);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeData = data?.grades.find((g) => g.grade === activeGrade);
  const isEmpty = !loading && data && data.grades.length === 0;

  return (
    <div className="bg-slate-50 rounded-lg p-4 border-2 border-blue-300">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex items-center">
          <h3 className="text-sm font-semibold text-slate-800">SR profile health</h3>
          <MetricTooltip content={SR_PANEL_TOOLTIP} />
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700">
          Senior Rater only
        </span>
        <span className="ml-auto text-xs text-slate-400 hidden sm:block">
          Only visible to you — not shared with your chain
        </span>
      </div>

      {/* EES 2.0 profile caveat */}
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 mb-3">
        Profile reflects evals submitted through EES 2.0. Your full HRC profile includes evals from
        prior systems — log into HRC&apos;s EES to view your complete record.
      </p>

      {loading ? (
        <div className="h-48 animate-pulse rounded bg-slate-200" />
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center h-24 gap-2 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M3 7v8a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4"/></svg>
          <p className="text-xs text-center max-w-xs">
            No senior rater evaluations on record. Your profile will populate after your first NCOER or
            OER is accepted at HRC.
          </p>
        </div>
      ) : data && activeData ? (
        <>
          {/* Rank tabs */}
          <RankTabs
            grades={data.grades.map((g) => ({ grade: g.grade, isNco: g.isNco }))}
            activeGrade={activeGrade}
            onChange={setActiveGrade}
          />

          {/* Two-column layout */}
          <div className="flex gap-6 flex-col sm:flex-row">
            {/* Left: distribution bars */}
            <div className="flex-[1.4] min-w-0">
              <DistributionBars
                counts={activeData.counts}
                total={activeData.total}
                isNco={activeData.isNco}
                mqPct={activeData.mqPct}
                cap={activeData.cap}
                recommended={activeData.recommended}
              />
              <ProfileCallout
                grade={activeData.grade}
                mqPct={activeData.mqPct}
                cap={activeData.cap}
                recommended={activeData.recommended}
                cushion={activeData.cushion}
                misfire={activeData.misfire}
                approaching={activeData.approaching}
                newProfile={activeData.newProfile}
              />
            </div>

            {/* Right: lifetime stats */}
            <div className="flex-1 min-w-0">
              <LifetimeStats
                totalRendered={data.totalRendered}
                onTime={data.onTime}
                onTimePct={data.onTimePct}
                misfireCount={data.misfireCount}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

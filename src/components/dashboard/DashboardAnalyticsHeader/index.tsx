"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { KpiTile } from "./KpiStrip/KpiTile";
import { HrcTrendPanel } from "./HrcTrendPanel";
import { DueWindowsPanel } from "./DueWindowsPanel";
import { ChainVelocityPanel } from "./ChainVelocityPanel";
import { CounselingPanel } from "./CounselingPanel";
import { HrcReturnPanel } from "./HrcReturnPanel";
import { SrProfilePanel } from "./SrProfilePanel";

interface AnalyticsKpiData {
  avgHrcProcessing: number | null;
  hrcProcessingDelta: number | null;
  lateEvalRate: number;
  dueIn30: number;
  counselingCompliancePct: number;
  overdueCounseling: number;
  returnCount: number;
  totalSubmitted: number;
  returnRatePct: number;
  unitReturnRatePct: number;
}

interface DashboardAnalyticsHeaderProps {
  /** Roles from the authenticated user — used for SR panel conditional render */
  userRoles: string[];
}

/**
 * Dashboard Analytics Header — intelligence strip rendered above Zone A and Zone B.
 * Spec §1 — Tier 1 KPI strip + Tier 2 detail panels.
 *
 * SR Profile panel is conditionally rendered (DOM excluded if not SR).
 * All panels fetch their own data independently; KPI strip is fetched here
 * to keep the header self-contained.
 */
export function DashboardAnalyticsHeader({ userRoles }: DashboardAnalyticsHeaderProps) {
  const [kpi, setKpi] = useState<AnalyticsKpiData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  const isSeniorRater = userRoles.includes("SENIOR_RATER");

  useEffect(() => {
    api.get<AnalyticsKpiData>("/dashboard/analytics")
      .then(setKpi)
      .catch(() => {})
      .finally(() => setKpiLoading(false));
  }, []);

  // Only show header to rating officials (Rater or SR)
  if (!userRoles.includes("RATER") && !isSeniorRater) return null;

  return (
    <section aria-label="Dashboard analytics" className="flex flex-col gap-4 mb-2">
      {/* ── Tier 1: KPI Strip ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiTile
          label="Avg HRC processing"
          value={kpi?.avgHrcProcessing ?? null}
          unit="days"
          delta={kpi?.hrcProcessingDelta ?? null}
          deltaUnit=" days"
          deltaInvert        // increasing processing time is bad
          loading={kpiLoading}
        />
        <KpiTile
          label="Late eval rate (you)"
          value={kpi ? kpi.lateEvalRate : null}
          unit="%"
          loading={kpiLoading}
        />
        <KpiTile
          label="Due in 30 days"
          value={kpi ? kpi.dueIn30 : null}
          subLabel="as Rater or SR"
          valueColor={kpi && kpi.dueIn30 > 0 ? "text-red-700" : undefined}
          loading={kpiLoading}
        />
        <KpiTile
          label="Counseling compliance"
          value={kpi ? kpi.counselingCompliancePct : null}
          unit="%"
          delta={kpi && kpi.overdueCounseling > 0 ? kpi.overdueCounseling : null}
          deltaUnit=" sessions overdue"
          deltaLabel=""
          deltaInvert
          loading={kpiLoading}
        />
        <KpiTile
          label="HRC returns (lifetime)"
          value={kpi ? `${kpi.returnCount}/${kpi.totalSubmitted}` : null}
          subLabel={kpi ? `${kpi.returnRatePct}% return rate` : undefined}
          delta={
            kpi
              ? kpi.returnRatePct - kpi.unitReturnRatePct
              : null
          }
          deltaLabel={
            kpi
              ? kpi.returnRatePct <= kpi.unitReturnRatePct
                ? "below unit avg"
                : "above unit avg"
              : undefined
          }
          deltaInvert
          loading={kpiLoading}
        />
      </div>

      {/* ── Tier 2: Detail panels ───────────────────────────────── */}

      {/* Row 1: HRC Trend (wider) + Due Windows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:[grid-template-columns:1.35fr_1fr]">
        <HrcTrendPanel />
        <DueWindowsPanel />
      </div>

      {/* Row 2: Chain Velocity + Counseling + HRC Returns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ChainVelocityPanel />
        <CounselingPanel />
        <HrcReturnPanel />
      </div>

      {/* Row 3: SR Profile (conditional, full width, NOT in DOM if not SR) */}
      {isSeniorRater && <SrProfilePanel />}
    </section>
  );
}

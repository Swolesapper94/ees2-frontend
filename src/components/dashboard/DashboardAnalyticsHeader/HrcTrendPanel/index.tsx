"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { MetricTooltip } from "../shared/MetricTooltip";
import { HrcTrendChart } from "./HrcTrendChart";

interface HrcTrendData {
  months: { month: string; ncoeravg: number | null; oeravg: number | null }[];
}

const EMPTY_STATE = (
  <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-400">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M3 7v8a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4"/></svg>
    <p className="text-xs text-center max-w-xs">
      No submission data yet — trend will populate once your first eval is accepted at HRC.
    </p>
  </div>
);

export function HrcTrendPanel() {
  const [data, setData] = useState<HrcTrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<HrcTrendData>("/dashboard/hrc-trend").then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const hasData = data?.months.some((m) => m.ncoeravg !== null || m.oeravg !== null);

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center">
          <h3 className="text-sm font-semibold text-slate-800">HRC processing time trend</h3>
          <MetricTooltip
            content="This chart tracks how many days elapsed between when each evaluation was submitted to HRC and when HRC officially accepted it into the record. Rising processing times may indicate backlogs at HRC — plan your submission timelines accordingly, especially before boards."
          />
        </div>
        <span className="text-xs text-slate-400">Submission → accepted at HRC</span>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded bg-slate-200" />
      ) : !hasData ? (
        EMPTY_STATE
      ) : (
        <HrcTrendChart data={data!.months} />
      )}
    </div>
  );
}

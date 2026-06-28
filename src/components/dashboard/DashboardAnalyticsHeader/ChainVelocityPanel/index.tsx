"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { MetricTooltip } from "../shared/MetricTooltip";
import { VelocityChart } from "./VelocityChart";

interface ChainVelocityData {
  raterStageDays: number;
  srStageDays: number;
  ackStageDays: number;
  sampleSize: number;
}

function InsightCallout({ rater, sr, ack }: { rater: number; sr: number; ack: number }) {
  if (sr > rater * 2) {
    const multiple = rater > 0 ? (sr / rater).toFixed(1) : "—";
    return (
      <div className="mt-3 rounded-md px-3 py-2 bg-amber-50 border border-amber-200 text-xs text-amber-800">
        SR stage is {multiple}× your rater stage — consider earlier informal review requests.
      </div>
    );
  }
  if (ack > 7) {
    return (
      <div className="mt-3 rounded-md px-3 py-2 bg-amber-50 border border-amber-200 text-xs text-amber-800">
        Soldier acknowledgment is averaging {ack} days — a direct conversation may help.
      </div>
    );
  }
  if (rater < 15 && sr < 15 && ack < 15) {
    return (
      <div className="mt-3 rounded-md px-3 py-2 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
        Your chain is moving efficiently across all stages.
      </div>
    );
  }
  return null;
}

export function ChainVelocityPanel() {
  const [data, setData] = useState<ChainVelocityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ChainVelocityData>("/dashboard/chain-velocity")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isEmpty = !loading && (data === null || data.sampleSize < 3);

  // SR bar color: red if > 2× rater stage
  const srColor =
    data && data.srStageDays > data.raterStageDays * 2 ? "#e34948" : "#2a78d6";

  const bars = data
    ? [
        { label: "Rater stage", days: data.raterStageDays, color: "#2a78d6" },
        { label: "SR stage", days: data.srStageDays, color: srColor },
        { label: "Soldier ack", days: data.ackStageDays, color: "#1baf7a" },
      ]
    : [];

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <div className="flex items-center mb-1">
        <h3 className="text-sm font-semibold text-slate-800">Chain velocity</h3>
        <MetricTooltip
          content="Chain velocity shows the average number of days an evaluation spent in each routing stage before moving forward. Long Rater stage times suggest drafting delays. Long SR stage times may indicate routing bottlenecks. Soldier acknowledgment times above 7 days may warrant a direct conversation."
        />
      </div>
      <p className="text-xs text-slate-400 mb-3">Avg days per stage, your evals</p>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-slate-200" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center h-24 gap-2 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M3 7v8a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4"/></svg>
          <p className="text-xs text-center">Need at least 3 completed evals to calculate stage averages.</p>
        </div>
      ) : (
        <>
          <VelocityChart bars={bars} maxDays={40} />
          {data && <InsightCallout rater={data.raterStageDays} sr={data.srStageDays} ack={data.ackStageDays} />}
        </>
      )}
    </div>
  );
}

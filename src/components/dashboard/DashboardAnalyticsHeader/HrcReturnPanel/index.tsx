"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { MetricTooltip } from "../shared/MetricTooltip";

interface ReturnBreakdownItem {
  reason: string;
  count: number;
}

interface ReturnData {
  totalReturned: number;
  totalSubmitted: number;
  returnRatePct: number;
  unitReturnRatePct: number;
  breakdown: ReturnBreakdownItem[];
}

const REASON_META: Record<string, { label: string; tooltip?: string }> = {
  ADMIN_ERROR: { label: "Administrative error" },
  PROHIBITED_LANGUAGE: {
    label: "Prohibited language",
    tooltip:
      'Prohibited language includes superlatives used as gimmicks (e.g., "the best NCO I have ever rated"), future-oriented statements, and references to race, gender, religion, or national origin. MERIT\'s language checker intercepts these before submission. (AR 623-3)',
  },
  MISSING_SIGNATURE: { label: "Missing signature" },
  RATING_PERIOD_ERROR: {
    label: "Rating period error",
    tooltip:
      "Rating period errors occur when the FROM and THRU dates overlap with a previous eval, are entered in the wrong order, or don't align with the soldier's assignment history. HRC will reject overlapping periods without exception.",
  },
  OTHER: { label: "Other" },
};

export function HrcReturnPanel() {
  const [data, setData] = useState<ReturnData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ReturnData>("/dashboard/returns")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isEmpty = !loading && data && data.totalSubmitted === 0;
  const belowUnit = data && data.returnRatePct <= data.unitReturnRatePct;

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <div className="flex items-center mb-1">
        <h3 className="text-sm font-semibold text-slate-800">HRC return rate</h3>
        <MetricTooltip
          content="A return occurs when HRC rejects a submitted evaluation and sends it back for correction. Common causes include administrative errors, prohibited language in narratives, missing or out-of-sequence signatures, and rating period overlaps. Each return delays the official record and is visible in the SR timeliness report. MERIT tracks your return history by cause to help you avoid repeat errors."
        />
      </div>
      <p className="text-xs text-slate-400 mb-3">Your lifetime submission history</p>

      {loading ? (
        <div className="h-24 animate-pulse rounded bg-slate-200" />
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center h-24 gap-2 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M3 7v8a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4"/></svg>
          <p className="text-xs">No submissions on record yet.</p>
        </div>
      ) : data ? (
        <>
          {/* Header count */}
          <div className="mb-2">
            <div className="text-2xl font-semibold text-slate-900 tabular-nums">
              {data.totalReturned}{" "}
              <span className="text-sm font-normal text-slate-500">
                return{data.totalReturned !== 1 ? "s" : ""} out of {data.totalSubmitted} submitted
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs">
              <span className="font-medium text-slate-700">{data.returnRatePct}% return rate</span>
              <span className={belowUnit ? "text-emerald-600" : "text-red-600"}>
                — {belowUnit ? "below" : "above"} unit avg of {data.unitReturnRatePct}%
              </span>
            </div>
          </div>

          {/* Reason breakdown */}
          <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-slate-200">
            {data.breakdown.map((item) => {
              const meta = REASON_META[item.reason] ?? { label: item.reason };
              const hasReturns = item.count > 0;
              return (
                <div key={item.reason} className="flex items-center justify-between gap-2">
                  <div className="flex items-center text-xs text-slate-600 truncate">
                    {meta.label}
                    {meta.tooltip && (
                      <MetricTooltip content={meta.tooltip} position="below" />
                    )}
                  </div>
                  <span
                    className={[
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                      hasReturns
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700",
                    ].join(" ")}
                  >
                    {item.count} {item.count === 1 ? "return" : "returns"}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

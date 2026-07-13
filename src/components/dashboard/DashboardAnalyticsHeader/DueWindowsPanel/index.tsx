"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { MetricTooltip } from "../shared/MetricTooltip";

interface DueWindowBucket {
  count: number;
  asRater: number;
  asSr: number;
}

interface DueWindowsData {
  window30: DueWindowBucket;
  window60: DueWindowBucket;
  window90: DueWindowBucket;
}

const BUCKETS = [
  {
    key: "window30" as const,
    label: "Due within 30 days",
    param: "30",
    iconPath:
      "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
    iconBg: "bg-red-50",
    iconColor: "text-red-700",
    countColor: "text-red-700",
  },
  {
    key: "window60" as const,
    label: "Due in 31–60 days",
    param: "60",
    iconPath: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-6v-4m0-4h.01",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-800",
    countColor: "text-amber-800",
  },
  {
    key: "window90" as const,
    label: "Due in 61–90 days",
    param: "90",
    iconPath: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
    iconBg: "bg-green-50",
    iconColor: "text-green-700",
    countColor: "text-green-700",
  },
];

export function DueWindowsPanel() {
  const [data, setData] = useState<DueWindowsData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get<DueWindowsData>("/dashboard/due-windows")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isEmpty =
    !loading &&
    data &&
    data.window30.count === 0 &&
    data.window60.count === 0 &&
    data.window90.count === 0;

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      {/* Header */}
      <div className="flex items-center mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Evals due by window</h3>
        <MetricTooltip
          content="Each soldier's next evaluation due date is calculated from the THRU date of their most recent annual evaluation, plus 365 days. The HRC submission deadline is 90 days after that THRU date. These buckets show how many soldiers in your rating chains are approaching their annual eval window — as either Rater or SR."
        />
      </div>
      <p className="text-xs text-slate-400 mb-3">From soldiers' last THRU date</p>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-slate-200" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center h-24 gap-2 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M3 7v8a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4"/></svg>
          <p className="text-xs">No evaluations in your assigned rating chains are due in the next 90 days.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {BUCKETS.map((b) => {
            const bucket = data?.[b.key];
            return (
              <button
                key={b.key}
                type="button"
                onClick={() => router.push(`/evaluations?dueWindow=${b.param}`)}
                className="flex items-center gap-3 rounded-md p-2.5 hover:bg-slate-100 transition-colors text-left w-full"
              >
                {/* Icon */}
                <span className={`flex-none flex items-center justify-center w-8 h-8 rounded-md ${b.iconBg} ${b.iconColor}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={b.iconPath} />
                  </svg>
                </span>

                {/* Label + role breakdown */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{b.label}</p>
                  {bucket && (
                    <p className="text-[11px] text-slate-400">
                      {bucket.asRater} as Rater · {bucket.asSr} as SR
                    </p>
                  )}
                </div>

                {/* Count */}
                <span className={`text-xl font-bold tabular-nums ${b.countColor}`}>
                  {bucket?.count ?? 0}
                </span>

                {/* Arrow */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            );
          })}

          {/* Footer note */}
          <p className="text-xs text-slate-400 mt-1 pt-2 border-t border-slate-200">
            ⓘ HRC submission deadline = soldier&apos;s last THRU date + 90 days
          </p>
        </div>
      )}
    </div>
  );
}

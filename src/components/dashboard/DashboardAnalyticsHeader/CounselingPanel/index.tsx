"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { MetricTooltip } from "../shared/MetricTooltip";
import { ComplianceDonut } from "./ComplianceDonut";

interface ByType {
  complete: number;
  total: number;
}

interface CounselingData {
  overallPct: number;
  byType: {
    INITIAL_COUNSELING_DUE: ByType;
    QUARTERLY_COUNSELING_1: ByType;
    QUARTERLY_COUNSELING_2: ByType;
    QUARTERLY_COUNSELING_3: ByType;
  };
  overdueSoldiers: { name: string; type: string }[];
}

const TYPE_LABELS: Record<string, { label: string; tooltip: string }> = {
  INITIAL_COUNSELING_DUE: {
    label: "Initial counseling",
    tooltip:
      "Must occur within the first 30 days of the rating period. The rated soldier and rater initial Part II of the DA 2166-9-1A to confirm it occurred. (DA PAM 623-3)",
  },
  QUARTERLY_COUNSELING_1: {
    label: "Quarterly 1",
    tooltip:
      "Required at approximately 90-day intervals for RA and AGR NCOs. USAR/ARNG NCOs require at least semiannual counseling. Documented by dated initials in Part II of the support form.",
  },
  QUARTERLY_COUNSELING_2: {
    label: "Quarterly 2",
    tooltip:
      "Required at approximately 90-day intervals for RA and AGR NCOs. USAR/ARNG NCOs require at least semiannual counseling. Documented by dated initials in Part II of the support form.",
  },
  QUARTERLY_COUNSELING_3: {
    label: "Quarterly 3",
    tooltip:
      "Required at approximately 90-day intervals for RA and AGR NCOs. USAR/ARNG NCOs require at least semiannual counseling. Documented by dated initials in Part II of the support form.",
  },
};

const TYPE_ORDER = [
  "INITIAL_COUNSELING_DUE",
  "QUARTERLY_COUNSELING_1",
  "QUARTERLY_COUNSELING_2",
  "QUARTERLY_COUNSELING_3",
] as const;

export function CounselingPanel() {
  const [data, setData] = useState<CounselingData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get<CounselingData>("/dashboard/counseling")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isEmpty =
    !loading &&
    data &&
    Object.values(data.byType).every((v) => v.total === 0);

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <div className="flex items-center mb-1">
        <h3 className="text-sm font-semibold text-slate-800">Counseling compliance</h3>
        <MetricTooltip
          content="Counseling compliance tracks whether required counseling sessions have been completed on time for each soldier you rate. Initial counseling is required within 30 days of the rating period start. Quarterly counseling is required at ~90-day intervals (at least quarterly for RA/AGR; semiannually for USAR/ARNG). Missed counselings weaken your eval and can be cited as a deficiency. Source: DA PAM 623-3."
        />
      </div>
      <p className="text-xs text-slate-400 mb-3">Your active rated soldiers</p>

      {loading ? (
        <div className="h-24 animate-pulse rounded bg-slate-200" />
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center h-24 gap-2 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M3 7v8a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4"/></svg>
          <p className="text-xs">No active counseling milestones.</p>
        </div>
      ) : data ? (
        <>
          <div className="flex gap-4 items-start">
            {/* Donut */}
            <ComplianceDonut pct={data.overallPct} />

            {/* Table */}
            <div className="flex-1 flex flex-col gap-1.5">
              {TYPE_ORDER.map((type) => {
                const row = data.byType[type];
                const allDone = row.total > 0 && row.complete === row.total;
                const fractional = `${row.complete}/${row.total}`;
                const valueColor = allDone ? "text-emerald-600" : row.complete < row.total ? "text-red-600" : "text-slate-500";
                const { label, tooltip } = TYPE_LABELS[type];
                return (
                  <div key={type} className="flex items-center justify-between gap-2">
                    <div className="flex items-center text-xs text-slate-600 truncate">
                      {label}
                      <MetricTooltip content={tooltip} position="below" />
                    </div>
                    <span className={`text-xs font-semibold tabular-nums ${valueColor}`}>
                      {row.total > 0 ? fractional : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overdue callout */}
          {data.overdueSoldiers.length > 0 && (
            <button
              type="button"
              onClick={() => router.push("/soldiers?filter=counseling-overdue")}
              className="mt-3 w-full text-left rounded-md px-3 py-2 bg-amber-50 border border-amber-200 text-xs text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <span className="font-medium">
                ⚠ {data.overdueSoldiers.map((s) => s.name).join(", and ")}
              </span>{" "}
              {data.overdueSoldiers.length === 1 ? "is" : "are"} missing counseling — review now ↗
            </button>
          )}
        </>
      ) : null}
    </div>
  );
}

"use client";

import { MetricTooltip } from "../shared/MetricTooltip";

interface Counts {
  MQ: number;
  HQ: number;
  Q: number;
  NQ: number;
}

interface DistributionBarsProps {
  counts: Counts;
  total: number;
  isNco: boolean;
  mqPct: number;
  cap: number;
  recommended: number;
}

const ROWS = [
  {
    key: "MQ" as const,
    label: "Most qualified",
    color: "#2a78d6",
    hasCap: true,
  },
  {
    key: "HQ" as const,
    label: "Highly qualified",
    color: "#1baf7a",
    hasCap: false,
  },
  {
    key: "Q" as const,
    label: "Qualified",
    color: "#888780",
    hasCap: false,
  },
  {
    key: "NQ" as const,
    label: "Not qualified",
    color: "#e34948",
    hasCap: false,
  },
];

/**
 * Per-grade distribution bars with cap line for MQ row.
 * Spec §6c.
 */
export function DistributionBars({
  counts,
  total,
  isNco,
  mqPct,
  cap,
  recommended,
}: DistributionBarsProps) {
  const ncoMqTooltip =
    "For NCOERs, MOST QUALIFIED ratings must not exceed 24% of your total ratings at this grade. Exceeding the cap causes a 'Senior Rater Misfire' — the rating is automatically downgraded to HIGHLY QUALIFIED at HRC and permanently charged to your profile. (DA PAM 623-3 §3-19)";
  const oerMqTooltip =
    "For OERs, MOST QUALIFIED ratings must remain below 50% of your total ratings at this grade. Best practice is to limit MQ ratings to no more than one-third of all ratings to maintain a meaningful cushion. Exceeding 50% triggers a misfire and automatic downgrade. (DA PAM 623-3 §2-x)";
  const hqNcoTooltip =
    "HIGHLY QUALIFIED is the second tier. An NCOER with a MOST QUALIFIED box check that causes a misfire will be relabeled HIGHLY QUALIFIED at HRC — but it still counts against your profile as a MOST QUALIFIED and is permanently charged as a misfire.";

  return (
    <div className="flex flex-col gap-3">
      {ROWS.map((row) => {
        const count = counts[row.key];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const barWidth = pct; // % of track

        return (
          <div key={row.key}>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs text-slate-600 w-28 shrink-0">{row.label}</span>
              {row.key === "MQ" && (
                <MetricTooltip
                  content={isNco ? ncoMqTooltip : oerMqTooltip}
                  position="below"
                />
              )}
              {row.key === "HQ" && isNco && (
                <MetricTooltip content={hqNcoTooltip} position="below" />
              )}
              <span className="text-xs text-slate-500 tabular-nums ml-auto">
                {count}/{total} ({pct}%)
              </span>
            </div>

            {/* Bar track with cap line */}
            <div className="relative h-4 bg-slate-200 rounded-sm overflow-visible">
              {/* Filled bar */}
              <div
                className="absolute inset-y-0 left-0 rounded-sm"
                style={{ width: `${barWidth}%`, backgroundColor: row.color }}
              />

              {/* Cap line — only on MQ row */}
              {row.hasCap && (
                <>
                  <div
                    className="absolute inset-y-0 w-px bg-red-500 z-10"
                    style={{ left: `${recommended}%` }}
                  />
                  <span
                    className="absolute text-[9px] text-red-500 whitespace-nowrap"
                    style={{ left: `${recommended}%`, top: "100%", transform: "translateX(-50%)", marginTop: "2px" }}
                  >
                    ← {recommended}% cap
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

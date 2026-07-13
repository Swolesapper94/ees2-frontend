"use client";

import { MetricTooltip } from "../shared/MetricTooltip";

interface LifetimeStatsProps {
  totalRendered: number;
  onTime: number;
  onTimePct: number;
  misfireCount: number;
}

const SEQ_TOOLTIP =
  "HRC processes NCOERs in receipt order and publishes your profile in that sequence. If you submit an NCOER out of order — for example, submitting an annual eval before an earlier change-of-rater eval — the profile label on the later eval will reflect an incorrect history. There is no correction process for sequencing errors. (DA PAM 623-3 §3-19c)";

/**
 * Right column of SR Profile Panel — 4 stat tiles + sequence reminder.
 * Spec §6e.
 */
export function LifetimeStats({
  totalRendered,
  onTime,
  onTimePct,
  misfireCount,
}: LifetimeStatsProps) {
  const tiles = [
    { label: "Total rendered", value: totalRendered.toString() },
    { label: "Submitted on time", value: `${onTime}/${totalRendered}` },
    {
      label: "Profile misfires",
      value: misfireCount.toString(),
      valueClass: misfireCount > 0 ? "text-red-600" : "text-slate-900",
    },
    { label: "On-time rate", value: `${onTimePct}%` },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* 2×2 stat grid */}
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white rounded-md p-2.5 border border-slate-200">
            <p className="text-[10px] text-slate-400 mb-0.5">{t.label}</p>
            <p className={`text-base font-semibold tabular-nums ${t.valueClass ?? "text-slate-900"}`}>
              {t.value}
            </p>
          </div>
        ))}
      </div>

      {/* Sequence reminder card */}
      <div className="bg-slate-100 rounded-md p-3 text-xs text-slate-600">
        <div className="flex items-center gap-0.5 font-medium text-slate-700 mb-1">
          Sequence reminder
          <MetricTooltip content={SEQ_TOOLTIP} position="below" />
        </div>
        NCOERs must be submitted to HRC in the order they were rendered. Improperly sequenced evals
        are not eligible for appeal. Verify submission order before routing.
      </div>
    </div>
  );
}

"use client";

interface Bar {
  label: string;
  days: number;
  color: string;
}

interface VelocityChartProps {
  bars: Bar[];
  maxDays?: number;
}

/**
 * Horizontal bar chart for chain velocity — pure CSS/SVG.
 * Spec §4.Panel3 — colors encode meaning, not sequence.
 */
export function VelocityChart({ bars, maxDays = 40 }: VelocityChartProps) {
  return (
    <div className="flex flex-col gap-3">
      {bars.map((bar) => {
        const pct = Math.min((bar.days / maxDays) * 100, 100);
        return (
          <div key={bar.label} className="flex items-center gap-3">
            <span className="w-24 text-xs text-slate-500 text-right shrink-0 truncate">
              {bar.label}
            </span>
            <div className="flex-1 relative h-5 bg-slate-200 rounded-sm overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-sm transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: bar.color }}
              />
            </div>
            <span className="w-14 text-xs font-medium text-slate-700 tabular-nums shrink-0">
              {bar.days} days
            </span>
          </div>
        );
      })}

      {/* X axis labels */}
      <div className="flex ml-[calc(theme(spacing.24)+theme(spacing.3))] mr-[calc(theme(spacing.14)+theme(spacing.3))] justify-between text-[10px] text-slate-400">
        <span>0</span>
        <span>10</span>
        <span>20</span>
        <span>30</span>
        <span>40</span>
      </div>
    </div>
  );
}

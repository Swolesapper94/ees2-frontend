"use client";

interface DeltaProps {
  value: number | null;
  unit?: string;
  invertColor?: boolean; // true = positive delta is bad (e.g. more late = bad)
}

function Delta({ value, unit = "", invertColor = false }: DeltaProps) {
  if (value === null) return null;
  const positive = value > 0;
  // invertColor: positive is danger, negative is success
  const isGood = invertColor ? !positive : positive;
  const sign = positive ? "+" : "";
  const colorClass = value === 0
    ? "text-slate-500"
    : isGood
    ? "text-emerald-600"
    : "text-red-600";

  return (
    <span className={`text-xs font-medium ${colorClass}`}>
      {sign}{value}{unit}
    </span>
  );
}

interface KpiTileProps {
  label: string;
  value: string | number | null;
  unit?: string;
  subLabel?: string;
  delta?: number | null;
  deltaUnit?: string;
  deltaInvert?: boolean;
  deltaLabel?: string;
  valueColor?: string;
  loading?: boolean;
}

/**
 * Single tile in the KPI strip (Tier 1).
 * Spec §3 — no tooltips on tiles; minimal, fast-scan design.
 */
export function KpiTile({
  label,
  value,
  unit,
  subLabel,
  delta,
  deltaUnit,
  deltaInvert,
  deltaLabel,
  valueColor,
  loading,
}: KpiTileProps) {
  return (
    <div className="bg-slate-50 rounded-lg px-4 py-3 flex flex-col gap-0.5 min-w-0">
      <span className="text-xs text-slate-500 font-medium truncate">{label}</span>

      {loading ? (
        <div className="h-7 w-16 animate-pulse rounded bg-slate-200 mt-1" />
      ) : (
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className={`text-2xl font-semibold tabular-nums ${valueColor ?? "text-slate-900"}`}>
            {value ?? "—"}
          </span>
          {unit && (
            <span className="text-sm text-slate-500">{unit}</span>
          )}
        </div>
      )}

      {subLabel && (
        <span className="text-xs text-slate-400">{subLabel}</span>
      )}

      {(delta !== undefined && delta !== null) && (
        <div className="flex items-center gap-1 mt-0.5">
          <Delta value={delta} unit={deltaUnit} invertColor={deltaInvert} />
          {deltaLabel && (
            <span className="text-xs text-slate-400">{deltaLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

interface DataPoint {
  month: string;
  ncoeravg: number | null;
  oeravg: number | null;
}

interface HrcTrendChartProps {
  data: DataPoint[];
}

/**
 * SVG line chart — 8-month rolling HRC processing time.
 * Spec §4.Panel1 — NCOER solid blue, OER dashed amber.
 * Pure SVG, no Chart.js dependency.
 */
export function HrcTrendChart({ data }: HrcTrendChartProps) {
  const W = 480;
  const H = 160;
  const padL = 32;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Y axis: 10–35 days, clamp data
  const yMin = 10;
  const yMax = 35;
  const yTicks = [10, 15, 20, 25, 30, 35];

  const xOf = (i: number) => padL + (i / Math.max(data.length - 1, 1)) * chartW;
  const yOf = (v: number) => padT + ((yMax - Math.min(Math.max(v, yMin), yMax)) / (yMax - yMin)) * chartH;

  function toPolyline(key: "ncoeravg" | "oeravg"): string {
    return data
      .map((d, i) => (d[key] !== null ? `${xOf(i)},${yOf(d[key]!)}` : null))
      .filter(Boolean)
      .join(" ");
  }

  // Build path with gaps for null values
  function toPathD(key: "ncoeravg" | "oeravg"): string {
    let d = "";
    let started = false;
    for (let i = 0; i < data.length; i++) {
      const v = data[i][key];
      if (v === null) { started = false; continue; }
      const x = xOf(i);
      const y = yOf(v);
      d += started ? ` L${x},${y}` : ` M${x},${y}`;
      started = true;
    }
    return d.trim();
  }

  const ncoerPath = toPathD("ncoeravg");
  const oerPath   = toPathD("oeravg");

  return (
    <div>
      {/* Custom legend */}
      <div className="flex gap-4 mb-2 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-[#2a78d6]" />
          NCOERs
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-4 h-0.5"
            style={{ background: "repeating-linear-gradient(to right, #eda100 0px, #eda100 4px, transparent 4px, transparent 7px)" }}
          />
          OERs
        </span>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {/* Y-axis grid lines */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={padL}
              y1={yOf(tick)}
              x2={W - padR}
              y2={yOf(tick)}
              stroke="#e1e0d9"
              strokeWidth="1"
            />
            <text
              x={padL - 4}
              y={yOf(tick) + 4}
              textAnchor="end"
              className="fill-slate-400"
              fontSize="9"
            >
              {tick}d
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={xOf(i)}
            y={H - 4}
            textAnchor="middle"
            className="fill-slate-400"
            fontSize="9"
          >
            {d.month}
          </text>
        ))}

        {/* NCOER line — solid blue */}
        {ncoerPath && (
          <path
            d={ncoerPath}
            fill="none"
            stroke="#2a78d6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* OER line — dashed amber */}
        {oerPath && (
          <path
            d={oerPath}
            fill="none"
            stroke="#eda100"
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data point dots */}
        {data.map((d, i) => (
          <g key={i}>
            {d.ncoeravg !== null && (
              <circle cx={xOf(i)} cy={yOf(d.ncoeravg)} r="3" fill="#2a78d6" />
            )}
            {d.oeravg !== null && (
              <circle cx={xOf(i)} cy={yOf(d.oeravg)} r="3" fill="#eda100" />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

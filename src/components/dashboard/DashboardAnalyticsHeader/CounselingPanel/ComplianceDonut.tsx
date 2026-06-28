"use client";

interface ComplianceDonutProps {
  pct: number; // 0–100
  size?: number;
}

/**
 * Inline SVG donut — spec §4.Panel4.
 * Filled arc = compliance %; background ring in #e1e0d9.
 * No Chart.js dependency.
 */
export function ComplianceDonut({ pct, size = 72 }: ComplianceDonutProps) {
  const r = 28;
  const stroke = 8;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (pct / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {/* Background ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#e1e0d9"
        strokeWidth={stroke}
      />
      {/* Filled arc — starts at top (−90°) */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#2a78d6"
        strokeWidth={stroke}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeDashoffset={circumference / 4}
        strokeLinecap="round"
      />
      {/* Center label */}
      <text
        x={cx}
        y={cy + 5}
        textAnchor="middle"
        fontSize="14"
        fontWeight="500"
        className="fill-slate-800"
      >
        {pct}%
      </text>
    </svg>
  );
}

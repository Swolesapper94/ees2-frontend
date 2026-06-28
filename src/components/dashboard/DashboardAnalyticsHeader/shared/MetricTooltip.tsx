"use client";

import { useState, useId, useRef, useEffect } from "react";

interface MetricTooltipProps {
  content: string | React.ReactNode;
  position?: "above" | "below";
  width?: number;
}

/**
 * Reusable ⓘ tooltip used on panel headers and SR profile row labels.
 * Spec §2 — triggered by hover/focus on ⓘ icon, max-width 320px,
 * dark background regardless of app theme.
 */
export function MetricTooltip({ content, position = "above", width = 300 }: MetricTooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [visible]);

  const clampedWidth = Math.min(width, 320);
  const isAbove = position === "above";

  return (
    <span className="relative inline-flex items-center ml-1.5">
      <button
        ref={triggerRef}
        type="button"
        aria-label="More information"
        aria-describedby={visible ? id : undefined}
        className="text-slate-400 hover:text-slate-600 focus:text-slate-600 focus:outline-none"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>

      {visible && (
        <span
          id={id}
          role="tooltip"
          style={{ width: `${clampedWidth}px`, maxWidth: "320px" }}
          className={[
            "absolute z-50 px-3 py-2 rounded-md shadow-lg",
            "bg-slate-900 text-slate-100 text-sm leading-relaxed",
            "pointer-events-none",
            // Position: above or below, centered horizontally
            isAbove
              ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
              : "top-full left-1/2 -translate-x-1/2 mt-2",
          ].join(" ")}
        >
          {content}
          {/* CSS triangle arrow */}
          <span
            className={[
              "absolute left-1/2 -translate-x-1/2 w-0 h-0",
              "border-x-[6px] border-x-transparent",
              isAbove
                ? "top-full border-t-[6px] border-t-slate-900"
                : "bottom-full border-b-[6px] border-b-slate-900",
            ].join(" ")}
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}

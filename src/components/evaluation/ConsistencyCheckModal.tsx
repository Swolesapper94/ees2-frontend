"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import type { ConsistencyFlag } from "@/types/evaluation";

export interface ConsistencyCheckModalProps {
  evalId: string;
  open: boolean;
  /** Pre-loaded flags (optional — modal will fetch if not provided) */
  flags?: ConsistencyFlag[];
  onClose?: () => void;
  onProceed?: () => void;
}

const SEVERITY_STYLES: Record<string, string> = {
  ERROR: "border-red-200 bg-red-50 text-red-900",
  WARNING: "border-amber-200 bg-amber-50 text-amber-900",
  INFO: "border-blue-200 bg-blue-50 text-blue-900",
};

const SEVERITY_ICON: Record<string, string> = {
  ERROR: "✗",
  WARNING: "⚠",
  INFO: "ℹ",
};

const FLAG_LABELS: Record<string, string> = {
  BOX_NARRATIVE_MISMATCH: "Rating-Narrative Mismatch",
  DUPLICATE_BULLET: "Duplicate Bullet",
  RATING_NARRATIVE_STRENGTH: "Narrative Strength",
  EMPTY_SECTION: "Empty Section",
  COUNSELING_GAP: "Counseling Gap",
  SR_PROFILE_MQ_WARNING: "SR Profile — Grade Inflation Warning",
  PROHIBITED_LANGUAGE: "Prohibited Language",
  BULLET_FORMAT: "Bullet Format Issue",
};

/**
 * Surfaces the 6-type consistency check before routing to SR.
 * Errors block proceeding. Warnings must be explicitly acknowledged.
 * See EES2-AGENT-INSTRUCTIONS §10.
 */
export function ConsistencyCheckModal({
  evalId,
  open,
  flags: initialFlags,
  onClose,
  onProceed,
}: ConsistencyCheckModalProps) {
  const [flags, setFlags] = useState<ConsistencyFlag[] | null>(initialFlags ?? null);
  const [loading, setLoading] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function runCheck() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<{ flags: ConsistencyFlag[] }>(
        `/evaluations/${evalId}/consistency-check`,
      );
      setFlags(result.flags);
      setAcknowledged(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check failed.");
    } finally {
      setLoading(false);
    }
  }

  const errors = flags?.filter((f) => f.severity === "ERROR") ?? [];
  const warnings = flags?.filter((f) => f.severity === "WARNING") ?? [];
  const infos = flags?.filter((f) => f.severity === "INFO") ?? [];
  const hasErrors = errors.length > 0;
  const unacknowledgedWarnings = warnings.filter((_, i) => !acknowledged.has(errors.length + i));
  const canProceed = flags !== null && !hasErrors && unacknowledgedWarnings.length === 0;

  function toggleAcknowledge(globalIndex: number) {
    setAcknowledged((prev) => {
      const next = new Set(prev);
      if (next.has(globalIndex)) next.delete(globalIndex);
      else next.add(globalIndex);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background shadow-xl">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-bold tracking-tight">Pre-Submission Check</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            6-point consistency check before routing to Senior Rater
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-3">
          {flags === null && !loading && (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Checks prohibited language, bullet format, rating-narrative alignment,
                duplicate detection, completeness, and SR profile distribution.
              </p>
              <button
                type="button"
                onClick={runCheck}
                className="rounded bg-[#1A3010] px-4 py-2 text-sm font-medium text-white hover:bg-[#243e17]"
              >
                Run Check
              </button>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Running checks…
            </div>
          )}

          {error && (
            <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
          )}

          {flags !== null && flags.length === 0 && (
            <div className="rounded border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-2xl mb-1">✓</p>
              <p className="font-semibold text-green-800 text-sm">All checks passed</p>
              <p className="text-xs text-green-700 mt-0.5">No issues found. Ready to route.</p>
            </div>
          )}

          {errors.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-destructive">
                Must Fix ({errors.length})
              </p>
              <div className="space-y-2">
                {errors.map((f, i) => (
                  <div key={i} className={cn("rounded border p-3 text-sm", SEVERITY_STYLES.ERROR)}>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">{SEVERITY_ICON.ERROR}</span>
                      <div>
                        <p className="font-semibold">{FLAG_LABELS[f.code] ?? f.code}</p>
                        {f.section && <p className="text-xs opacity-75">Section: {f.section}</p>}
                        <p className="mt-0.5 text-xs">{f.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
                Warnings — Acknowledge to Proceed ({warnings.length})
              </p>
              <div className="space-y-2">
                {warnings.map((f, i) => {
                  const globalIndex = errors.length + i;
                  const isAcknowledged = acknowledged.has(globalIndex);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded border p-3 text-sm",
                        isAcknowledged ? "opacity-60 bg-muted border-border" : SEVERITY_STYLES.WARNING,
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-amber-700">{SEVERITY_ICON.WARNING}</span>
                        <div className="flex-1">
                          <p className="font-semibold">{FLAG_LABELS[f.code] ?? f.code}</p>
                          {f.section && <p className="text-xs opacity-75">Section: {f.section}</p>}
                          <p className="mt-0.5 text-xs">{f.message}</p>
                          <label className="mt-2 flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isAcknowledged}
                              onChange={() => toggleAcknowledge(globalIndex)}
                            />
                            <span className="text-xs">
                              I acknowledge this warning and am proceeding intentionally
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {infos.map((f, i) => (
            <div key={i} className={cn("rounded border p-3 text-sm", SEVERITY_STYLES.INFO)}>
              <div className="flex items-start gap-2">
                <span>{SEVERITY_ICON.INFO}</span>
                <div>
                  <p className="font-semibold">{FLAG_LABELS[f.code] ?? f.code}</p>
                  <p className="mt-0.5 text-xs">{f.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {flags !== null && hasErrors && (
              <p className="text-xs text-destructive">Fix {errors.length} error{errors.length !== 1 ? "s" : ""} first</p>
            )}
            {flags !== null && !hasErrors && unacknowledgedWarnings.length > 0 && (
              <p className="text-xs text-amber-700">
                Acknowledge {unacknowledgedWarnings.length} warning{unacknowledgedWarnings.length !== 1 ? "s" : ""} to continue
              </p>
            )}
            <button
              type="button"
              disabled={flags === null || !canProceed}
              onClick={onProceed}
              className="rounded bg-[#1A3010] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {flags === null ? "Run Check First" : canProceed ? "Route to SR →" : "Cannot Proceed"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

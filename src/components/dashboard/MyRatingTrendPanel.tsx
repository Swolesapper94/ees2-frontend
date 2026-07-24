"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { format } from "date-fns";

interface HistoryEntry {
  evaluationId: string;
  periodStart: string;
  periodEnd: string;
  formType: string;
  status: string;
  seniorRaterRating: string | null;
  avgSectionScore: number | null;
  sectionCount: number;
  rater: { firstName: string; lastName: string; rank: string } | null;
}

const SR_RATING_LABELS: Record<string, string> = {
  MOST_QUALIFIED: "Most Qualified",
  HIGHLY_QUALIFIED: "Highly Qualified",
  QUALIFIED: "Qualified",
  NOT_QUALIFIED: "Not Qualified",
};

/**
 * "My Rating History" — a Soldier-facing, self-referential trend of their
 * OWN evaluations over time. Deliberately never compares to peers: research
 * cited in product planning (HBR/Cornell) found self-referential framing
 * ("you vs. your own past") is perceived as fairer than peer comparison,
 * which is what the existing rater-facing SrProfilePanel shows instead.
 * Only renders once ≥2 finalized evaluations exist — a single data point
 * isn't a trend.
 */
export function MyRatingTrendPanel() {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    api
      .get<{ history: HistoryEntry[] }>("/dashboard/my-history")
      .then((d) => setHistory(d.history))
      .catch(() => setHistory([]));
  }, []);

  if (!history || history.length < 2) return null;

  const maxScore = 3;

  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        My Rating History
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Your own performance over time: compared only to your own past periods.
      </p>
      <div className="space-y-2">
        {history.map((h) => {
          const pct = h.avgSectionScore !== null ? (h.avgSectionScore / maxScore) * 100 : 0;
          return (
            <div key={h.evaluationId} className="flex items-center gap-3">
              <div className="w-28 flex-shrink-0 text-xs text-muted-foreground">
                {format(new Date(h.periodStart), "MMM yyyy")}
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[var(--color-od-green)] transition-all"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="w-32 flex-shrink-0 text-right text-xs text-muted-foreground">
                {h.seniorRaterRating ? SR_RATING_LABELS[h.seniorRaterRating] ?? h.seniorRaterRating : "—"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

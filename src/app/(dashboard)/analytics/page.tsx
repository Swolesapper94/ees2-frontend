"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { format } from "date-fns";

interface StageMetric {
  stage: string;
  avgDaysToComplete: number;
}

interface EvalsAtRiskItem {
  id: string;
  type: string;
  dueDate: string;
  evaluation: {
    id: string;
    status: string;
    ratingChain: { ratedSoldier: { firstName: string; lastName: string; rank: string } };
  };
}

interface StatusCount {
  status: string;
  count: number;
}

interface AnalyticsData {
  stageMetrics: StageMetric[];
  overdueMilestones: number;
  evalsAtRisk: EvalsAtRiskItem[];
  counselingCompliancePercent: number;
  statusCounts: StatusCount[];
  totalEvals: number;
}

const MILESTONE_LABELS: Record<string, string> = {
  INITIAL_COUNSELING_DUE: "Initial Counsel",
  QUARTERLY_COUNSELING_1: "Q1 Counsel",
  QUARTERLY_COUNSELING_2: "Q2 Counsel",
  QUARTERLY_COUNSELING_3: "Q3 Counsel",
  RATER_SECTION_DUE: "Rater Section",
  SENIOR_RATER_DUE: "SR Section",
  SOLDIER_ACK_DUE: "Soldier Ack",
  EVAL_SUBMISSION_DUE: "Submission",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  RATER_IN_PROGRESS: "Rater In Progress",
  PENDING_SENIOR_RATER: "Pending SR",
  PENDING_SOLDIER_ACK: "Pending Soldier Ack",
  PENDING_SUPPLEMENTARY_REVIEW: "Pending Review",
  COMPLETE: "Complete",
  SUBMITTED: "Submitted",
  ACCEPTED: "Accepted",
  RETURNED: "Returned",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AnalyticsData>("/analytics")
      .then(setData)
      .catch(() => setError("Could not load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading analytics…</div>;
  if (error || !data) return <div className="p-6 text-sm text-red-600">{error}</div>;

  const maxAvg = Math.max(...data.stageMetrics.map((s) => s.avgDaysToComplete), 1);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Processing delays and compliance visibility — unit level only.</p>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Evals" value={String(data.totalEvals)} />
        <StatCard label="Overdue Milestones" value={String(data.overdueMilestones)} alert={data.overdueMilestones > 0} />
        <StatCard label="Evals At Risk (7d)" value={String(data.evalsAtRisk.length)} alert={data.evalsAtRisk.length > 0} />
        <StatCard label="Initial Counsel Rate" value={`${data.counselingCompliancePercent}%`} />
      </div>

      {/* Stage metrics bar chart */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Average Days per Stage
        </h2>
        <div className="space-y-2">
          {data.stageMetrics.map((s) => (
            <div key={s.stage} className="flex items-center gap-3">
              <span className="text-sm w-40 shrink-0">{s.stage}</span>
              <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                <div
                  className="h-full bg-[#1E3A5F] rounded-sm transition-all"
                  style={{ width: `${(s.avgDaysToComplete / maxAvg) * 100}%` } as React.CSSProperties}
                />
              </div>
              <span className="text-sm font-mono w-12 text-right text-muted-foreground">
                {s.avgDaysToComplete}d
              </span>
            </div>
          ))}
          {data.stageMetrics.every((s) => s.avgDaysToComplete === 0) && (
            <p className="text-sm text-muted-foreground">No completed evaluations yet — stage metrics will appear once evals are signed.</p>
          )}
        </div>
      </div>

      {/* Eval status distribution */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Evaluation Status Distribution
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {data.statusCounts.map((s) => (
            <div key={s.status} className="rounded-sm border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{STATUS_LABELS[s.status] ?? s.status}</p>
              <p className="text-2xl font-bold mt-0.5">{s.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Evals at risk */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Milestones Due in Next 7 Days
        </h2>
        {data.evalsAtRisk.length === 0 ? (
          <p className="text-sm text-muted-foreground">No milestones at risk — you&apos;re ahead of schedule.</p>
        ) : (
          <div className="rounded-sm border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">Soldier</th>
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">Milestone</th>
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">Due</th>
                </tr>
              </thead>
              <tbody>
                {data.evalsAtRisk.map((item) => {
                  const s = item.evaluation.ratingChain.ratedSoldier;
                  return (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-2 px-3">
                        {s.rank} {s.lastName}, {s.firstName}
                      </td>
                      <td className="py-2 px-3 text-amber-700">
                        {MILESTONE_LABELS[item.type] ?? item.type}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs">
                        {format(new Date(item.dueDate), "d MMM yyyy")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`rounded-sm border p-4 ${alert ? "border-amber-200 bg-amber-50" : "border-border bg-card"}`}>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-0.5 ${alert ? "text-amber-700" : ""}`}>{value}</p>
    </div>
  );
}

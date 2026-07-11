"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { SuspenseTimeline } from "@/components/milestones/SuspenseTimeline";
import { SECTION_LABELS } from "@/lib/utils/form-constants";
import type {
  SupportFormEntry,
  SectionKey,
  EntryType,
  EntryConfirmationStatus,
} from "@/types/evaluation";

interface MilestoneItem {
  id: string;
  type: string;
  status: string;
  dueDate: string;
  completedAt: string | null;
}

interface CounselingSession {
  id: string;
  type: string;
  sessionDate: string;
  notes: string | null;
}

interface TimelineItem {
  id: string;
  kind: "ENTRY" | "COUNSELING";
  date: string;
  title: string;
  detail?: string;
  section?: SectionKey;
  entryType?: EntryType;
  hasArtifacts?: boolean;
  confirmationStatus?: EntryConfirmationStatus;
}

export interface PerformanceTimelineProps {
  evalId: string;
}

const CONFIRMATION_DOT: Record<EntryConfirmationStatus, string> = {
  UNREVIEWED: "bg-zinc-300",
  CONFIRMED: "bg-emerald-500",
  NEEDS_CLARIFICATION: "bg-amber-500",
  NOT_USED: "bg-zinc-400",
};

const DIMENSIONS: SectionKey[] = [
  "CHARACTER",
  "PRESENCE",
  "INTELLECT",
  "LEADS",
  "DEVELOPS",
  "ACHIEVES",
];

/**
 * Read-only chronological composition of a rating period: support-form
 * entries (objectives/accomplishments), counseling sessions, and milestones
 * — all sourced from canonical records, not a separate timeline-event table
 * (MVP audit 5.5). Role-aware: this component doesn't restrict visibility
 * itself — the page embedding it should only render it for rater/SR/soldier
 * as appropriate for the surrounding view.
 */
export function PerformanceTimeline({ evalId }: PerformanceTimelineProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<SupportFormEntry[]>([]);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [sessions, setSessions] = useState<CounselingSession[]>([]);

  const [dimensionFilter, setDimensionFilter] = useState<SectionKey | "ALL">("ALL");
  const [entryTypeFilter, setEntryTypeFilter] = useState<EntryType | "ALL">("ALL");
  const [showCounseling, setShowCounseling] = useState(true);
  const [artifactsOnly, setArtifactsOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const evaluation = await api.get<{
          supportForm?: { id: string; entries: SupportFormEntry[] } | null;
        }>(`/evaluations/${evalId}`);
        const supportFormId = evaluation.supportForm?.id;
        const [milestoneList, counselingRes] = await Promise.all([
          api.get<MilestoneItem[]>(`/milestones?evaluationId=${evalId}`),
          supportFormId
            ? api.get<{ sessions: CounselingSession[] }>(
                `/support-forms/${supportFormId}/counseling-dates`,
              )
            : Promise.resolve({ sessions: [] }),
        ]);
        if (cancelled) return;
        setEntries(evaluation.supportForm?.entries ?? []);
        setMilestones(milestoneList);
        setSessions(counselingRes.sessions);
      } catch {
        if (!cancelled) setError("Could not load timeline.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [evalId]);

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-live="polite">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-16 w-full animate-pulse rounded bg-muted" />
        <div className="h-16 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  const items: TimelineItem[] = [
    ...entries.map((e) => ({
      id: e.id,
      kind: "ENTRY" as const,
      date: e.entryDate,
      title: e.rawText,
      section: e.section,
      entryType: e.entryType,
      hasArtifacts: e.artifacts.length > 0,
      confirmationStatus: e.confirmationStatus,
    })),
    ...(showCounseling
      ? sessions.map((s) => ({
          id: s.id,
          kind: "COUNSELING" as const,
          date: s.sessionDate,
          title: `${s.type === "INITIAL" ? "Initial" : "Quarterly"} counseling`,
          detail: s.notes ?? undefined,
        }))
      : []),
  ]
    .filter(
      (item) =>
        dimensionFilter === "ALL" || item.kind !== "ENTRY" || item.section === dimensionFilter,
    )
    .filter(
      (item) =>
        entryTypeFilter === "ALL" || item.kind !== "ENTRY" || item.entryType === entryTypeFilter,
    )
    .filter((item) => !artifactsOnly || item.kind !== "ENTRY" || item.hasArtifacts)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      {milestones.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Milestones
          </h3>
          <SuspenseTimeline milestones={milestones} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <select
          value={dimensionFilter}
          onChange={(e) => setDimensionFilter(e.target.value as SectionKey | "ALL")}
          className="h-7 rounded border border-input bg-background px-1.5"
          aria-label="Filter by leadership dimension"
        >
          <option value="ALL">All dimensions</option>
          {DIMENSIONS.map((s) => (
            <option key={s} value={s}>
              {SECTION_LABELS[s] ?? s}
            </option>
          ))}
        </select>
        <select
          value={entryTypeFilter}
          onChange={(e) => setEntryTypeFilter(e.target.value as EntryType | "ALL")}
          className="h-7 rounded border border-input bg-background px-1.5"
          aria-label="Filter by entry type"
        >
          <option value="ALL">Objectives + Accomplishments</option>
          <option value="OBJECTIVE">Objectives only</option>
          <option value="ACCOMPLISHMENT">Accomplishments only</option>
        </select>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showCounseling}
            onChange={(e) => setShowCounseling(e.target.checked)}
          />
          Counseling
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={artifactsOnly}
            onChange={(e) => setArtifactsOnly(e.target.checked)}
          />
          Has evidence only
        </label>
      </div>

      {items.length === 0 && (
        <p className="rounded border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Nothing to show for this filter yet.
        </p>
      )}

      <ol className="space-y-2 border-l border-border pl-4">
        {items.map((item) => (
          <li key={`${item.kind}-${item.id}`} className="relative">
            <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-border" />
            <div className="flex items-start justify-between gap-2 rounded border border-border bg-card p-2.5 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  {item.kind === "ENTRY" && item.confirmationStatus && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        CONFIRMATION_DOT[item.confirmationStatus],
                      )}
                      title={item.confirmationStatus}
                    />
                  )}
                  <span className="font-medium text-foreground">{item.title}</span>
                </div>
                <p className="text-muted-foreground">
                  {new Date(item.date).toLocaleDateString()}
                  {item.section && ` · ${SECTION_LABELS[item.section] ?? item.section}`}
                  {item.kind === "ENTRY" &&
                    item.entryType &&
                    ` · ${item.entryType === "OBJECTIVE" ? "Objective" : "Accomplishment"}`}
                  {item.hasArtifacts && " · has evidence"}
                </p>
                {item.detail && <p className="text-muted-foreground">{item.detail}</p>}
              </div>
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                  item.kind === "ENTRY" ? "bg-primary/10 text-primary" : "bg-blue-100 text-blue-800",
                )}
              >
                {item.kind === "ENTRY" ? "Entry" : "Counseling"}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

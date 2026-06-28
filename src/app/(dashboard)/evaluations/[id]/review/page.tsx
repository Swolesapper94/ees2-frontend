"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { ConsistencyCheckModal } from "@/components/evaluation/ConsistencyCheckModal";
import type { ConsistencyFlag, EvalSection, EvalStatus } from "@/types/evaluation";
import { SECTION_LABELS, RATING_BINARY_LABELS, RATING_FOUR_LEVEL_LABELS } from "@/lib/utils/form-constants";
import Link from "next/link";

const STATUS_LABELS: Record<EvalStatus, string> = {
  DRAFT: "Draft",
  RATER_IN_PROGRESS: "Rater In Progress",
  PENDING_SENIOR_RATER: "Pending Senior Rater",
  PENDING_SOLDIER_ACK: "Pending Soldier Ack",
  PENDING_SUPPLEMENTARY_REVIEW: "Pending Review",
  COMPLETE: "Complete",
  SUBMITTED: "Submitted",
  ACCEPTED: "Accepted",
  RETURNED: "Returned",
};

interface EvalDetail {
  id: string;
  status: EvalStatus;
  formType: string;
  principalDutyTitle: string | null;
  sections: EvalSection[];
  ratingChain: {
    ratedSoldier: { firstName: string; lastName: string; rank: string; mos: string };
    rater: { firstName: string; lastName: string; rank: string };
    seniorRater: { firstName: string; lastName: string; rank: string };
  };
}

export default function ReviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [evalData, setEvalData] = useState<EvalDetail | null>(null);
  const [flags, setFlags] = useState<ConsistencyFlag[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<EvalDetail>(`/evaluations/${id}`)
      .then(setEvalData)
      .finally(() => setLoading(false));
  }, [id]);

  async function runConsistencyCheck() {
    setChecking(true);
    try {
      const result = await api.post<{ flags: ConsistencyFlag[] }>(
        `/evaluations/${id}/consistency-check`,
      );
      setFlags(result.flags);
      setShowModal(true);
    } finally {
      setChecking(false);
    }
  }

  function handleProceedToPDF() {
    setShowModal(false);
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/pdf/evaluations/${id}`;
    const devAuth = typeof window !== "undefined" ? localStorage.getItem("devAuth") : null;
    // Can't inject auth header into <a href>, so open via fetch + blob
    fetch(url, { headers: devAuth ? { Authorization: devAuth } : {} })
      .then((r) => r.blob())
      .then((blob) => {
        const objUrl = URL.createObjectURL(blob);
        setPdfUrl(objUrl);
        window.open(objUrl, "_blank");
      });
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!evalData) return <p className="text-sm text-red-600">Evaluation not found.</p>;

  const s = evalData.ratingChain.ratedSoldier;
  const sections = evalData.sections ?? [];
  const completedSections = sections.filter((sec) => sec.isComplete).length;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold tracking-tight">Review</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Full evaluation review before signature and PDF generation.
      </p>

      {/* Summary card */}
      <div className="mb-6 rounded-sm border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="font-medium">Soldier:</span> {s.rank} {s.lastName}, {s.firstName}</div>
          <div><span className="font-medium">MOS:</span> {s.mos}</div>
          <div><span className="font-medium">Form:</span> {evalData.formType.replace(/_/g, "-")}</div>
          <div><span className="font-medium">Status:</span> {STATUS_LABELS[evalData.status]}</div>
          <div><span className="font-medium">Duty Title:</span> {evalData.principalDutyTitle ?? "—"}</div>
          <div><span className="font-medium">Sections:</span> {completedSections}/{sections.length} complete</div>
        </div>
      </div>

      {/* Sections preview */}
      <div className="space-y-3 mb-6">
        {sections.map((sec) => {
          const rating = sec.ratingBinary
            ? RATING_BINARY_LABELS[sec.ratingBinary]
            : sec.ratingFourLevel
              ? RATING_FOUR_LEVEL_LABELS[sec.ratingFourLevel]
              : null;
          return (
            <div key={sec.id} className="rounded-sm border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{SECTION_LABELS[sec.section] ?? sec.section}</span>
                <div className="flex items-center gap-2">
                  {rating && (
                    <span className="text-xs font-medium text-primary">{rating}</span>
                  )}
                  {sec.isComplete ? (
                    <span className="text-xs text-green-600">✓ Complete</span>
                  ) : (
                    <Link
                      href={`/evaluations/${id}/${sec.section.toLowerCase()}`}
                      className="text-xs text-amber-600 underline"
                    >
                      Incomplete
                    </Link>
                  )}
                </div>
              </div>
              {sec.finalBullets.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {sec.finalBullets.map((b, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {b}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runConsistencyCheck}
          disabled={checking}
          className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {checking ? "Checking…" : "Run Consistency Check"}
        </button>

        <button
          type="button"
          onClick={handleProceedToPDF}
          className="rounded-sm border border-input bg-background px-4 py-2 text-sm font-medium"
        >
          ↓ Download NCOER PDF
        </button>

        <Link
          href={`/evaluations/${id}/sign`}
          className="rounded-sm border border-input bg-background px-4 py-2 text-sm font-medium"
        >
          Proceed to Sign →
        </Link>
      </div>

      {pdfUrl && (
        <p className="mt-3 text-sm text-green-600">
          PDF opened in new tab.{" "}
          <a href={pdfUrl} download={`NCOER_${s.lastName}.pdf`} className="underline">
            Download again
          </a>
        </p>
      )}

      <ConsistencyCheckModal
        evalId={id}
        open={showModal}
        flags={flags}
        onClose={() => setShowModal(false)}
        onProceed={handleProceedToPDF}
      />
    </div>
  );
}

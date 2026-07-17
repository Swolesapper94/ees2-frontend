"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError, api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

type FinalReview = { pdfPath: string; contentHash: string; evalCategory: "NCOER" | "OER" };

export default function FinalReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<FinalReview | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [category, setCategory] = useState<"RATER_CONTENT" | "SENIOR_RATER_CONTENT">("RATER_CONTENT");
  const [reason, setReason] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const next = await api.get<FinalReview>(`/evaluations/${id}/final-form-review`);
      const pdf = await api.blob(next.pdfPath);
      setReview(next);
      setPdfUrl(URL.createObjectURL(pdf));
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [id]);

  async function confirm() {
    if (!review) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/evaluations/${id}/final-form-review/confirm`, { contentHash: review.contentHash });
      setError("Final form confirmed. The evaluation is ready for HQDA submission.");
    } catch (requestError) {
      setError(messageFor(requestError));
      if (requestError instanceof ApiError && requestError.status === 409) await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function dispute() {
    if (!reason.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/evaluations/${id}/final-form-review/dispute`, { disputeCategory: category, disputeReason: reason.trim() });
      setError("Issue recorded. The evaluation has been returned to the responsible official for correction.");
      setShowDispute(false);
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading populated form...</p>;
  if (!review) return <div><h1 className="text-xl font-bold">Final Form Review</h1><p className="mt-2 text-sm text-destructive">{error ?? "Final form review is not available."}</p></div>;

  return <div className="space-y-4">
    <div>
      <h1 className="text-xl font-bold tracking-tight">Final Form Review</h1>
      <p className="mt-1 text-sm text-muted-foreground">Review the populated {review.evalCategory} PDF exactly as it will be submitted. This is a workflow confirmation, not an additional DA-form signature.</p>
    </div>
    {error && <p className={`rounded-sm border p-3 text-sm ${error.startsWith("Final form confirmed") || error.startsWith("Issue recorded") ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>{error}</p>}
    {pdfUrl && <iframe title="Populated evaluation form" src={pdfUrl} className="h-[680px] w-full rounded-sm border border-border bg-white" />}
    <div className="flex flex-wrap gap-2 border-t border-border pt-4">
      <Button disabled={submitting} onClick={() => void confirm()}>Confirm - matches, ready to submit</Button>
      <Button variant="outline" disabled={submitting} onClick={() => setShowDispute((value) => !value)}>Flag a problem</Button>
    </div>
    {showDispute && <div className="max-w-xl space-y-3 rounded-sm border border-amber-200 bg-amber-50 p-4">
      <h2 className="font-semibold">Flag content for correction</h2>
      <label className="block text-sm font-medium">Correction owner<select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="mt-1 block w-full rounded-sm border border-input bg-background p-2"><option value="RATER_CONTENT">Rater content (Part IV)</option><option value="SENIOR_RATER_CONTENT">Senior Rater content</option></select></label>
      <label className="block text-sm font-medium">What is incorrect?<textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 min-h-28 w-full rounded-sm border border-input bg-background p-2" /></label>
      <Button variant="destructive" disabled={submitting || !reason.trim()} onClick={() => void dispute()}>Send back for correction</Button>
    </div>}
  </div>;
}

function messageFor(error: unknown) {
  if (error instanceof ApiError && typeof error.details === "object" && error.details && "error" in error.details) return String(error.details.error);
  return "Unable to complete final form review.";
}

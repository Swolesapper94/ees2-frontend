"use client";

import { useRef, useState } from "react";
import { ApiError, api } from "@/lib/api/client";
import type { AIExtractedEntry, SupportFormUploadState } from "@/types/evaluation";
import { cn } from "@/lib/utils/cn";
import { UploadedSupportFormViewer } from "./UploadedSupportFormViewer";

interface SupportFormUploadPanelProps {
  evalId: string;
  sectionKey?: string;
  sectionLabel?: string;
  allowDraftFromReviewedFacts?: boolean;
  uploadState: SupportFormUploadState;
  onUploadComplete: (state: SupportFormUploadState) => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_EXTRACT: "Parsing: queued for text extraction",
  EXTRACTING: "Parsing: reading form text",
  PENDING_PARSE: "Parsing: ready to classify entries",
  PARSING: "Parsing: classifying source facts",
  REVIEW_REQUIRED: "Review required: extracted facts need human confirmation",
  PENDING_BULLETS: "Ready: accepted facts queued for suggestions",
  GENERATING: "Parsing: writing bullet candidates from reviewed facts",
  COMPLETE: "Ready: reviewed evidence-grounded suggestions are available",
  FAILED: "Failed: document could not be parsed",
};

const IN_PROGRESS_STATUSES = new Set([
  "PENDING_EXTRACT",
  "EXTRACTING",
  "PENDING_PARSE",
  "PARSING",
  "PENDING_BULLETS",
  "GENERATING",
]);

const REVIEW_LABELS: Record<AIExtractedEntry["reviewStatus"], string> = {
  PENDING_REVIEW: "Review required",
  ACCEPTED: "Accepted",
  EDITED: "Edited",
  REJECTED: "Rejected",
};

export function SupportFormUploadPanel({
  evalId,
  sectionKey,
  sectionLabel,
  allowDraftFromReviewedFacts = true,
  uploadState,
  onUploadComplete,
}: SupportFormUploadPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [reviewingFactId, setReviewingFactId] = useState<string | null>(null);
  const [generatingReviewedFacts, setGeneratingReviewedFacts] = useState(false);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.upload(`/support-form-uploads/${evalId}`, formData);
      // Start polling for status
      startPolling();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function reprocess() {
    setError(null);
    setUploading(true);
    try {
      await api.post(`/support-form-uploads/${evalId}/reprocess`, {});
      startPolling();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to reprocess the support form.");
    } finally {
      setUploading(false);
    }
  }

  function mergeExtractedEntry(updated: AIExtractedEntry) {
    onUploadComplete({
      ...uploadState,
      hasUpload: true,
      extractedEntries: (uploadState.extractedEntries ?? []).map((entry) => entry.id === updated.id ? updated : entry),
    });
  }

  async function reviewFact(entry: AIExtractedEntry, action: "ACCEPTED" | "EDITED" | "REJECTED", reviewedText?: string) {
    setReviewingFactId(entry.id);
    setError(null);
    try {
      const updated = await api.patch<AIExtractedEntry>(`/support-form-uploads/extracted-entries/${entry.id}`, {
        action,
        ...(reviewedText ? { reviewedText } : {}),
      });
      mergeExtractedEntry(updated);
      setEditingFactId(null);
      setEditText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to review extracted fact.");
    } finally {
      setReviewingFactId(null);
    }
  }

  async function generateFromReviewedFacts() {
    if (!sectionKey) return;
    setGeneratingReviewedFacts(true);
    setError(null);
    try {
      const state = await api.post<SupportFormUploadState>(`/support-form-uploads/${evalId}/generate-from-reviewed-facts`, { sectionKey });
      onUploadComplete(state);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 403 ? "Only the assigned rater or senior rater can draft bullets from reviewed facts." : e instanceof Error ? e.message : "Unable to draft bullets from reviewed facts.");
    } finally {
      setGeneratingReviewedFacts(false);
    }
  }

  function startPolling() {
    if (pollInterval) return; // already polling
    const interval = setInterval(async () => {
      try {
        const state = await api.get<SupportFormUploadState>(
          `/support-form-uploads/${evalId}/status`,
        );
        onUploadComplete(state);
        if (state.parseStatus === "COMPLETE" || state.parseStatus === "FAILED") {
          clearInterval(interval);
          setPollInterval(null);
        }
      } catch {
        // ignore transient errors
      }
    }, 3000);
    setPollInterval(interval);
  }

  const isProcessing =
    uploadState.hasUpload &&
    uploadState.parseStatus &&
    IN_PROGRESS_STATUSES.has(uploadState.parseStatus);

  const isComplete = uploadState.parseStatus === "COMPLETE";
  const isFailed = uploadState.parseStatus === "FAILED";
  const isReviewRequired = uploadState.parseStatus === "REVIEW_REQUIRED";
  const visibleSectionLabel = sectionLabel ?? "all sections";
  const sectionExtractedEntries = (uploadState.extractedEntries ?? []).filter((entry) => !sectionKey || entry.section === sectionKey);
  const reviewedFactCount = sectionExtractedEntries.filter((entry) => ["ACCEPTED", "EDITED"].includes(entry.reviewStatus)).length;

  return (
    <div className="space-y-3">
      {/* Status banner if already uploaded */}
      {uploadState.hasUpload && (
        <div
          className={cn(
            "rounded border px-3 py-2 text-sm",
            isComplete
              ? "border-green-200 bg-green-50 text-green-800"
              : isFailed
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-amber-200 bg-amber-50 text-amber-800",
          )}
        >
          <div className="flex items-center gap-2">
            {isProcessing && (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            <span>
              {STATUS_LABELS[uploadState.parseStatus ?? ""] ?? uploadState.parseStatus}
            </span>
          </div>
          {isFailed && uploadState.parseError && (
            <p className="mt-1 text-xs opacity-80">{uploadState.parseError}</p>
          )}
          {isComplete && (
            <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2 text-xs opacity-80">
              <p>{uploadState.bulletSuggestions?.length ?? 0} evidence-grounded suggestions generated across {new Set(uploadState.bulletSuggestions?.map((b) => b.sectionKey)).size} sections.</p>
              <button type="button" onClick={reprocess} disabled={uploading} className="font-medium text-primary underline disabled:opacity-50">Reprocess support form</button>
            </div>
          )}
          {isReviewRequired && (
            <p className="mt-1 text-xs opacity-80">Parsing does not finalize the support form or create accepted evaluation content.</p>
          )}
        </div>
      )}

      {uploadState.hasUpload && uploadState.fileType && (
        <UploadedSupportFormViewer evalId={evalId} fileType={uploadState.fileType} />
      )}

      {/* Upload drop zone */}
      {!isProcessing && !isComplete && (
        <div
          className={cn(
            "rounded border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30",
          )}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            aria-label="Upload support form"
            accept=".pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {uploading ? "Uploading" : "Upload existing support form"}
            </p>
            <p className="text-xs text-muted-foreground">
              PDF or image (JPEG, PNG, WEBP) · Max 20 MB
            </p>
            <p className="text-xs text-muted-foreground">
              PDF is the PM-demo path. Extracted facts require human review before use.
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {uploadState.extractedEntries && uploadState.extractedEntries.length > 0 && (
        <div className="space-y-2 rounded border border-border bg-background p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Extracted source facts</p>
              <p className="text-xs text-muted-foreground">Showing {sectionKey ? `${visibleSectionLabel} facts only` : "all extracted facts"}. Accept, edit, or reject each fact before it becomes usable evidence.</p>
            </div>
            {allowDraftFromReviewedFacts && sectionKey ? <button
              type="button"
              onClick={generateFromReviewedFacts}
              disabled={reviewedFactCount === 0 || generatingReviewedFacts || isProcessing}
              className="rounded bg-[#1A3010] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {generatingReviewedFacts ? "Drafting..." : `Draft ${visibleSectionLabel} bullets (${reviewedFactCount})`}
            </button> : <p className="text-xs text-muted-foreground">Draft bullets from each performance section tab.</p>}
          </div>
          <div className="space-y-2">
            {sectionExtractedEntries.length === 0 && <p className="rounded border border-dashed border-border p-3 text-xs text-muted-foreground">No extracted facts were classified for {visibleSectionLabel}.</p>}
            {sectionExtractedEntries.map((entry) => {
              const sourceText = entry.reviewedText ?? entry.originalExtractedText ?? [entry.what, entry.impact, entry.context].filter(Boolean).join(" ");
              const isEditing = editingFactId === entry.id;
              const busy = reviewingFactId === entry.id;
              return (
                <div key={entry.id} className="rounded border border-border p-3 text-xs">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-medium">{entry.section}</span>
                    {entry.factCategory && <span className="rounded bg-muted/60 px-1.5 py-0.5">{entry.factCategory}</span>}
                    <span className="rounded border border-border px-1.5 py-0.5">{entry.confidence} confidence</span>
                    <span className={cn("ml-auto rounded px-1.5 py-0.5 font-medium", entry.reviewStatus === "REJECTED" ? "bg-zinc-100 text-zinc-600" : entry.reviewStatus === "PENDING_REVIEW" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800")}>{REVIEW_LABELS[entry.reviewStatus]}</span>
                  </div>
                  {isEditing ? (
                    <textarea value={editText} onChange={(event) => setEditText(event.target.value)} rows={4} className="w-full rounded border border-input bg-background p-2 text-sm" />
                  ) : (
                    <p className="text-sm text-foreground">{sourceText}</p>
                  )}
                  <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
                    <p>Source: {entry.sourceDocumentName ?? uploadState.originalFileName ?? "Uploaded support form"}{entry.sourcePage ? `, page ${entry.sourcePage}` : ""}</p>
                    {entry.date && <p>Date: {entry.date}</p>}
                    {entry.quantityOrMetric && <p>Metric: {entry.quantityOrMetric}</p>}
                    {entry.extractionMethod && <p>Extraction: {entry.extractionMethod}</p>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <button type="button" disabled={busy || !editText.trim()} onClick={() => reviewFact(entry, "EDITED", editText)} className="rounded bg-[#1A3010] px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50">Save edit</button>
                        <button type="button" onClick={() => { setEditingFactId(null); setEditText(""); }} className="rounded border border-border px-2.5 py-1 text-xs">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button type="button" disabled={busy} onClick={() => reviewFact(entry, "ACCEPTED")} className="rounded bg-[#1A3010] px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50">Accept</button>
                        <button type="button" disabled={busy} onClick={() => { setEditingFactId(entry.id); setEditText(sourceText); }} className="rounded border border-border px-2.5 py-1 text-xs font-medium disabled:opacity-50">Edit</button>
                        <button type="button" disabled={busy} onClick={() => reviewFact(entry, "REJECTED")} className="rounded border border-destructive/30 px-2.5 py-1 text-xs font-medium text-destructive disabled:opacity-50">Reject</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Re-upload option if failed */}
      {isFailed && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-xs text-primary underline"
        >
          Try uploading again
        </button>
      )}
    </div>
  );
}

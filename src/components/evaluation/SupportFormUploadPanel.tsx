"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api/client";
import type { SupportFormUploadState } from "@/types/evaluation";
import { cn } from "@/lib/utils/cn";

interface SupportFormUploadPanelProps {
  evalId: string;
  uploadState: SupportFormUploadState;
  onUploadComplete: (state: SupportFormUploadState) => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_EXTRACT: "Queued for processing…",
  EXTRACTING: "Stage 1: Reading form text…",
  PENDING_PARSE: "Stage 1 done. Classifying entries…",
  PARSING: "Stage 2: Classifying entries…",
  PENDING_BULLETS: "Stage 2 done. Generating bullets…",
  GENERATING: "Stage 3: Writing bullet candidates…",
  COMPLETE: "✓ Processing complete — bullet suggestions are ready.",
  FAILED: "Processing failed.",
};

const IN_PROGRESS_STATUSES = new Set([
  "PENDING_EXTRACT",
  "EXTRACTING",
  "PENDING_PARSE",
  "PARSING",
  "PENDING_BULLETS",
  "GENERATING",
]);

export function SupportFormUploadPanel({
  evalId,
  uploadState,
  onUploadComplete,
}: SupportFormUploadPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        </div>
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
              {uploading ? "Uploading…" : "Upload Support Form (DA 2166-9-1A)"}
            </p>
            <p className="text-xs text-muted-foreground">
              PDF or image (JPEG, PNG, WEBP) · Max 20 MB
            </p>
            <p className="text-xs text-muted-foreground">
              Handwritten forms supported · AI will extract and classify entries
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
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

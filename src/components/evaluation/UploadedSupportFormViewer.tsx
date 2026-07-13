"use client";

import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { api } from "@/lib/api/client";

interface UploadedSupportFormViewerProps {
  evalId: string;
  fileType?: string;
}

export function UploadedSupportFormViewer({ evalId, fileType }: UploadedSupportFormViewerProps) {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (viewerUrl) URL.revokeObjectURL(viewerUrl);
  }, [viewerUrl]);

  async function openViewer() {
    setLoading(true);
    setError(null);
    try {
      const file = await api.blob(`/support-form-uploads/${evalId}/file`);
      const nextUrl = URL.createObjectURL(file);
      setViewerUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return nextUrl;
      });
    } catch {
      setError("Unable to open the uploaded support form.");
    } finally {
      setLoading(false);
    }
  }

  function closeViewer() {
    setViewerUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return null;
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openViewer}
        disabled={loading}
        className="flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
      >
        <FileText className="h-3.5 w-3.5" />
        {loading ? "Opening form..." : "Original support form"}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {viewerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Original uploaded support form">
          <div className="flex h-[min(90vh,900px)] w-full max-w-6xl flex-col rounded-sm border border-border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Original Uploaded Support Form</h2>
                <p className="text-xs text-muted-foreground">Review the source document alongside the suggested evaluation content.</p>
              </div>
              <button type="button" onClick={closeViewer} aria-label="Close uploaded support form" className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 bg-muted/20">
              {fileType === "image" ? (
                <img src={viewerUrl} alt="Original uploaded support form" className="h-full w-full object-contain" />
              ) : (
                <iframe src={viewerUrl} title="Original uploaded support form" className="h-full w-full border-0" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

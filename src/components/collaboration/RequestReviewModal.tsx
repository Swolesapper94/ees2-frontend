"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";

interface RequestReviewModalProps {
  evaluationId: string;
  sectionKey?: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function RequestReviewModal({
  evaluationId,
  sectionKey,
  onClose,
  onSubmitted,
}: RequestReviewModalProps) {
  const [message, setMessage] = useState(
    sectionKey
      ? `Please review the ${sectionKey} section and provide feedback.`
      : "Please review this evaluation and provide informal feedback before formal routing.",
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await api.post(`/evaluations/${evaluationId}/comments`, {
        content: `[REVIEW REQUEST] ${message}`,
        sectionKey,
      });
      onSubmitted();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-sm shadow-[var(--shadow-modal)] w-full max-w-md mx-4 p-6">
        <h2 className="text-base font-semibold mb-1">Request Informal Review</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {sectionKey
            ? `Requesting feedback on the ${sectionKey} section. The recipient can comment but this is not a formal signature.`
            : "The recipient will be able to review and comment. This is not a formal signature step."}
        </p>

        <label className="block text-sm font-medium mb-1">Message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          aria-label="Review request message"
          placeholder="Add context for the reviewer…"
          className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm resize-none mb-4"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-sm border border-border"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !message.trim()}
            className="px-3 py-1.5 text-sm rounded-sm bg-primary text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import type { ConsistencyFlag } from "@/types/evaluation";

export interface ConsistencyCheckModalProps {
  open: boolean;
  flags: ConsistencyFlag[];
  onClose?: () => void;
  onProceed?: () => void;
}

/**
 * Surfaces the 6-type consistency check before signature. Warnings are
 * non-blocking but must be acknowledged. See start.md §7.
 */
export function ConsistencyCheckModal({
  open,
  flags,
  onClose,
  onProceed,
}: ConsistencyCheckModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-md border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-1 text-lg font-bold">Consistency Check</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {flags.length === 0
            ? "No issues detected."
            : `${flags.length} item(s) to review.`}
        </p>
        <ul className="mb-4 space-y-2">
          {flags.map((f) => (
            <li key={f.code} className="text-sm">
              <span className="font-medium">{f.severity}:</span> {f.message}
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-input px-3 py-1.5 text-sm"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="rounded-sm bg-primary px-3 py-1.5 text-sm text-primary-foreground"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}

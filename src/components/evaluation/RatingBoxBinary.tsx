"use client";

import { cn } from "@/lib/utils/cn";
import type { RatingBinary } from "@/types/evaluation";
import { RATING_BINARY_LABELS } from "@/lib/utils/form-constants";

export interface RatingBoxBinaryProps {
  value: RatingBinary | null;
  onChange?: (value: RatingBinary) => void;
  disabled?: boolean;
}

const OPTIONS: RatingBinary[] = ["MET_STANDARD", "DID_NOT_MEET_STANDARD"];

export function RatingBoxBinary({
  value,
  onChange,
  disabled,
}: RatingBoxBinaryProps) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(opt)}
          className={cn(
            "rounded-sm border px-3 py-2 text-sm transition-colors",
            value === opt
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-accent",
          )}
        >
          {RATING_BINARY_LABELS[opt]}
        </button>
      ))}
    </div>
  );
}

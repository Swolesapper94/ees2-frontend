"use client";

import { cn } from "@/lib/utils/cn";
import type { RatingFourLevel } from "@/types/evaluation";
import { RATING_FOUR_LEVEL_LABELS } from "@/lib/utils/form-constants";

export interface RatingBoxFourLevelProps {
  value: RatingFourLevel | null;
  onChange?: (value: RatingFourLevel) => void;
  disabled?: boolean;
}

const OPTIONS: RatingFourLevel[] = [
  "NOT_MET_STANDARD",
  "QUALIFIED",
  "EXCEEDED_STANDARD",
  "FAR_EXCEEDED_STANDARD",
];

export function RatingBoxFourLevel({
  value,
  onChange,
  disabled,
}: RatingBoxFourLevelProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
          {RATING_FOUR_LEVEL_LABELS[opt]}
        </button>
      ))}
    </div>
  );
}

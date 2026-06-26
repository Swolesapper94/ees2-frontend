"use client";

import { useState } from "react";

export interface SuccessionPlanFormProps {
  onSubmit?: (data: {
    nextAssignments: string;
    promotionPotential: string;
  }) => void;
}

export function SuccessionPlanForm({ onSubmit }: SuccessionPlanFormProps) {
  const [nextAssignments, setNextAssignments] = useState("");
  const [promotionPotential, setPromotionPotential] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.({ nextAssignments, promotionPotential });
      }}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Recommended next assignments
        </label>
        <textarea
          rows={2}
          value={nextAssignments}
          onChange={(e) => setNextAssignments(e.target.value)}
          className="w-full rounded-sm border border-input bg-background p-2 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Promotion potential</label>
        <textarea
          rows={2}
          value={promotionPotential}
          onChange={(e) => setPromotionPotential(e.target.value)}
          className="w-full rounded-sm border border-input bg-background p-2 text-sm"
        />
      </div>
      <button
        type="submit"
        className="rounded-sm bg-primary px-3 py-1.5 text-sm text-primary-foreground"
      >
        Save plan
      </button>
    </form>
  );
}

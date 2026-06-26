"use client";

import { useState } from "react";

export interface GuidedQuestion {
  id: string;
  prompt: string;
}

export interface GuidedQuestionsFormProps {
  questions: GuidedQuestion[];
  onSubmit?: (answers: Record<string, string>) => void;
}

/**
 * Gate 1 of the anti-autopilot flow: the rater must supply real, specific
 * input before any bullet is generated. No blank-box "write my NCOER".
 * See start.md §6.
 */
export function GuidedQuestionsForm({
  questions,
  onSubmit,
}: GuidedQuestionsFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(answers);
      }}
      className="space-y-4"
    >
      {questions.map((q) => (
        <div key={q.id} className="space-y-1.5">
          <label className="text-sm font-medium">{q.prompt}</label>
          <textarea
            rows={2}
            required
            value={answers[q.id] ?? ""}
            onChange={(e) =>
              setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
            }
            className="w-full rounded-sm border border-input bg-background p-2 text-sm"
          />
        </div>
      ))}
      <button
        type="submit"
        className="rounded-sm bg-primary px-3 py-1.5 text-sm text-primary-foreground"
      >
        Generate drafts
      </button>
    </form>
  );
}

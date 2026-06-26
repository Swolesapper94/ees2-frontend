"use client";

import { useState } from "react";
import { GeneratingIndicator } from "./GeneratingIndicator";

export interface BulletGeneratorProps {
  onGenerate?: () => Promise<string[]>;
  onResult?: (bullets: string[]) => void;
}

/**
 * Gate 2: drafts are clearly labeled as starting points, never final text.
 * Output flows into the staging panel for human review. See start.md §6.
 */
export function BulletGenerator({ onGenerate, onResult }: BulletGeneratorProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!onGenerate) return;
    setLoading(true);
    try {
      const bullets = await onGenerate();
      onResult?.(bullets);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <GeneratingIndicator />;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-sm border border-input px-3 py-1.5 text-sm hover:bg-accent"
    >
      Generate draft bullets
    </button>
  );
}

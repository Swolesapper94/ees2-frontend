"use client";

import type { BulletSource } from "@/types/evaluation";

export interface StagingBullet {
  id: string;
  text: string;
  source: BulletSource;
}

export interface BulletStagingPanelProps {
  staging: StagingBullet[];
  onCommit?: (bullet: StagingBullet) => void;
  onDiscard?: (id: string) => void;
}

/**
 * Holding area between AI generation and the final form. Nothing here counts
 * until the rater explicitly commits it — Gate 3 of the anti-autopilot flow.
 */
export function BulletStagingPanel({ staging }: BulletStagingPanelProps) {
  if (staging.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No staged bullets. Generated drafts land here for review.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {/* TODO: map staging → BulletCard with commit/discard actions */}
      <p className="text-sm text-muted-foreground">
        {staging.length} staged bullet(s).
      </p>
    </div>
  );
}

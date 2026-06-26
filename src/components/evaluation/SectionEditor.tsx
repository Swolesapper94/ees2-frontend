"use client";

import { useState, useCallback } from "react";
import type {
  EvalSection,
  RatingBinary,
  RatingFourLevel,
  BulletSource,
} from "@/types/evaluation";
import { RatingBoxBinary } from "./RatingBoxBinary";
import { RatingBoxFourLevel } from "./RatingBoxFourLevel";
import { BulletEditor } from "./BulletEditor";
import { BulletCard } from "./BulletCard";
import { BULLET_MAX_CHARS } from "@/lib/utils/form-constants";

export interface SectionEditorProps {
  section: EvalSection;
  /** Called with merged updates after any change */
  onSave?: (patch: Partial<EvalSection>) => Promise<void>;
  /** Which rating style to show — binary (CHARACTER) or four-level (PRESENCE…ACHIEVES) */
  ratingStyle?: "binary" | "four-level" | "none";
}

export function SectionEditor({
  section,
  onSave,
  ratingStyle = "four-level",
}: SectionEditorProps) {
  const [ratingBinary, setRatingBinary] = useState<RatingBinary | null>(
    section.ratingBinary,
  );
  const [ratingFourLevel, setRatingFourLevel] = useState<RatingFourLevel | null>(
    section.ratingFourLevel,
  );
  const [finalBullets, setFinalBullets] = useState<string[]>(
    section.finalBullets ?? [],
  );
  const [bulletSources, setBulletSources] = useState<
    Record<string, BulletSource>
  >((section.bulletSources as Record<string, BulletSource>) ?? {});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canAddBullet = finalBullets.length < 5; // Army max per section is typically 3-5

  const save = useCallback(
    async (patch: Partial<EvalSection>) => {
      setSaving(true);
      setSaveError(null);
      try {
        await onSave?.(patch);
      } catch {
        setSaveError("Save failed — try again");
      } finally {
        setSaving(false);
      }
    },
    [onSave],
  );

  async function handleRatingBinaryChange(val: RatingBinary) {
    setRatingBinary(val);
    await save({ ratingBinary: val });
  }

  async function handleRatingFourLevelChange(val: RatingFourLevel) {
    setRatingFourLevel(val);
    await save({ ratingFourLevel: val });
  }

  async function handleAddBullet(text: string) {
    if (!text.trim() || text.length > BULLET_MAX_CHARS) return;
    const newBullets = [...finalBullets, text];
    const newSources: Record<string, BulletSource> = {
      ...bulletSources,
      [String(newBullets.length - 1)]: "HUMAN",
    };
    setFinalBullets(newBullets);
    setBulletSources(newSources);
    await save({ finalBullets: newBullets, bulletSources: newSources });
  }

  async function handleEditBullet(index: number, text: string) {
    const newBullets = finalBullets.map((b, i) => (i === index ? text : b));
    // Mark as HUMAN if they edited it regardless of original source
    const newSources: Record<string, BulletSource> = {
      ...bulletSources,
      [String(index)]: "HUMAN",
    };
    setFinalBullets(newBullets);
    setBulletSources(newSources);
    setEditingIndex(null);
    await save({ finalBullets: newBullets, bulletSources: newSources });
  }

  async function handleRemoveBullet(index: number) {
    const newBullets = finalBullets.filter((_, i) => i !== index);
    const newSources: Record<string, BulletSource> = {};
    newBullets.forEach((_, i) => {
      const oldSrc = bulletSources[String(i < index ? i : i + 1)];
      if (oldSrc) newSources[String(i)] = oldSrc;
    });
    setFinalBullets(newBullets);
    setBulletSources(newSources);
    await save({ finalBullets: newBullets, bulletSources: newSources });
  }

  async function handleMarkComplete() {
    await save({ isComplete: true });
  }

  return (
    <div className="space-y-5">
      {/* Rating */}
      {ratingStyle === "binary" && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Rating
          </h3>
          <RatingBoxBinary value={ratingBinary} onChange={handleRatingBinaryChange} />
        </div>
      )}
      {ratingStyle === "four-level" && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Rating
          </h3>
          <RatingBoxFourLevel
            value={ratingFourLevel}
            onChange={handleRatingFourLevelChange}
          />
        </div>
      )}

      {/* Committed bullets */}
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Performance Bullets ({finalBullets.length}/5)
        </h3>

        {finalBullets.length === 0 && (
          <p className="rounded-sm border border-dashed border-border p-3 text-sm text-muted-foreground">
            No bullets yet. Add your first performance bullet below.
          </p>
        )}

        <div className="space-y-2">
          {finalBullets.map((bullet, i) =>
            editingIndex === i ? (
              <BulletEditor
                key={i}
                initialText={bullet}
                onSave={(text) => handleEditBullet(i, text)}
              />
            ) : (
              <BulletCard
                key={i}
                text={bullet}
                source={bulletSources[String(i)] ?? "HUMAN"}
                onEdit={() => setEditingIndex(i)}
                onRemove={() => handleRemoveBullet(i)}
              />
            ),
          )}
        </div>
      </div>

      {/* Add new bullet */}
      {canAddBullet && editingIndex === null && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Add Bullet
          </h3>
          <BulletEditor onSave={handleAddBullet} />
          <p className="mt-1 text-xs text-muted-foreground">
            Army format: begin with action verb, focus on impact, ≤{BULLET_MAX_CHARS} chars.
          </p>
        </div>
      )}

      {/* Status / save feedback */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        {saveError ? (
          <p className="text-sm text-destructive">{saveError}</p>
        ) : saving ? (
          <p className="text-sm text-muted-foreground">Saving…</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {section.isComplete ? "✓ Section complete" : "Changes auto-save"}
          </p>
        )}
        {!section.isComplete && (
          <button
            type="button"
            onClick={handleMarkComplete}
            className="rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );
}


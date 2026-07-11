"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { ProfileMeter } from "@/components/senior-rater/ProfileMeter";
import { SuccessionPlanForm } from "@/components/senior-rater/SuccessionPlanForm";
import { Button } from "@/components/ui/button";
import type { SeniorRaterRating } from "@/types/evaluation";
import { SENIOR_RATER_LABELS } from "@/lib/utils/form-constants";

const SR_OPTIONS: SeniorRaterRating[] = [
  "MOST_QUALIFIED",
  "HIGHLY_QUALIFIED",
  "QUALIFIED",
  "NOT_QUALIFIED",
];

interface SrMqProfile {
  grade: string;
  isNco: boolean;
  capPercent: number;
  mqCount: number;
  total: number;
  mqPct: number;
}

export default function SeniorRaterPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [rating, setRating] = useState<SeniorRaterRating | null>(null);
  const [srMqProfile, setSrMqProfile] = useState<SrMqProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get<{ seniorRaterRating: SeniorRaterRating | null; srMqProfile: SrMqProfile }>(
        `/evaluations/${id}`,
      )
      .then((d) => {
        setRating(d.seniorRaterRating);
        setSrMqProfile(d.srMqProfile);
      });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    await api.patch(`/evaluations/${id}`, { seniorRaterRating: rating });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Project forward: if the SR is about to save a MOST_QUALIFIED rating,
  // what would the grade's MQ rate become including this eval?
  const projectedMqPct = srMqProfile
    ? rating === "MOST_QUALIFIED"
      ? Math.round(((srMqProfile.mqCount + 1) / (srMqProfile.total + 1)) * 100)
      : srMqProfile.mqPct
    : null;
  const mqWarning =
    rating === "MOST_QUALIFIED" &&
    srMqProfile !== null &&
    projectedMqPct !== null &&
    projectedMqPct > srMqProfile.capPercent;

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-xl font-bold tracking-tight">Senior Rater Overall</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Part V — potential assessment and profile constraint check.
      </p>

      {srMqProfile && srMqProfile.total > 0 && (
        <div className="mb-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your Senior Rater Profile — {srMqProfile.grade} ({srMqProfile.isNco ? "NCO" : "Officer/WO"})
          </h3>
          <ProfileMeter
            mostQualified={srMqProfile.mqCount}
            total={srMqProfile.total}
            capPercent={srMqProfile.capPercent}
          />
          {mqWarning && (
            <p className="mt-2 rounded-sm border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
              ⚠️  Saving MOST QUALIFIED would put your {srMqProfile.grade} rate at {projectedMqPct}% — AR 623-3 caps {srMqProfile.isNco ? "NCO" : "Officer/WO"} Senior Raters at {srMqProfile.capPercent}%. You can still save this if it's genuinely earned — this is a transparency flag, not a hard block.
            </p>
          )}
        </div>
      )}

      <div className="mb-5">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Overall Assessment
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {SR_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setRating(opt)}
              className={`rounded-sm border px-3 py-2 text-sm transition-colors ${
                rating === opt
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent"
              }`}
            >
              {SENIOR_RATER_LABELS[opt]}
            </button>
          ))}
        </div>
      </div>

      <SuccessionPlanForm />

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || !rating}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
        <Button variant="outline" onClick={() => router.push(`/evaluations/${id}/review`)}>
          Review &amp; Generate PDF →
        </Button>
      </div>
    </div>
  );
}

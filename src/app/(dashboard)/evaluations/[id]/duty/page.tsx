"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DutyData {
  principalDutyTitle: string | null;
  dailyDutiesScope: string | null;
  supportForm: { dutyTitle: string; dailyDutiesScope: string | null } | null;
  ratingChain: { ratedSoldier: { rank: string; mos: string } };
}

export default function DutyDescriptionPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [dutyTitle, setDutyTitle] = useState("");
  const [duties, setDuties] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftSource, setDraftSource] = useState<"evaluation" | "support-form" | "generic">("evaluation");

  useEffect(() => {
    api
      .get<DutyData>(`/evaluations/${id}`)
      .then((d) => {
        const rank = d.ratingChain.ratedSoldier.rank;
        const mos = d.ratingChain.ratedSoldier.mos;
        const supportFormTitle = d.supportForm?.dutyTitle ?? "";
        const supportFormDuties = d.supportForm?.dailyDutiesScope ?? "";
        const hasEvaluationDuty = Boolean(d.principalDutyTitle || d.dailyDutiesScope);
        const hasSupportFormDuty = Boolean(supportFormTitle || supportFormDuties);
        setDutyTitle(d.principalDutyTitle || supportFormTitle || `${rank} (${mos})`);
        setDuties(
          d.dailyDutiesScope || supportFormDuties ||
            `Serves as a ${rank} in MOS ${mos}; responsible for assigned personnel, training, readiness, equipment, and mission execution.`,
        );
        setDraftSource(hasEvaluationDuty ? "evaluation" : hasSupportFormDuty ? "support-form" : "generic");
      })
      .catch(() => setLoadError("Unable to load duty information. Refresh the page and try again."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      await api.patch(`/evaluations/${id}`, {
        principalDutyTitle: dutyTitle,
        dutyDescription: duties,
      });
      setDraftSource("evaluation");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError("Unable to save duty information. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="max-w-2xl space-y-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-64" />
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    </div>
  );

  if (loadError) return <p className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadError}</p>;

  const sourceMessage = {
    evaluation: "Current evaluation duty description.",
    "support-form": "Draft prefilled from the linked support form. Review and save to make it the evaluation record.",
    generic: "Editable starter draft based on the rated Soldier's rank and MOS. Replace it with the actual assignment responsibilities.",
  }[draftSource];

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold tracking-tight">Duty Description</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Part III — principal duty title and significant responsibilities.
      </p>
      <p className="mb-4 rounded-sm border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
        {sourceMessage}
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Principal Duty Title
          </label>
          <input
            type="text"
            value={dutyTitle}
            onChange={(e) => setDutyTitle(e.target.value)}
            placeholder="e.g. Team Leader"
            className="w-full rounded-sm border border-input bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Significant Duties and Responsibilities
          </label>
          <textarea
            rows={5}
            value={duties}
            onChange={(e) => setDuties(e.target.value)}
            placeholder="Describe key duties, scope, and responsibilities…"
            className="w-full rounded-sm border border-input bg-background p-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Briefly describe the most important duties performed. This is not an evaluation — it sets context for the rater's narrative.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          {saved && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
          {saveError && <span className="text-sm text-red-600">{saveError}</span>}
          <Button
            variant="outline"
            onClick={() => router.push(`/evaluations/${id}/character`)}
          >
            Next: Character →
          </Button>
        </div>
      </div>
    </div>
  );
}

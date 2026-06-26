"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

export default function DutyDescriptionPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [dutyTitle, setDutyTitle] = useState("");
  const [duties, setDuties] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get<{ principalDutyTitle: string | null; dutyDescription: string | null }>(
        `/evaluations/${id}`,
      )
      .then((d) => {
        setDutyTitle(d.principalDutyTitle ?? "");
        setDuties((d as Record<string, string>).dutyDescription ?? "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await api.patch(`/evaluations/${id}`, {
      principalDutyTitle: dutyTitle,
      dutyDescription: duties,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold tracking-tight">Duty Description</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Part III — principal duty title and significant responsibilities.
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

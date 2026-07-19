"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { ArtifactType, SupportForm } from "@/types/evaluation";
import { Trash2 } from "lucide-react";

const SECTIONS = [
  "CHARACTER",
  "PRESENCE",
  "INTELLECT",
  "LEADS",
  "DEVELOPS",
  "ACHIEVES",
] as const;

type Section = (typeof SECTIONS)[number];

const ENTRY_TYPES = [
  { value: "ACCOMPLISHMENT", label: "Accomplishment — something already done" },
] as const;

const ARTIFACT_TYPES: { value: ArtifactType; label: string }[] = [
  { value: "CERTIFICATE", label: "Certificate/Award (course completion, AER, etc.)" },
  { value: "SCORE_SHEET", label: "Score Sheet (ACFT, range, test result)" },
  { value: "PHOTO", label: "Photo (soldier performing task, with team, etc.)" },
  { value: "DOCUMENT", label: "Document (other paper record)" },
  { value: "OTHER", label: "Other" },
];

interface ArtifactDraft {
  id: string;
  file: File | null;
  type: ArtifactType;
  flagged: boolean;
  flagNote: string;
}

interface CurrentUser {
  id: string;
  roles: string[];
}

function newDraft(): ArtifactDraft {
  return {
    id: Math.random().toString(36).slice(2),
    file: null,
    type: "CERTIFICATE",
    flagged: false,
    flagNote: "",
  };
}

export default function NewEntryPage() {
  return <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading entry form...</p>}><NewEntryContent /></Suspense>;
}

function NewEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = searchParams.get("formId");
  const assisting = searchParams.get("assisting");
  const [form, setForm] = useState<SupportForm | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingForm, setLoadingForm] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [section, setSection] = useState<Section>("CHARACTER");
  const [entryType, setEntryType] = useState<(typeof ENTRY_TYPES)[number]["value"]>(
    "ACCOMPLISHMENT",
  );
  const [text, setText] = useState("");
  const [artifacts, setArtifacts] = useState<ArtifactDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get<CurrentUser>("/users/me");
        setCurrentUser(me);
        const active = formId
          ? await api.get<SupportForm>(`/support-forms/${formId}`)
          : (() => undefined)();
        if (active) {
          setForm(active);
          return;
        }
        const forms = await api.get<SupportForm[]>(`/support-forms?soldierId=${me.id}`);
        const ownForm = forms.find((f) => f.isActive && !f.completedAt) ?? forms[0] ?? null;
        setForm(ownForm);
      } catch {
        setLoadError("Failed to load your support form.");
      } finally {
        setLoadingForm(false);
      }
    })();
  }, []);

  const availableEntryTypes = ENTRY_TYPES;

  function addArtifact() {
    setArtifacts((prev) => [...prev, newDraft()]);
  }

  function updateArtifact(id: string, patch: Partial<ArtifactDraft>) {
    setArtifacts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function removeArtifact(id: string) {
    setArtifacts((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !form) return;

    const invalidFlag = artifacts.find(
      (a) => a.file && a.flagged && !a.flagNote.trim(),
    );
    if (invalidFlag) {
      setSubmitError("Explain the discrepancy before flagging an artifact.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const entry = await api.post<{ id: string }>(`/support-forms/${form.id}/entries`, {
        section,
        entryType,
        rawText: text.trim(),
      });

      for (const artifact of artifacts) {
        if (!artifact.file) continue;
        const fd = new FormData();
        fd.append("file", artifact.file);
        fd.append("type", artifact.type);
        fd.append("flaggedByServiceMember", String(artifact.flagged));
        if (artifact.flagged) fd.append("flagNote", artifact.flagNote.trim());
        await api.upload(`/support-forms/${form.id}/entries/${entry.id}/artifacts`, fd);
      }

      router.push(`/support-form${formId ? `?formId=${formId}${assisting ? `&assisting=${encodeURIComponent(assisting)}` : ""}` : ""}`);
    } catch {
      setSubmitError("Failed to save entry — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingForm) {
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  }

  if (loadError || !form) {
    return (
      <div className="p-6">
        <p className="rounded-sm border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {loadError ?? "No active support form found. Contact your rater or admin to have one started."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      {assisting && <p className="mb-4 rounded-sm border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">You are drafting this entry while assisting the rated Soldier. Your name and grant will remain attached to the draft.</p>}
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Log Entry</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Record a factual accomplishment for the rating period. Goals are managed separately.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Entry type toggle */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Entry type</span>
          <div className="flex gap-2">
            {availableEntryTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setEntryType(t.value)}
                className={`flex-1 rounded-sm border px-3 py-2 text-left text-xs transition-colors ${
                  entryType === t.value
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:bg-accent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section selector */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="section" className="text-sm font-medium">
            Section
          </label>
          <select
            id="section"
            value={section}
            onChange={(e) => setSection(e.target.value as Section)}
            className="rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Entry text */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="entry-text" className="text-sm font-medium">
            Entry
          </label>
          <textarea
            id="entry-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe what happened — be specific and objective…"
            rows={5}
            className="rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>

        {/* Artifacts */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Proof (optional)</span>
            <button
              type="button"
              onClick={addArtifact}
              className="text-xs text-primary underline"
            >
              + Attach proof
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Attach a certificate, score sheet, photo, or other document that backs up this entry.
          </p>

          {artifacts.map((a) => (
            <div key={a.id} className="space-y-2 rounded-sm border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <select
                  value={a.type}
                  onChange={(e) =>
                    updateArtifact(a.id, { type: e.target.value as ArtifactType })
                  }
                  title="Proof type"
                  aria-label="Proof type"
                  className="flex-1 rounded-sm border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                >
                  {ARTIFACT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeArtifact(a.id)}
                  className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                  aria-label="Remove attachment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={(e) =>
                  updateArtifact(a.id, { file: e.target.files?.[0] ?? null })
                }
                title="Attach proof file"
                aria-label="Attach proof file"
                className="w-full text-xs"
              />
              <label className="flex items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={a.flagged}
                  onChange={(e) => updateArtifact(a.id, { flagged: e.target.checked })}
                  className="mt-0.5"
                />
                <span>
                  I&apos;m not sure this is reflected in iPERMS yet, or there may be a
                  discrepancy — flag this for my rater/senior rater to verify.
                </span>
              </label>
              {a.flagged && (
                <textarea
                  value={a.flagNote}
                  onChange={(e) => updateArtifact(a.id, { flagNote: e.target.value })}
                  placeholder="Briefly explain the discrepancy…"
                  rows={2}
                  className="w-full rounded-sm border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              )}
            </div>
          ))}
        </div>

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={!text.trim() || submitting}>
            {submitting ? "Saving…" : "Save Entry"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}


"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";
import type { SupportForm, SupportFormEntry } from "@/types/evaluation";
import { AlertTriangle, Award, FileText, Image as ImageIcon, Paperclip } from "lucide-react";

const SECTION_LABELS: Record<string, string> = {
  CHARACTER: "Character",
  PRESENCE: "Presence",
  INTELLECT: "Intellect",
  LEADS: "Leads",
  DEVELOPS: "Develops",
  ACHIEVES: "Achieves",
};

const ARTIFACT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CERTIFICATE: Award,
  SCORE_SHEET: FileText,
  PHOTO: ImageIcon,
  DOCUMENT: FileText,
  OTHER: Paperclip,
};

interface CurrentUser {
  id: string;
}

export default function SupportFormPage() {
  const [entries, setEntries] = useState<SupportFormEntry[]>([]);
  const [form, setForm] = useState<SupportForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get<CurrentUser>("/users/me");
        const forms = await api.get<SupportForm[]>(`/support-forms?soldierId=${me.id}`);
        const active = forms.find((f) => f.isActive && !f.completedAt) ?? forms[0] ?? null;
        setForm(active);
        setEntries(active?.entries ?? []);
      } catch {
        setError("Failed to load support form.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Form</h1>
          <p className="text-sm text-muted-foreground">
            Continuous performance log — objectives and accomplishments.
          </p>
        </div>
        {form ? (
          <Button asChild>
            <Link href="/support-form/entry/new">Log entry</Link>
          </Button>
        ) : (
          <Button disabled>Log entry</Button>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && !form && (
        <div className="rounded-sm border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No active support form found. Contact your rater or admin to have one started.
          </p>
        </div>
      )}

      {!loading && !error && form && entries.length === 0 && (
        <div className="rounded-sm border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No entries yet.</p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-sm border border-border bg-card p-4">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-sm bg-muted px-2 py-0.5 text-xs font-medium">
                    {SECTION_LABELS[entry.section] ?? entry.section}
                  </span>
                  <span
                    className={
                      entry.entryType === "ACCOMPLISHMENT"
                        ? "rounded-sm bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                        : "rounded-sm bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                    }
                  >
                    {entry.entryType === "ACCOMPLISHMENT" ? "Accomplishment" : "Objective"}
                  </span>
                  {entry.isHighlight && (
                    <span className="rounded-sm bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      ★ Highlight
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.entryDate).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm">{entry.rawText}</p>
              {entry.artifacts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {entry.artifacts.map((a) => {
                    const Icon = ARTIFACT_ICONS[a.type] ?? Paperclip;
                    return (
                      <a
                        key={a.id}
                        href={a.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
                      >
                        <Icon className="h-3 w-3" />
                        {a.type.charAt(0) + a.type.slice(1).toLowerCase().replace("_", " ")}
                        {a.flaggedByServiceMember && (
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                        )}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/Switch";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api/client";

type NotificationCategory =
  | "EVAL_LIFECYCLE"
  | "MILESTONE"
  | "COLLABORATION"
  | "DELEGATE"
  | "SYSTEM";

interface MeResponse {
  id: string;
  notificationPreferences?: Partial<Record<NotificationCategory, boolean>> | null;
}

const CATEGORIES: { key: NotificationCategory; label: string; description: string }[] = [
  {
    key: "EVAL_LIFECYCLE",
    label: "Evaluation Lifecycle",
    description: "Status changes, signature requests, and routing events on your evaluations.",
  },
  {
    key: "MILESTONE",
    label: "Milestones & Suspenses",
    description: "AR 623-3 counseling and suspense events — overdue and due-soon alerts.",
  },
  {
    key: "COLLABORATION",
    label: "Collaboration",
    description: "Comment threads and informal review requests.",
  },
  {
    key: "DELEGATE",
    label: "Delegate Access",
    description: "Delegate appointed, revoked, or reminder activity.",
  },
  {
    key: "SYSTEM",
    label: "System Announcements",
    description: "Maintenance windows, doctrine updates, and new feature notices.",
  },
];

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Partial<Record<NotificationCategory, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<NotificationCategory | null>(null);

  useEffect(() => {
    api
      .get<MeResponse>("/users/me")
      .then((data) => setPrefs(data.notificationPreferences ?? {}))
      .catch((e) =>
        setError(e instanceof ApiError ? `API error ${e.status}` : "Failed to load settings"),
      )
      .finally(() => setLoading(false));
  }, []);

  async function toggle(category: NotificationCategory, next: boolean) {
    const prev = prefs;
    setPrefs((p) => ({ ...p, [category]: next }));
    setSavingKey(category);
    try {
      await api.patch<MeResponse>("/users/me", {
        notificationPreferences: { [category]: next },
      });
    } catch {
      setPrefs(prev); // revert on failure
      setError("Failed to save preference — please try again.");
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Notification preferences.</p>
      </div>

      {error && (
        <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-sm border border-border bg-card p-5">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Notifications
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Choose which categories of notifications you receive. Turning a category off stops it
          server-side — it won&apos;t be created for you at all, not just hidden.
        </p>
        <div className="divide-y divide-border">
          {CATEGORIES.map((c) => {
            const checked = prefs[c.key] !== false; // missing key = enabled
            return (
              <div key={c.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
                <Switch
                  checked={checked}
                  disabled={savingKey === c.key}
                  aria-label={`Toggle ${c.label} notifications`}
                  onCheckedChange={(next) => toggle(c.key, next)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

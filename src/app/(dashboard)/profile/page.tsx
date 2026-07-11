"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RankInsignia } from "@/components/ui/RankInsignia";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { api, ApiError } from "@/lib/api/client";
import { rankAbbr, RANK_TO_GRADE } from "@/lib/utils/army-ranks";

interface Unit {
  id: string;
  name: string;
  uic?: string | null;
}

interface MeResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  rank: string;
  mos: string;
  roles: string[];
  dodid?: string | null;
  profilePictureUrl?: string | null;
  createdAt: string;
  unit?: Unit | null;
}

const ROLE_LABELS: Record<string, string> = {
  SOLDIER: "Soldier",
  RATER: "Rater",
  SENIOR_RATER: "Senior Rater",
  REVIEWER: "Reviewer",
  COMMANDER: "Commander",
  UNIT_COMMANDER: "Unit Commander",
  UNIT_ENLISTED_LEADER: "Unit Enlisted Leader",
  ADMIN: "Admin",
};

export default function ProfilePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarSaved, setAvatarSaved] = useState(false);

  useEffect(() => {
    api
      .get<MeResponse>("/users/me")
      .then((data) => {
        setMe(data);
        setAvatarUrl(data.profilePictureUrl ?? "");
      })
      .catch((e) =>
        setError(e instanceof ApiError ? `API error ${e.status}` : "Failed to load profile"),
      )
      .finally(() => setLoading(false));
  }, []);

  async function saveAvatar() {
    setSavingAvatar(true);
    setAvatarSaved(false);
    try {
      const updated = await api.patch<MeResponse>("/users/me", {
        profilePictureUrl: avatarUrl.trim() === "" ? null : avatarUrl.trim(),
      });
      setMe((prev) => (prev ? { ...prev, profilePictureUrl: updated.profilePictureUrl } : prev));
      setAvatarSaved(true);
      setTimeout(() => setAvatarSaved(false), 2000);
    } catch {
      setError("Failed to update profile picture.");
    } finally {
      setSavingAvatar(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !me) {
    return (
      <div className="p-6">
        <p className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error ?? "Profile not found."}
        </p>
      </div>
    );
  }

  const initials = `${me.firstName[0] ?? ""}${me.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">View account &amp; unit info.</p>
      </div>

      {/* Identity card */}
      <div className="rounded-sm border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <UserAvatar src={me.profilePictureUrl} initials={initials} size="lg" />
          <RankInsignia rank={me.rank} size="lg" />
          <div>
            <p className="text-lg font-semibold">
              {rankAbbr(me.rank)} {me.lastName}, {me.firstName}
            </p>
            <p className="text-sm text-muted-foreground">
              {rankAbbr(me.rank)} · {RANK_TO_GRADE[me.rank] ?? ""} · MOS {me.mos}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {me.roles.map((r) => (
            <span
              key={r}
              className="rounded-sm bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
            >
              {ROLE_LABELS[r] ?? r}
            </span>
          ))}
        </div>
      </div>

      {/* Account info */}
      <div className="rounded-sm border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Account
        </h2>
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{me.email}</dd>
          <dt className="text-muted-foreground">DOD ID</dt>
          <dd>{me.dodid ?? "—"}</dd>
          <dt className="text-muted-foreground">Member Since</dt>
          <dd>{new Date(me.createdAt).toLocaleDateString()}</dd>
        </dl>
      </div>

      {/* Unit info */}
      <div className="rounded-sm border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Unit
        </h2>
        {me.unit ? (
          <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Unit</dt>
            <dd>{me.unit.name}</dd>
            <dt className="text-muted-foreground">UIC</dt>
            <dd>{me.unit.uic ?? "—"}</dd>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No unit assigned.</p>
        )}
      </div>

      {/* Profile picture */}
      <div className="rounded-sm border border-border bg-card p-5">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Profile Picture
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Paste an image URL. In production this is pulled automatically from IPPS-A / CAC.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="h-9 flex-1 rounded-sm border border-input bg-background px-3 text-sm"
          />
          <Button onClick={saveAvatar} disabled={savingAvatar}>
            {savingAvatar ? "Saving…" : avatarSaved ? "Saved ✓" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

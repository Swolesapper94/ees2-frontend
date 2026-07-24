"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEV_PROFILES, loginAsDevProfile, type DevProfile } from "@/lib/auth/dev-login";

const SECTIONS: Array<{ group: DevProfile["group"]; title: string; description: string }> = [
  {
    group: "core",
    title: "Core demo — PM demo route",
    description: "Davis \u2192 Johnson \u2192 Williams. The one NCOER authoring story (docs/admin/16-pm-demo-route.md).",
  },
  {
    group: "oer",
    title: "Officer / OER boundary (optional)",
    description: "Only bring these in for a short officer form-selection segment, not the main story.",
  },
  {
    group: "fixtures",
    title: "Other feature test fixtures",
    description: "Supplementary review, rating-scheme administration, identity/access admin, and Access and Assistance \u2014 not part of the PM demo.",
  },
];

const DEFAULT_EMAIL = "james.davis@army.mil"; // SGT Davis — correct starting persona for the demo route.

/**
 * Development-only login screen (Delta Section 16).
 * Simulates CAC → IPPS-A by letting you pick a persona. Hard-guarded so it
 * never renders in production — production falls through to real CAC login.
 */
export default function DevLoginPage() {
  const router = useRouter();
  const [selectedEmail, setSelectedEmail] = useState(
    DEV_PROFILES.find((profile) => profile.email === DEFAULT_EMAIL)?.email ?? DEV_PROFILES[0]!.email,
  );

  // Hard guard — this screen must never exist in production.
  if (process.env.NODE_ENV === "production") {
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }

  function handleLogin() {
    const profile = DEV_PROFILES.find((candidate) => candidate.email === selectedEmail);
    if (!profile) return;
    loginAsDevProfile(profile);
    router.push("/dashboard");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Development Login</CardTitle>
        <CardDescription>
          CAC authentication is configured for production. Select a profile to
          simulate CAC login.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {SECTIONS.map((section) => {
          const profiles = DEV_PROFILES.filter((profile) => profile.group === section.group);
          if (profiles.length === 0) return null;
          return (
            <fieldset key={section.group} className="flex flex-col gap-2">
              <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </legend>
              <p className="mb-1 text-xs text-muted-foreground">{section.description}</p>
              <div className="flex flex-col divide-y divide-border rounded-sm border border-input">
                {profiles.map((profile) => (
                  <label
                    key={profile.email}
                    className="flex cursor-pointer items-start gap-3 p-3 text-sm hover:bg-muted"
                  >
                    <input
                      type="radio"
                      name="devProfile"
                      value={profile.email}
                      checked={selectedEmail === profile.email}
                      onChange={() => setSelectedEmail(profile.email)}
                      className="mt-1 h-4 w-4 rounded-none border-2 accent-primary"
                    />
                    <span className="flex flex-col">
                      <span className="font-medium">{profile.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {profile.hint}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}

        <Button type="button" onClick={handleLogin}>
          Login as Selected Profile
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Production: CAC login pulls from IPPS-A automatically.
        </p>
      </CardContent>
    </Card>
  );
}

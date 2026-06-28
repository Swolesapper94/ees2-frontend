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
import { DEV_PROFILES, loginAsDevProfile } from "@/lib/auth/dev-login";

/**
 * Development-only login screen (Delta Section 16).
 * Simulates CAC → IPPS-A by letting you pick a persona. Hard-guarded so it
 * never renders in production — production falls through to real CAC login.
 */
export default function DevLoginPage() {
  const router = useRouter();
  const [selected, setSelected] = useState(0);

  // Hard guard — this screen must never exist in production.
  if (process.env.NODE_ENV === "production") {
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }

  function handleLogin() {
    loginAsDevProfile(DEV_PROFILES[selected]);
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
        <fieldset className="flex flex-col divide-y divide-border rounded-sm border border-input">
          <legend className="sr-only">Select a dev profile</legend>
          {DEV_PROFILES.map((profile, i) => (
            <label
              key={profile.email}
              className="flex cursor-pointer items-start gap-3 p-3 text-sm hover:bg-muted"
            >
              <input
                type="radio"
                name="devProfile"
                value={i}
                checked={selected === i}
                onChange={() => setSelected(i)}
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
        </fieldset>

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

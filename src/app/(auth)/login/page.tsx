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

const IS_DEV = process.env.NODE_ENV === "development";

// Dev credentials for easy login without Supabase
const DEV_CREDENTIALS: Record<string, string> = {
  "james.smith@army.mil": "testpass",
  "robert.jones@army.mil": "testpass",
  "david.davis@army.mil": "testpass",
  "patricia.brown@army.mil": "testpass",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // In dev mode, bypass Supabase and use local dev auth
    if (IS_DEV) {
      if (DEV_CREDENTIALS[email] === password) {
        localStorage.setItem("devAuth", `Bearer dev:${email}:${password}`);
        router.push("/dashboard");
        return;
      } else {
        setError("Invalid credentials. Use a dev account (e.g. james.smith@army.mil / testpass)");
        setLoading(false);
        return;
      }
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Authentication service unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Sign in to EES 2.0</CardTitle>
        <CardDescription>
          {IS_DEV
            ? "Dev mode — use james.smith@army.mil / testpass"
            : "Use your unit-issued email and password."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 rounded-sm border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 rounded-sm border border-input bg-background px-3 text-sm"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

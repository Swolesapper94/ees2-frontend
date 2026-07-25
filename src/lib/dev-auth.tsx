"use client";

import { useEffect, useState } from "react";
import { clearClientApiCache, notifyAuthChanged } from "@/lib/api/cache";

const PUBLIC_PATHS = new Set(["/", "/login", "/dev-login"]);

/**
 * Development-only auth provider.
 * Checks for dev mode credentials in URL params or localStorage.
 * Sets localStorage['devAuth'] for subsequent requests.
 */
export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Production authentication is resolved by Supabase; this provider only
    // gates the development token shim.
    if (process.env.NODE_ENV === "production") {
      setReady(true);
      return;
    }

    // Check for dev token in URL params
    const params = new URLSearchParams(window.location.search);
    const devToken = params.get("dev");
    if (devToken) {
      void clearClientApiCache();
      localStorage.setItem("devAuth", `Bearer dev:${devToken}`);
      notifyAuthChanged();
      window.location.replace(window.location.pathname);
      return;
    }

    // Use stored dev token if available
    const stored = localStorage.getItem("devAuth");
    if (stored) {
      console.debug("[DevAuth] Using stored dev credentials");
      setReady(true);
      return;
    }

    // Do not mount protected dashboard components without credentials. Their
    // effects would otherwise issue a burst of guaranteed 401 requests before
    // each individual page notices the missing token and redirects.
    if (!PUBLIC_PATHS.has(window.location.pathname)) {
      window.location.replace("/dev-login");
      return;
    }

    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">Establishing secure session…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

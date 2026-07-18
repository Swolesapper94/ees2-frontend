"use client";

import { useEffect } from "react";
import { clearClientApiCache, notifyAuthChanged } from "@/lib/api/cache";

/**
 * Development-only auth provider.
 * Checks for dev mode credentials in URL params or localStorage.
 * Sets localStorage['devAuth'] for subsequent requests.
 */
export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

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
      // Dev auth is active; you can use this for fetch interceptors or API headers
      console.debug("[DevAuth] Using stored dev credentials");
    }
  }, []);

  return <>{children}</>;
}

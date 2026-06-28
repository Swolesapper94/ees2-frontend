"use client";

import { useEffect, useState } from "react";
import { DashboardShell, type DashboardShellProps } from "@/components/dashboard/DashboardShell";
import { api, ApiError } from "@/lib/api/client";

interface DashboardResponse extends DashboardShellProps {
  myUser?: { roles?: string[] };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardResponse>("/dashboard")
      .then(setData)
      .catch((e) => {
        setError(
          e instanceof ApiError
            ? `API error ${e.status}: ${e.message}`
            : "Could not load dashboard",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-4 w-32 animate-pulse rounded-sm bg-muted" />
        <div className="mt-4 h-32 animate-pulse rounded-sm bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <DashboardShell
      myChain={data.myChain}
      soldierChains={data.soldierChains}
      userRoles={data.myUser?.roles ?? []}
    />
  );
}

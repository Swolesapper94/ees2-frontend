"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell, type DashboardShellProps } from "@/components/dashboard/DashboardShell";
import { useApiGet } from "@/lib/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardResponse extends DashboardShellProps {
  dashboardRecap: string;
  myUser?: { 
    firstName: string;
    lastName: string;
    rank: string;
    roles?: string[];
    profilePictureUrl?: string | null;
    personnelProfile?: DashboardShellProps["myUser"] extends infer User
      ? User extends { personnelProfile?: infer Profile }
        ? Profile
        : never
      : never;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { data, error, isLoading } = useApiGet<DashboardResponse>("/dashboard", {
    refreshInterval: 30_000,
  });

  useEffect(() => {
    // Redirect to /dev-login if no auth token present
    if (typeof window !== "undefined" && !localStorage.getItem("devAuth")) {
      router.replace("/dev-login");
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-sm border border-border bg-card p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-14" />
            </div>
          ))}
        </div>
        <div className="rounded-sm border border-border bg-card p-6 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          API error {error.status}: {error.message}
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
      dashboardRecap={data.dashboardRecap}
      myUser={data.myUser ? {
        firstName: data.myUser.firstName,
        lastName: data.myUser.lastName,
        rank: data.myUser.rank,
        profilePictureUrl: data.myUser.profilePictureUrl,
        personnelProfile: data.myUser.personnelProfile,
      } : undefined}
    />
  );
}

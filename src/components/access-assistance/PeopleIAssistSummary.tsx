"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";

interface GrantSummary {
  id: string;
  status: string;
  subject: { displayName: string } | null;
  effectiveTo: string | null;
}

export function PeopleIAssistSummary() {
  const [grants, setGrants] = useState<GrantSummary[]>([]);

  useEffect(() => {
    api.get<{ grants: GrantSummary[] }>("/access-grants?view=i-assist&status=active")
      .then((response) => setGrants(response.grants))
      .catch(() => setGrants([]));
  }, []);

  if (grants.length === 0) return null;
  const expiringThisWeek = grants.filter((grant) => grant.effectiveTo && new Date(grant.effectiveTo).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000).length;

  return (
    <section className="border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">People I Assist</h2>
          <p className="mt-1 text-sm text-muted-foreground">Scoped assistance assignments are separate from rating-chain authority.</p>
        </div>
        <Link href="/access-assistance?view=i-assist" className="text-sm text-primary hover:underline">View Access and Assistance</Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <span className="rounded-sm bg-blue-50 px-3 py-2 text-sm text-blue-900">{grants.length} active assignment{grants.length === 1 ? "" : "s"}</span>
        {expiringThisWeek > 0 && <span className="rounded-sm bg-amber-50 px-3 py-2 text-sm text-amber-900">{expiringThisWeek} expiring this week</span>}
      </div>
    </section>
  );
}

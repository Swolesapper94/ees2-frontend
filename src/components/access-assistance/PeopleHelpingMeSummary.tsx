"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";

interface GrantSummary {
  id: string;
  status: "PENDING" | "ACTIVE" | "DECLINED" | "EXPIRED" | "REVOKED" | "SUSPENDED";
  person: { displayName: string } | null;
}

export function PeopleHelpingMeSummary() {
  const [grants, setGrants] = useState<GrantSummary[]>([]);

  useEffect(() => {
    api.get<{ grants: GrantSummary[] }>("/access-grants?view=helping-me")
      .then((response) => setGrants(response.grants))
      .catch(() => setGrants([]));
  }, []);

  const active = grants.filter((grant) => grant.status === "ACTIVE");
  const pending = grants.filter((grant) => grant.status === "PENDING");
  if (active.length === 0 && pending.length === 0) return null;

  return (
    <section className="border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">People Helping Me</h2>
          <p className="mt-1 text-sm text-muted-foreground">Helpers work under their own identity and never receive rating-chain authority.</p>
        </div>
        <Link href="/access-assistance?view=helping-me" className="text-sm text-primary hover:underline">Manage Access and Assistance</Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {active.length > 0 && <span className="rounded-sm bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{active.length} active helper{active.length === 1 ? "" : "s"}</span>}
        {pending.length > 0 && <span className="rounded-sm bg-amber-50 px-3 py-2 text-sm text-amber-900">{pending.length} invitation{pending.length === 1 ? "" : "s"} pending</span>}
      </div>
    </section>
  );
}

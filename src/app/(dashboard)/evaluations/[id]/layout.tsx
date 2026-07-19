"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { SoldierHeader } from "@/components/layout/SoldierHeader";
import { SectionNav } from "@/components/evaluation/SectionNav";
import { api } from "@/lib/api/client";

interface EvalMeta {
  id: string;
  formType: string;
  periodStart: string;
  periodEnd: string;
  principalDutyTitle: string | null;
  ratingChain: {
    ratedSoldier: { firstName: string; lastName: string; rank: string; mos: string };
    rater: { firstName: string; lastName: string; rank: string };
    seniorRater: { firstName: string; lastName: string; rank: string };
  };
}

export default function EvaluationLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading evaluation...</div>}><EvaluationLayoutContent>{children}</EvaluationLayoutContent></Suspense>;
}

function EvaluationLayoutContent({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [meta, setMeta] = useState<EvalMeta | null>(null);

  // Sign page manages its own full-height layout — no padding wrapper
  const isSignPage = pathname?.endsWith("/sign");
  const assisting = searchParams.get("assisting");

  useEffect(() => {
    if (id) api.get<EvalMeta>(`/evaluations/${id}`).then(setMeta).catch(() => null);
  }, [id]);

  const soldier = meta?.ratingChain?.ratedSoldier;
  const rater = meta?.ratingChain?.rater;
  const sr = meta?.ratingChain?.seniorRater;

  return (
    <div className="flex h-full">
      <div className="w-48 shrink-0 border-r border-border p-4">
        <SectionNav evalId={id} />
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <SoldierHeader
          name={
            soldier ? `${soldier.lastName.toUpperCase()}, ${soldier.firstName}` : "Loading…"
          }
          rank={soldier?.rank ?? ""}
          mos={soldier?.mos ?? ""}
          dutyTitle={meta?.principalDutyTitle ?? "(duty title pending)"}
          periodStart={meta?.periodStart?.slice(0, 10).replace(/-/g, "") ?? ""}
          periodEnd={meta?.periodEnd?.slice(0, 10).replace(/-/g, "") ?? ""}
          rater={rater ? `${rater.rank} ${rater.lastName}` : ""}
          seniorRater={sr ? `${sr.rank} ${sr.lastName}` : ""}
        />
        {assisting && <div className="mx-6 mt-4 rounded-sm border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">You are viewing permitted evaluation details while assisting this rating workflow. Your access is read-only unless an explicit capability grants a separate administrative action. You cannot make ratings, edit narratives, acknowledge, sign, submit, or change the rating chain.</div>}
        <div className={isSignPage ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto p-6"}>{children}</div>
      </div>
    </div>
  );
}

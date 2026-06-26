"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  const params = useParams();
  const id = params.id as string;
  const [meta, setMeta] = useState<EvalMeta | null>(null);

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
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

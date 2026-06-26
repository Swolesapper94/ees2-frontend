"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

interface AdminData {
  id: string;
  formType: string;
  periodStart: string;
  periodEnd: string;
  ratedMonths: number;
  reasonForSubmission: string;
  status: string;
  ratingChain: {
    ratedSoldier: { firstName: string; lastName: string; rank: string; mos: string };
    rater: { firstName: string; lastName: string; rank: string };
    seniorRater: { firstName: string; lastName: string; rank: string };
  };
}

export default function AdminDataPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AdminData>(`/evaluations/${id}`).then(setData).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data) return <p className="text-sm text-red-600">Evaluation not found.</p>;

  const s = data.ratingChain.ratedSoldier;
  const rows = [
    ["Soldier", `${s.rank} ${s.lastName}, ${s.firstName}`],
    ["MOS", s.mos],
    ["Form Type", data.formType.replace(/_/g, "-")],
    ["Period Start", data.periodStart?.slice(0, 10)],
    ["Period End", data.periodEnd?.slice(0, 10)],
    ["Rated Months", String(data.ratedMonths)],
    ["Reason", data.reasonForSubmission],
    ["Status", data.status],
    ["Rater", `${data.ratingChain.rater.rank} ${data.ratingChain.rater.lastName}`],
    ["Senior Rater", `${data.ratingChain.seniorRater.rank} ${data.ratingChain.seniorRater.lastName}`],
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold tracking-tight">Administrative Data</h1>
      <p className="mb-4 text-sm text-muted-foreground">Part I — identity, period, status.</p>

      <div className="rounded-sm border border-border overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-b border-border last:border-0">
                <td className="w-40 bg-muted/30 px-4 py-2 font-medium">{label}</td>
                <td className="px-4 py-2">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Button onClick={() => router.push(`/evaluations/${id}/duty`)}>
          Next: Duty Description →
        </Button>
      </div>
    </div>
  );
}

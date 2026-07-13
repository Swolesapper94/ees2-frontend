"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminData {
  id: string;
  formType: string;
  periodStart: string;
  periodEnd: string;
  ratedMonths: number;
  reasonForSubmission: string;
  status: string;
  nonRatedMonths: number;
  nonRatedCodes: string | null;
  statusCode: string | null;
  numberOfEnclosures: number;
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
  const searchParams = useSearchParams();
  const assisting = searchParams.get("assisting");
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nonRatedMonths, setNonRatedMonths] = useState(0);
  const [nonRatedCodes, setNonRatedCodes] = useState("");
  const [statusCode, setStatusCode] = useState("");
  const [numberOfEnclosures, setNumberOfEnclosures] = useState(0);
  const [returnResponse, setReturnResponse] = useState("");
  const [assistanceMessage, setAssistanceMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    api
      .get<AdminData>(`/evaluations/${id}`)
      .then((evaluation) => {
        if (active) {
          setData(evaluation);
          setNonRatedMonths(evaluation.nonRatedMonths ?? 0);
          setNonRatedCodes(evaluation.nonRatedCodes ?? "");
          setStatusCode(evaluation.statusCode ?? "");
          setNumberOfEnclosures(evaluation.numberOfEnclosures ?? 0);
        }
      })
      .catch(() => {
        if (active) setLoadError("Unable to load this evaluation. Refresh the page after the backend is available.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function saveAdministrativeFields() {
    try {
      const updated = await api.patch<AdminData>(`/evaluations/${id}/administrative-fields`, {
        nonRatedMonths,
        nonRatedCodes: nonRatedCodes || null,
        statusCode: statusCode || null,
        numberOfEnclosures,
      });
      setData((current) => current ? { ...current, ...updated } : current);
      setAssistanceMessage("Administrative fields saved with your helper attribution.");
    } catch {
      setAssistanceMessage("This grant does not permit completing these administrative fields.");
    }
  }

  async function recordReturnResponse() {
    if (!returnResponse.trim()) return;
    try {
      await api.post(`/evaluations/${id}/administrative-return-response`, { note: returnResponse.trim() });
      setReturnResponse("");
      setAssistanceMessage("Administrative response recorded with your helper attribution.");
    } catch {
      setAssistanceMessage("This grant does not permit recording an administrative response.");
    }
  }

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-56" />
      <div className="rounded-sm border border-border overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex border-b border-border last:border-0">
            <div className="w-40 bg-muted/30 px-4 py-2"><Skeleton className="h-4 w-24" /></div>
            <div className="px-4 py-2 flex-1"><Skeleton className="h-4 w-32" /></div>
          </div>
        ))}
      </div>
    </div>
  );
  if (loadError) return <p className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadError}</p>;
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
    ["Non-rated months", String(data.nonRatedMonths ?? 0)],
    ["Non-rated codes", data.nonRatedCodes ?? "—"],
    ["Status code", data.statusCode ?? "—"],
    ["Enclosures", String(data.numberOfEnclosures ?? 0)],
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

      {assisting && <section className="mt-6 rounded-sm border border-blue-200 bg-blue-50 p-4">
        <h2 className="text-sm font-semibold text-blue-950">Scoped administrative assistance</h2>
        <p className="mt-1 text-sm text-blue-900">These clerical fields and the administrative response note are recorded under your identity. This access cannot edit ratings, narratives, dates, signatures, submission, or the rating chain.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Non-rated months<input type="number" min={0} max={99} value={nonRatedMonths} onChange={(event) => setNonRatedMonths(Number(event.target.value))} className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" /></label>
          <label className="text-sm font-medium">Enclosures<input type="number" min={0} max={99} value={numberOfEnclosures} onChange={(event) => setNumberOfEnclosures(Number(event.target.value))} className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" /></label>
          <label className="text-sm font-medium">Non-rated codes<input value={nonRatedCodes} onChange={(event) => setNonRatedCodes(event.target.value)} className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" /></label>
          <label className="text-sm font-medium">Status code<input value={statusCode} onChange={(event) => setStatusCode(event.target.value)} className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" /></label>
        </div>
        <Button className="mt-4" onClick={saveAdministrativeFields}>Save administrative fields</Button>
        <label className="mt-5 block text-sm font-medium">Administrative return response<textarea aria-label="Administrative return response" value={returnResponse} onChange={(event) => setReturnResponse(event.target.value)} rows={3} className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" /></label>
        <Button className="mt-3" variant="outline" disabled={!returnResponse.trim()} onClick={recordReturnResponse}>Record administrative response</Button>
        {assistanceMessage && <p className="mt-3 text-sm text-blue-900">{assistanceMessage}</p>}
      </section>}

      <div className="mt-6">
        <Button onClick={() => router.push(`/evaluations/${id}/duty`)}>
          Next: Duty Description →
        </Button>
      </div>
    </div>
  );
}

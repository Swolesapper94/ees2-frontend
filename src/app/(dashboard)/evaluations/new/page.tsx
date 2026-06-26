"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

interface RatingChain {
  id: string;
  ratedSoldier: { firstName: string; lastName: string; rank: string };
  rater: { firstName: string; lastName: string; rank: string };
  seniorRater: { firstName: string; lastName: string; rank: string };
}

// Map rank to form type
const getRankFormType = (rank: string): "NCOER_9_1" | "NCOER_9_2" | "NCOER_9_3" => {
  if (rank === "SGT") return "NCOER_9_1";
  if (["SSG", "1SG", "MSG"].includes(rank)) return "NCOER_9_2";
  if (["CSM", "SGM"].includes(rank)) return "NCOER_9_3";
  return "NCOER_9_1"; // default
};

export default function NewEvaluationPage() {
  const router = useRouter();
  const [chains, setChains] = useState<RatingChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    ratingChainId: "",
    formType: "NCOER_9_1" as "NCOER_9_1" | "NCOER_9_2" | "NCOER_9_3",
    periodStart: "",
    periodEnd: "",
    ratedMonths: 12,
    reasonForSubmission: "Annual",
  });

  useEffect(() => {
    api
      .get<RatingChain[]>("/rating-chains")
      .then(setChains)
      .catch(() => setError("Could not load rating chains"))
      .finally(() => setLoading(false));
  }, []);

  const handleChainChange = (chainId: string) => {
    const chain = chains.find((c) => c.id === chainId);
    if (chain) {
      const formType = getRankFormType(chain.ratedSoldier.rank);
      setForm({ ...form, ratingChainId: chainId, formType });
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await api.post<{ id: string }>("/evaluations", form);
      router.push(`/evaluations/${created.id}/admin`);
    } catch {
      setError("Failed to create evaluation");
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-lg">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Start NCOER</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Select a soldier — form type auto-populates by rank.
      </p>

      {loading && <p className="text-sm text-muted-foreground">Loading rating chains…</p>}
      {error && (
        <p className="mb-4 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Soldier</label>
            <select
              required
              value={form.ratingChainId}
              onChange={(e) => handleChainChange(e.target.value)}
              className="w-full rounded-sm border border-input bg-background p-2 text-sm"
            >
              <option value="">Select soldier…</option>
              {chains.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ratedSoldier.rank} {c.ratedSoldier.lastName}, {c.ratedSoldier.firstName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Form Type</label>
            <div className="w-full rounded-sm border border-input bg-muted p-2 text-sm text-muted-foreground">
              {form.formType === "NCOER_9_1" && "DA 2166-9-1 (SGT)"}
              {form.formType === "NCOER_9_2" && "DA 2166-9-2 (SSG–1SG/MSG)"}
              {form.formType === "NCOER_9_3" && "DA 2166-9-3 (CSM/SGM)"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Period Start</label>
              <input
                type="date"
                required
                value={form.periodStart}
                onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                className="w-full rounded-sm border border-input bg-background p-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Period End</label>
              <input
                type="date"
                required
                value={form.periodEnd}
                onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                className="w-full rounded-sm border border-input bg-background p-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Rated Months</label>
            <input
              type="number"
              min="1"
              max="12"
              value={form.ratedMonths}
              onChange={(e) => setForm({ ...form, ratedMonths: parseInt(e.target.value) })}
              className="w-full rounded-sm border border-input bg-background p-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Reason for Submission</label>
            <select
              value={form.reasonForSubmission}
              onChange={(e) => setForm({ ...form, reasonForSubmission: e.target.value })}
              className="w-full rounded-sm border border-input bg-background p-2 text-sm"
            >
              <option>Annual</option>
              <option>Change of Rater</option>
              <option>Relief for Cause</option>
              <option>Senior Rater Option</option>
              <option>Promotion</option>
              <option>Retirement</option>
              <option>Separation</option>
            </select>
          </div>

          <Button
            type="submit"
            disabled={submitting || !form.ratingChainId}
            className="w-full bg-military-green hover:bg-military-green/90"
          >
            {submitting ? "Creating…" : "Create NCOER"}
          </Button>
        </form>
      )}
    </div>
  );
}

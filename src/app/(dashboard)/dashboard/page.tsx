"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api/client";

interface Evaluation {
  id: string;
  ratedSoldierName: string;
  ratedSoldierRank: string;
  formType: "NCOER_9_1" | "NCOER_9_2" | "NCOER_9_3";
  status: "DRAFT" | "RATER_COMPLETE" | "SENIOR_RATER_COMPLETE" | "REVIEWER_COMPLETE" | "SIGNED";
  periodStart: string;
  periodEnd: string;
}

const statusBadgeColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  RATER_COMPLETE: "bg-blue-100 text-blue-800",
  SENIOR_RATER_COMPLETE: "bg-purple-100 text-purple-800",
  REVIEWER_COMPLETE: "bg-amber-100 text-amber-800",
  SIGNED: "bg-green-100 text-green-800",
};

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  RATER_COMPLETE: "Rater Complete",
  SENIOR_RATER_COMPLETE: "Senior Rater Complete",
  REVIEWER_COMPLETE: "Reviewer Complete",
  SIGNED: "Signed",
};

export default function DashboardPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Evaluation[]>("/evaluations")
      .then(setEvaluations)
      .catch((err) => {
        console.error("Failed to load evaluations:", err);
        setError("Could not load evaluations");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Loading evaluations…</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Formation evaluation status overview.
      </p>

      {error && (
        <p className="mb-4 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {evaluations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No evaluations yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {evaluations.map((item) => (
            <Link key={item.id} href={`/evaluations/${item.id}/admin`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">
                    {item.ratedSoldierRank} {item.ratedSoldierName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${statusBadgeColor[item.status] || "bg-gray-100 text-gray-800"}`}>
                      {statusLabel[item.status] || item.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.formType === "NCOER_9_1" && "DA 2166-9-1"}
                    {item.formType === "NCOER_9_2" && "DA 2166-9-2"}
                    {item.formType === "NCOER_9_3" && "DA 2166-9-3"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

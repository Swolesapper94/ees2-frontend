"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EvalCreationWizard } from "@/components/evaluation/EvalCreationWizard";
import { SoldierInitWizard } from "@/components/evaluation/SoldierInitWizard";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";

interface RatingChain {
  id: string;
  ratedSoldier: {
    id: string;
    firstName: string;
    lastName: string;
    rank: string;
    mos: string;
  };
  rater: { firstName: string; lastName: string; rank: string };
  seniorRater: { firstName: string; lastName: string; rank: string };
  ratingSchemeAssignmentId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

type Mode = "choose" | "soldier" | "rater";

export default function NewEvaluationPage() {
  return <Suspense fallback={<div className="p-6">Loading...</div>}><NewEvaluationPageContent /></Suspense>;
}

function NewEvaluationPageContent() {
  const params = useSearchParams();
  const prefillChainId = params.get("chainId") ?? undefined;
  const forceMode = params.get("mode") as Mode | null;

  const [mode, setMode] = useState<Mode>(forceMode ?? "choose");
  const [chains, setChains] = useState<RatingChain[]>([]);
  const [chainsLoading, setChainsLoading] = useState(true);

  useEffect(() => {
    api
      .get<RatingChain[]>("/rating-chains?purpose=evaluation-creation&role=soldier")
      .then(setChains)
      .catch(() => {})
      .finally(() => setChainsLoading(false));
  }, []);

  return (
      <NewEvaluationExperience
        mode={mode}
        setMode={setMode}
        chains={chains}
        chainsLoading={chainsLoading}
        prefillChainId={prefillChainId}
      />
  );
}

interface NewEvaluationExperienceProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  chains: RatingChain[];
  chainsLoading: boolean;
  prefillChainId?: string;
}

function NewEvaluationExperience({
  mode,
  setMode,
  chains,
  chainsLoading,
  prefillChainId,
}: NewEvaluationExperienceProps) {

  if (mode === "rater") {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Start New Evaluation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Creates the evaluation record and auto-generates AR 623-3 milestones.
          </p>
        </div>
        <EvalCreationWizard
          prefillChainId={prefillChainId}
          onCancel={() => setMode("choose")}
        />
      </div>
    );
  }

  if (mode === "soldier") {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Initiate My Evaluation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Confirm your rating period after your finalized support form is ready.
            Your rater will be notified to begin Part IV.
          </p>
        </div>
        {chainsLoading ? (
          <p className="text-sm text-muted-foreground">Loading rating chains…</p>
        ) : (
          <SoldierInitWizard
            chains={chains}
            myChainId={prefillChainId}
            onCancel={() => setMode("choose")}
          />
        )}
      </div>
    );
  }

  // Mode chooser
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Start Evaluation</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Who is initiating this evaluation?
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
        <button
          type="button"
          onClick={() => setMode("soldier")}
          className={cn(
            "group rounded-lg border-2 border-border p-5 text-left transition-all",
            "hover:border-[#1A3010] hover:bg-[#1A3010]/5",
          )}
        >
          <div className="mb-2 text-2xl">🪖</div>
          <h3 className="font-semibold text-sm">I&apos;m the Rated Soldier</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Initiate your own evaluation after your finalized support form is ready.
            Your rater will be notified.
          </p>
          <p className="mt-2 text-xs font-medium text-[#1A3010]">
            Soldier-Initiated (AR 623-3 §3-12) →
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode("rater")}
          className={cn(
            "group rounded-lg border-2 border-border p-5 text-left transition-all",
            "hover:border-[#1A3010] hover:bg-[#1A3010]/5",
          )}
        >
          <div className="mb-2 text-2xl">📋</div>
          <h3 className="font-semibold text-sm">I&apos;m the Rater / Admin</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Create the evaluation for a soldier in your rating chain.
            Full wizard with all form options.
          </p>
          <p className="mt-2 text-xs font-medium text-[#1A3010]">
            Rater-Initiated →
          </p>
        </button>
      </div>
    </div>
  );
}


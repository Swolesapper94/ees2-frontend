import type { ReturnReason } from "@/types/evaluation";

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  ADMIN_ERROR: "Administrative error",
  PROHIBITED_LANGUAGE: "Prohibited language",
  MISSING_SIGNATURE: "Missing signature",
  RATING_PERIOD_ERROR: "Rating period error",
  OTHER: "Other",
};

export function formatReturnReason(reason: ReturnReason): string {
  return RETURN_REASON_LABELS[reason] ?? reason.replace(/_/g, " ").toLowerCase();
}

export function latestReturn<T extends { returnedAt: string }>(returns?: T[]): T | undefined {
  return returns?.slice().sort((a, b) => Date.parse(b.returnedAt) - Date.parse(a.returnedAt))[0];
}

import { mutate as globalMutate } from "swr";

export const AUTH_CHANGED_EVENT = "ees-auth-changed";

type ApiCacheKey = ["api", string, string];

function isApiKey(key: unknown): key is ApiCacheKey {
  return Array.isArray(key) && key[0] === "api" && typeof key[2] === "string";
}

export function notifyAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export async function clearClientApiCache(): Promise<void> {
  await globalMutate((key) => isApiKey(key), undefined, { revalidate: false });
}

function matchesPath(path: string, exact: string[], prefixes: string[]): boolean {
  return exact.includes(path) || prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`));
}

export async function invalidateApiCache(options: {
  exact?: string[];
  prefixes?: string[];
}): Promise<void> {
  const exact = options.exact ?? [];
  const prefixes = options.prefixes ?? [];
  await globalMutate((key) => isApiKey(key) && matchesPath(key[2], exact, prefixes));
}

export async function invalidateDashboardCache(): Promise<void> {
  await invalidateApiCache({
    exact: [
      "/dashboard",
      "/dashboard/analytics",
      "/dashboard/hrc-trend",
      "/dashboard/due-windows",
      "/dashboard/chain-velocity",
      "/dashboard/counseling",
      "/dashboard/returns",
      "/dashboard/sr-profile",
      "/dashboard/my-history",
    ],
  });
}

export async function invalidateEvaluationCache(evaluationId?: string): Promise<void> {
  await invalidateApiCache({
    exact: [
      "/dashboard",
      "/dashboard/analytics",
      "/dashboard/hrc-trend",
      "/dashboard/due-windows",
      "/dashboard/chain-velocity",
      "/dashboard/counseling",
      "/dashboard/returns",
      "/dashboard/sr-profile",
      "/dashboard/my-history",
      "/evaluations",
      "/evaluations?role=rater",
      "/evaluations?role=soldier",
      ...(evaluationId ? [`/evaluations/${evaluationId}`] : []),
    ],
    prefixes: evaluationId ? [`/evaluations/${evaluationId}/`, `/support-form-uploads/${evaluationId}`] : [],
  });
}

export async function invalidateSupportFormCache(): Promise<void> {
  await invalidateApiCache({
    exact: ["/dashboard", "/support-forms"],
    prefixes: ["/support-forms/"],
  });
}

export async function invalidateAfterMutation(path: string): Promise<void> {
  const evaluationMatch = path.match(/^\/evaluations\/([^/]+)/);
  const uploadEvalMatch = path.match(/^\/support-form-uploads\/([^/]+)/);

  if (evaluationMatch?.[1]) {
    await invalidateEvaluationCache(evaluationMatch[1]);
    return;
  }
  if (uploadEvalMatch?.[1]) {
    await invalidateEvaluationCache(uploadEvalMatch[1]);
    return;
  }
  if (path.startsWith("/support-forms")) {
    await invalidateSupportFormCache();
    return;
  }
  if (path.startsWith("/milestones")) {
    await invalidateDashboardCache();
    return;
  }
  if (path.startsWith("/notifications")) {
    await invalidateApiCache({ exact: ["/notifications"] });
  }
}

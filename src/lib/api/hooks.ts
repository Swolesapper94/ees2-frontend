import { useEffect, useState } from "react";
import useSWR, { type SWRConfiguration } from "swr";
import { AUTH_CHANGED_EVENT } from "./cache";
import { api, ApiError, currentDevAuthCacheScope, getAuthCacheScope } from "./client";

/**
 * Custom SWR hook for API GET requests with automatic caching.
 * 
 * Features:
 * - Caches responses by key (URL path) in memory
 * - Shows cached data instantly on revisits, revalidates in background
 * - Dedupes simultaneous requests to the same endpoint
 * - Auto-revalidates on window focus/reconnect
 * - Optional automatic revalidation interval
 * 
 * Usage:
 *   const { data, error, isLoading, mutate } = useApiGet<User>("/users/me");
 *   
 *   // Manually trigger refetch:
 *   mutate();
 */
export function useApiGet<T>(
  path: string | null,
  options?: {
    revalidateOnFocus?: boolean; // default true
    fallbackData?: T;
    refreshInterval?: number;
  }
) {
  const [authScope, setAuthScope] = useState(currentDevAuthCacheScope);

  useEffect(() => {
    let cancelled = false;
    void getAuthCacheScope().then((scope) => {
      if (!cancelled) setAuthScope(scope);
    });
    const refreshScope = () => {
      void getAuthCacheScope().then(setAuthScope);
    };
    window.addEventListener(AUTH_CHANGED_EVENT, refreshScope);
    window.addEventListener("storage", refreshScope);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGED_EVENT, refreshScope);
      window.removeEventListener("storage", refreshScope);
    };
  }, []);

  const config: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: options?.revalidateOnFocus ?? true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000, // Dedupe within 2s
    focusThrottleInterval: 5000, // Wait 5s between focus revalidations
    fallbackData: options?.fallbackData,
    refreshInterval: options?.refreshInterval,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  };

  const { data, error, isLoading, mutate } = useSWR(
    path ? ["api", authScope, path] : null,
    ([, , url]: ["api", string, string]) => api.get<T>(url),
    config
  );

  return {
    data,
    error: error instanceof ApiError ? error : undefined,
    isLoading,
    mutate,
  };
}

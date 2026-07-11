import useSWR, { type SWRConfiguration } from "swr";
import { api, ApiError } from "./client";

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
  }
) {
  const config: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: options?.revalidateOnFocus ?? true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000, // Dedupe within 2s
    focusThrottleInterval: 5000, // Wait 5s between focus revalidations
    fallbackData: options?.fallbackData,
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  };

  const { data, error, isLoading, mutate } = useSWR(
    path,
    path ? (url: string) => api.get<T>(url) : null,
    config
  );

  return {
    data,
    error: error instanceof ApiError ? error : undefined,
    isLoading,
    mutate,
  };
}

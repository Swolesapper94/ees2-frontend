import { createClient } from "@/lib/supabase/client";
import { invalidateAfterMutation } from "./cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function currentDevAuthCacheScope(): string {
  if (typeof window === "undefined") return "server";
  return localStorage.getItem("devAuth") ?? "anonymous";
}

export async function getAuthCacheScope(): Promise<string> {
  if (typeof window !== "undefined") {
    const devAuth = localStorage.getItem("devAuth");
    if (devAuth) return devAuth;
  }

  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user?.id ? `supabase:${session.user.id}` : "anonymous";
  } catch {
    return "anonymous";
  }
}

async function authHeader(): Promise<Record<string, string>> {
  // Dev mode: use stored dev credentials if present
  if (typeof window !== "undefined") {
    const devAuth = localStorage.getItem("devAuth");
    if (devAuth) return { Authorization: devAuth };
  }

  // Try to get Supabase session, but gracefully handle if not available
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  } catch {
    // Supabase not configured; return empty headers (dev mode relies on devAuth)
    return {};
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

const GET_CACHE_TTL_MS = 30_000;

type CachedGet = {
  expiresAt: number;
  value: unknown;
};

const getCache = new Map<string, CachedGet>();
const inflightGets = new Map<string, Promise<unknown>>();

function cacheKey(path: string, headers: Record<string, string>): string {
  return `${headers.Authorization ?? "anonymous"} ${path}`;
}

function clearGetCache(): void {
  getCache.clear();
  inflightGets.clear();
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(await authHeader()),
  };

  const key = method === "GET" && !opts.signal ? cacheKey(path, headers) : null;
  if (key) {
    const cached = getCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;

    const inflight = inflightGets.get(key);
    if (inflight) return inflight as Promise<T>;
  }

  const fetchPromise = (async () => {
    const res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      let details: unknown;
      try {
        details = await res.json();
      } catch {
        details = await res.text();
      }
      throw new ApiError(res.status, `Request failed: ${res.status}`, details);
    }

    if (method !== "GET") {
      clearGetCache();
      void invalidateAfterMutation(path);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  })();

  if (key) {
    inflightGets.set(key, fetchPromise);
    try {
      const value = await fetchPromise;
      getCache.set(key, { value, expiresAt: Date.now() + GET_CACHE_TTL_MS });
      return value;
    } finally {
      inflightGets.delete(key);
    }
  }

  return fetchPromise;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  /** Multipart file upload — bypasses the JSON content-type header. */
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const headers: Record<string, string> = { ...(await authHeader()) };
    const res = await fetch(`${API_URL}/api${path}`, {
      method: "POST",
      headers,
      body: formData,
      cache: "no-store",
    });
    if (!res.ok) {
      let details: unknown;
      try { details = await res.json(); } catch { details = await res.text(); }
      throw new ApiError(res.status, `Upload failed: ${res.status}`, details);
    }
    const data = (await res.json()) as T;
    void invalidateAfterMutation(path);
    return data;
  },

  /** Authenticated binary fetch for documents that cannot be opened as a public URL. */
  blob: async (path: string): Promise<Blob> => {
    const res = await fetch(`${API_URL}/api${path}`, { headers: await authHeader(), cache: "no-store" });
    if (!res.ok) throw new ApiError(res.status, `Request failed: ${res.status}`);
    return res.blob();
  },

  // Returns the absolute URL for binary downloads (PDF).
  pdfUrl: (evaluationId: string) =>
    `${API_URL}/api/pdf/evaluations/${evaluationId}`,
};

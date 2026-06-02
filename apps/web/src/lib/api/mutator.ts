export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8090";

export type ApiError = Error & {
  status: number;
  detail?: unknown;
};

/**
 * Single fetch wrapper used by every orval-generated client function.
 *
 * Responsibilities:
 *  - Prefix relative paths with NEXT_PUBLIC_BACKEND_URL
 *  - Parse the JSON body (or return undefined for 204)
 *  - Throw a typed `ApiError` carrying FastAPI's `{ detail }` payload on non-2xx,
 *    so React Query's `error` is a usable shape across the app.
 */
export const customFetch = async <T>(
  url: string,
  init: RequestInit = {},
): Promise<T> => {
  const response = await fetch(
    url.startsWith("http") ? url : `${BACKEND_URL}${url}`,
    init,
  );

  if (!response.ok) {
    let payload: unknown = undefined;
    try {
      payload = await response.json();
    } catch {
      payload = await response.text().catch(() => "");
    }
    const error = new Error(`HTTP ${response.status}`) as ApiError;
    error.status = response.status;
    error.detail =
      payload && typeof payload === "object" && "detail" in payload
        ? (payload as { detail: unknown }).detail
        : payload;
    throw error;
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as T;
};

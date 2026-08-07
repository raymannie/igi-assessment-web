import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query/react";

import { isPublicRoute } from "@/lib/routes";
import { clearSessionHint, markSessionHint } from "@/lib/session-hint";
import { loggedOut, tokenReceived } from "@/store/slices/authSlice";
import type {
  ApiEnvelope,
  ApiErrorEnvelope,
  NormalizedApiError,
  Paginated,
  PaginationMeta,
} from "@/types";
// Type-only: erased at compile time, so this does not create an import cycle
// with `store/index.ts`, which imports this module for its reducer.
import type { RootState } from "@/store";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL && process.env.NODE_ENV !== "production") {
  console.warn(
    "[baseApi] NEXT_PUBLIC_API_URL is not set — every request will resolve against the current origin."
  );
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  // Carries the httpOnly refresh cookie on same-site and cross-origin calls.
  // The backend must answer with sameSite=none; secure and CORS credentials.
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set("authorization", `Bearer ${token}`);
    // Content-Type is deliberately never set here: fetchBaseQuery adds JSON for
    // plain objects and leaves FormData alone so the browser can set the
    // multipart boundary itself.
    return headers;
  },
});

// ---------------------------------------------------------------------------
// Error normalisation
// ---------------------------------------------------------------------------

function isApiErrorEnvelope(body: unknown): body is ApiErrorEnvelope {
  if (typeof body !== "object" || body === null) return false;
  const candidate = body as { error?: unknown };
  if (typeof candidate.error !== "object" || candidate.error === null) {
    return false;
  }
  const error = candidate.error as { code?: unknown; message?: unknown };
  return typeof error.code === "string" && typeof error.message === "string";
}

const CODE_BY_STATUS: Record<number, string> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "INVALID_TRANSITION",
  413: "FILE_TOO_LARGE",
  415: "UNSUPPORTED_FILE_TYPE",
};

/**
 * Collapses every failure mode — API error envelope, bare HTTP status, network
 * failure, timeout, unparseable body — into one shape so components can render
 * `error.message` without narrowing.
 */
function normalizeError(error: FetchBaseQueryError): NormalizedApiError {
  if (typeof error.status === "number") {
    if (isApiErrorEnvelope(error.data)) {
      return {
        code: error.data.error.code,
        message: error.data.error.message,
        details: error.data.error.details ?? [],
        status: error.status,
      };
    }

    return {
      code: CODE_BY_STATUS[error.status] ?? "INTERNAL_ERROR",
      message:
        error.status >= 500
          ? "Something went wrong on our side. Please try again."
          : "That request could not be completed.",
      details: [],
      status: error.status,
    };
  }

  switch (error.status) {
    case "FETCH_ERROR":
      return {
        code: "NETWORK_ERROR",
        message: "Could not reach the server. Check your connection.",
        details: [],
      };
    case "TIMEOUT_ERROR":
      return {
        code: "TIMEOUT",
        message: "The server took too long to respond. Please try again.",
        details: [],
      };
    case "PARSING_ERROR":
      return {
        code: "INTERNAL_ERROR",
        message: "The server sent a response we could not read.",
        details: [],
        status: error.originalStatus,
      };
    default:
      return {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again.",
        details: [],
      };
  }
}

// ---------------------------------------------------------------------------
// Reauth
// ---------------------------------------------------------------------------

/** Routes that must never trigger a refresh attempt, or we'd loop. */
const NO_REAUTH_PATHS = [
  "/auth/refresh",
  "/auth/login",
  "/auth/register",
  "/auth/logout",
];

function urlOf(args: string | FetchArgs): string {
  return typeof args === "string" ? args : args.url;
}

/**
 * Single in-flight refresh, shared by every caller. Without this, N parallel
 * 401s fire N refresh calls — and because the backend rotates the refresh token
 * on each one, all but the winner would invalidate the session.
 */
let refreshPromise: Promise<boolean> | null = null;

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  NormalizedApiError,
  object,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const shouldReauth =
    result.error?.status === 401 &&
    !NO_REAUTH_PATHS.some((path) => urlOf(args).startsWith(path));

  if (shouldReauth) {
    refreshPromise ??= (async () => {
      const refresh = await rawBaseQuery(
        { url: "/auth/refresh", method: "POST" },
        api,
        extraOptions
      );

      const token = readAccessToken(refresh.data);
      if (!token) {
        clearSessionHint();
        return false;
      }

      api.dispatch(tokenReceived(token));
      markSessionHint();
      return true;
    })().finally(() => {
      refreshPromise = null;
    });

    const refreshed = await refreshPromise;

    if (refreshed) {
      // prepareHeaders re-reads the store, so the retry carries the new token.
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(loggedOut());
      redirectToLogin();
    }
  }

  return result.error
    ? { ...result, error: normalizeError(result.error) }
    : { ...result, error: undefined, data: result.data };
};

function readAccessToken(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const data = (body as { data?: unknown }).data;
  if (typeof data !== "object" || data === null) return null;
  const token = (data as { accessToken?: unknown }).accessToken;
  return typeof token === "string" && token.length > 0 ? token : null;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  // Already on a public route (e.g. the anonymous `getMe` on /login) — the
  // silent 401 is expected there, so don't bounce the user around.
  if (isPublicRoute(window.location.pathname)) return;

  const next = encodeURIComponent(
    `${window.location.pathname}${window.location.search}`
  );
  window.location.replace(`/login?next=${next}`);
}

// ---------------------------------------------------------------------------
// Envelope unwrapping — components never see { success, data, meta }
// ---------------------------------------------------------------------------

export function unwrap<T>(response: ApiEnvelope<T>): T {
  return response.data;
}

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: 0,
  total: 0,
  totalPages: 0,
};

export function unwrapPaginated<T>(
  response: ApiEnvelope<T[], PaginationMeta>
): Paginated<T> {
  const items = response.data ?? [];
  return {
    items,
    meta: response.meta ?? { ...EMPTY_META, limit: items.length, total: items.length, totalPages: items.length ? 1 : 0 },
  };
}

// ---------------------------------------------------------------------------
// The one and only createApi
// ---------------------------------------------------------------------------

/**
 * Feature APIs extend this with `baseApi.injectEndpoints()`. Never call
 * `createApi` a second time — a second instance means a second cache, a second
 * middleware, and invalidation that silently does nothing across the boundary.
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Request", "RequestList", "AuditLog", "Stats", "Me"],
  endpoints: () => ({}),
});

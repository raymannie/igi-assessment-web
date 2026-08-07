"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { REQUEST_STATUSES } from "@/lib/constants/statuses";
import type { RequestListParams, RequestStatus } from "@/types";

export const PAGE_SIZE = 10;

export interface RequestFilters {
  status: RequestStatus[];
  search: string;
  page: number;
}

function parseFilters(params: URLSearchParams): RequestFilters {
  const status = params
    .getAll("status")
    .filter((value): value is RequestStatus =>
      (REQUEST_STATUSES as string[]).includes(value)
    )
    // Sorted so the RTK Query cache key is stable regardless of click order.
    .sort();

  const page = Number(params.get("page") ?? "1");

  return {
    status: [...new Set(status)],
    search: params.get("search")?.trim() ?? "",
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
  };
}

function serialize(filters: RequestFilters): string {
  const params = new URLSearchParams();
  for (const status of filters.status) params.append("status", status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params.toString();
}

/**
 * Filter state lives in the URL, not in component state: the queue survives a
 * reload, is shareable, and RTK Query refetches automatically because the derived
 * query arg is part of the cache key.
 */
export function useRequestFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const setFilters = useCallback(
    (patch: Partial<RequestFilters>) => {
      const next: RequestFilters = { ...filters, ...patch };
      // Any change other than paging returns to page 1 — staying on page 4 of a
      // freshly narrowed result set shows an empty table.
      if (patch.page === undefined) next.page = 1;

      const query = serialize(next);
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [filters, pathname, router]
  );

  const toggleStatus = useCallback(
    (status: RequestStatus) => {
      const active = filters.status.includes(status);
      setFilters({
        status: active
          ? filters.status.filter((value) => value !== status)
          : [...filters.status, status].sort(),
      });
    },
    [filters.status, setFilters]
  );

  const clear = useCallback(
    () => setFilters({ status: [], search: "", page: 1 }),
    [setFilters]
  );

  /** The serialisable arg handed straight to `useGetRequestsQuery`. */
  const queryArg = useMemo<RequestListParams>(
    () => ({
      status: filters.status.length ? filters.status : undefined,
      search: filters.search || undefined,
      page: filters.page,
      limit: PAGE_SIZE,
    }),
    [filters]
  );

  const isFiltered = filters.status.length > 0 || filters.search.length > 0;

  return { filters, setFilters, toggleStatus, clear, queryArg, isFiltered };
}

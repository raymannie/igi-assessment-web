"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import {
  PRODUCT_CATEGORY_OPTIONS,
  REQUEST_STATUSES,
  REQUEST_TYPE_OPTIONS,
} from "@/lib/constants/statuses";
import type {
  ProductCategory,
  RequestListParams,
  RequestStatus,
  RequestType,
} from "@/types";

export const OFFICER_PAGE_SIZE = 10;

export interface OfficerFilters {
  status: RequestStatus[];
  requestType: RequestType | "";
  productCategory: ProductCategory | "";
  dateFrom: string;
  dateTo: string;
  assignedToMe: boolean;
  search: string;
  page: number;
}

const EMPTY: OfficerFilters = {
  status: [],
  requestType: "",
  productCategory: "",
  dateFrom: "",
  dateTo: "",
  assignedToMe: false,
  search: "",
  page: 1,
};

function parse(params: URLSearchParams): OfficerFilters {
  const status = params
    .getAll("status")
    .filter((value): value is RequestStatus =>
      (REQUEST_STATUSES as string[]).includes(value)
    )
    // Sorted so the RTK Query cache key is stable regardless of click order.
    .sort();

  const requestType = params.get("requestType") ?? "";
  const productCategory = params.get("productCategory") ?? "";
  const page = Number(params.get("page") ?? "1");

  return {
    status: [...new Set(status)],
    requestType: REQUEST_TYPE_OPTIONS.some((o) => o.value === requestType)
      ? (requestType as RequestType)
      : "",
    productCategory: PRODUCT_CATEGORY_OPTIONS.some(
      (o) => o.value === productCategory
    )
      ? (productCategory as ProductCategory)
      : "",
    dateFrom: params.get("dateFrom") ?? "",
    dateTo: params.get("dateTo") ?? "",
    assignedToMe: params.get("assignedToMe") === "true",
    search: params.get("search")?.trim() ?? "",
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
  };
}

function serialize(filters: OfficerFilters): string {
  const params = new URLSearchParams();
  for (const status of filters.status) params.append("status", status);
  if (filters.requestType) params.set("requestType", filters.requestType);
  if (filters.productCategory)
    params.set("productCategory", filters.productCategory);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.assignedToMe) params.set("assignedToMe", "true");
  if (filters.search) params.set("search", filters.search);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params.toString();
}

/**
 * The officer queue's filter state, held in the URL so a refresh keeps the view
 * and the link can be pasted to a colleague. The RTK Query arg is derived from
 * it, which is what makes filter changes refetch on their own.
 */
export function useOfficerFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parse(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const setFilters = useCallback(
    (patch: Partial<OfficerFilters>) => {
      const next: OfficerFilters = { ...filters, ...patch };
      // Any change other than paging returns to page 1 — page 4 of a narrower
      // result set is usually empty.
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

  const clear = useCallback(() => setFilters({ ...EMPTY }), [setFilters]);

  const queryArg = useMemo<RequestListParams>(
    () => ({
      status: filters.status.length ? filters.status : undefined,
      requestType: filters.requestType || undefined,
      productCategory: filters.productCategory || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      assignedToMe: filters.assignedToMe || undefined,
      search: filters.search || undefined,
      page: filters.page,
      limit: OFFICER_PAGE_SIZE,
    }),
    [filters]
  );

  const activeCount =
    filters.status.length +
    (filters.requestType ? 1 : 0) +
    (filters.productCategory ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.assignedToMe ? 1 : 0) +
    (filters.search ? 1 : 0);

  return {
    filters,
    setFilters,
    toggleStatus,
    clear,
    queryArg,
    activeCount,
    isFiltered: activeCount > 0,
  };
}

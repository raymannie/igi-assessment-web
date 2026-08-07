"use client";

import { FilePlusIcon, TrayIcon } from "@phosphor-icons/react";
import { ButtonLink } from "@/components/common/button-link";
import { Pagination } from "@/components/common/pagination";
import {
  CardListSkeleton,
  EmptyState,
  ErrorState,
  RefetchingBar,
  TableSkeleton,
} from "@/components/common/states";
import { FilterBar } from "@/components/requests/filter-bar";
import { RequestCard } from "@/components/requests/request-card";
import { RequestTable } from "@/components/requests/request-table";
import { Button } from "@/components/ui/button";
import { useRequestFilters } from "@/hooks/use-request-filters";
import { useGetRequestsQuery } from "@/store/api/requestsApi";

/**
 * The customer's request list. Handles all four states from CLAUDE.md rule 7:
 * `isLoading` skeleton, `isFetching` bar, `isError` with a retry wired to
 * `refetch`, and an empty state that distinguishes "no requests yet" from
 * "no matches for these filters".
 */
export function RequestListView() {
  const { filters, setFilters, toggleStatus, clear, queryArg, isFiltered } =
    useRequestFilters();

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetRequestsQuery(queryArg);

  const requests = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-base font-medium tracking-tight">
            My requests
          </h1>
          <p className="text-xs text-muted-foreground">
            Claims and pre-authorizations you have submitted.
          </p>
        </div>
        <ButtonLink href="/requests/new" size="sm">
          <FilePlusIcon aria-hidden />
          New request
        </ButtonLink>
      </div>

      <FilterBar
        search={filters.search}
        statuses={filters.status}
        onSearchChange={(search) => setFilters({ search })}
        onToggleStatus={toggleStatus}
        onClear={clear}
        isFiltered={isFiltered}
      />

      <div className="border">
        {/* Background refetches get a hairline bar, not a skeleton. */}
        <RefetchingBar active={isFetching && !isLoading} />

        {isLoading ? (
          <>
            <div className="hidden md:block">
              <TableSkeleton />
            </div>
            <div className="p-2 md:hidden">
              <CardListSkeleton />
            </div>
          </>
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : requests.length === 0 ? (
          isFiltered ? (
            <EmptyState
              icon={<TrayIcon className="size-6" aria-hidden />}
              title="No requests match these filters"
              description="Try clearing the status filters or your search term."
              action={
                <Button variant="outline" size="sm" onClick={clear}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<TrayIcon className="size-6" aria-hidden />}
              title="No requests yet"
              description="Submit a claim or a pre-authorization request and track it here."
              action={
                <ButtonLink href="/requests/new" size="sm">
                  <FilePlusIcon aria-hidden />
                  New request
                </ButtonLink>
              }
            />
          )
        ) : (
          <>
            {/* Table on md+, stacked cards below — SPEC's responsive line item. */}
            <div className="hidden md:block">
              <RequestTable requests={requests} />
            </div>
            <div className="grid gap-3 p-2 sm:grid-cols-2 md:hidden">
              {requests.map((request) => (
                <RequestCard key={request._id} request={request} />
              ))}
            </div>

            {data ? (
              <Pagination
                meta={data.meta}
                disabled={isFetching}
                onPageChange={(page) => setFilters({ page })}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

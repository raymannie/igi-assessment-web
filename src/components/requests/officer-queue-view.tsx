"use client";

import { ArrowClockwiseIcon, TrayIcon } from "@phosphor-icons/react";

import { Pagination } from "@/components/common/pagination";
import {
  CardListSkeleton,
  EmptyState,
  ErrorState,
  RefetchingBar,
  TableSkeleton,
} from "@/components/common/states";
import { OfficerFilterBar } from "@/components/requests/officer-filter-bar";
import { OfficerRequestCard } from "@/components/requests/officer-request-card";
import { OfficerRequestTable } from "@/components/requests/officer-request-table";
import { Button } from "@/components/ui/button";
import { useOfficerFilters } from "@/hooks/use-officer-filters";
import { useGetRequestsQuery } from "@/store/api/requestsApi";
import type { User } from "@/types";

/**
 * The officer queue. Same four-state contract as the customer list, plus the
 * richer filter set and an inline assign action where SPEC §3 allows it.
 */
export function OfficerQueueView({ officer }: { officer: User }) {
  const {
    filters,
    setFilters,
    toggleStatus,
    clear,
    queryArg,
    isFiltered,
    activeCount,
  } = useOfficerFilters();

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetRequestsQuery(queryArg);

  const requests = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-base font-medium tracking-tight">
            Request queue
          </h1>
          <p className="text-xs text-muted-foreground">
            Every claim and pre-authorization across all customers.
          </p>
        </div>
        {data ? (
          <p className="text-xs text-muted-foreground">
            {data.meta.total} request{data.meta.total === 1 ? "" : "s"}
            {isFiltered ? " matching" : ""}
          </p>
        ) : null}
      </div>

      <OfficerFilterBar
        filters={filters}
        setFilters={setFilters}
        onToggleStatus={toggleStatus}
        onClear={clear}
        isFiltered={isFiltered}
        activeCount={activeCount}
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
          <EmptyState
            icon={<TrayIcon className="size-6" aria-hidden />}
            title={
              isFiltered
                ? "No requests match these filters"
                : "The queue is empty"
            }
            description={
              isFiltered
                ? "Try widening the status selection, clearing the date range, or turning off “assigned to me”."
                : "Nothing has been submitted yet."
            }
            action={
              isFiltered ? (
                <Button variant="outline" size="sm" onClick={clear}>
                  Clear filters
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isFetching}
                  onClick={() => refetch()}
                >
                  <ArrowClockwiseIcon
                    className={isFetching ? "animate-spin" : undefined}
                    aria-hidden
                  />
                  Check again
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Table on md+, stacked cards below. */}
            <div className="hidden md:block">
              <OfficerRequestTable
                requests={requests}
                officerId={officer._id}
              />
            </div>
            <div className="grid gap-3 p-2 sm:grid-cols-2 md:hidden">
              {requests.map((request) => (
                <OfficerRequestCard
                  key={request._id}
                  request={request}
                  officerId={officer._id}
                />
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

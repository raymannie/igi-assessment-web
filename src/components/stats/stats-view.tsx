"use client";

import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  CoinsIcon,
  TrayIcon,
  StackIcon,
  UserFocusIcon,
} from "@phosphor-icons/react";

import { ErrorState, RefetchingBar } from "@/components/common/states";
import { StatCard } from "@/components/stats/stat-card";
import { StatusBreakdown } from "@/components/stats/status-breakdown";
import { TypeSplit } from "@/components/stats/type-split";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { useGetStatsQuery } from "@/store/api/dashboardApi";
import type { User } from "@/types";

function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function StatsView({ officer }: { officer: User }) {
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetStatsQuery();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-base font-medium tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">
            Queue metrics across all customers. Every figure links through to the
            matching requests.
          </p>
        </div>
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
          Refresh
        </Button>
      </div>

      <RefetchingBar active={isFetching && !isLoading} />

      {isLoading ? (
        <StatsSkeleton />
      ) : isError || !data ? (
        <div className="border">
          <ErrorState error={error} onRetry={refetch} />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total requests"
              value={String(data.totalRequests)}
              icon={StackIcon}
              href="/officer"
              hint="Across every status and customer"
            />
            <StatCard
              label="Pending assignment"
              value={String(data.pendingAssignment)}
              icon={TrayIcon}
              href="/officer?status=SUBMITTED"
              emphasis={data.pendingAssignment > 0}
              hint={
                data.pendingAssignment > 0
                  ? "Waiting for an officer to pick them up"
                  : "Nothing waiting — the queue is clear"
              }
            />
            <StatCard
              label="Assigned to me"
              value={String(data.assignedToMe)}
              icon={UserFocusIcon}
              href="/officer?assignedToMe=true"
              hint={`Owned by ${officer.fullName}`}
            />
            <StatCard
              label="Approval rate"
              value={`${Math.round(data.approvalRate * 100)}%`}
              icon={CheckCircleIcon}
              href="/officer?status=APPROVED"
              hint="Approved as a share of decided requests"
            />
            <StatCard
              label="Total estimated value"
              value={formatCurrency(data.totalEstimatedValue)}
              icon={CoinsIcon}
              hint="Sum of every request's estimated amount"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>By status</CardTitle>
              <CardDescription>
                Where every request currently sits in the workflow. Select a bar
                to filter the queue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusBreakdown
                byStatus={data.byStatus}
                total={data.totalRequests}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By type</CardTitle>
              <CardDescription>
                Insurance claims against HMO pre-authorizations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TypeSplit byType={data.byType} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

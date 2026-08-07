"use client";

import { CaretLeftIcon } from "@phosphor-icons/react";

import { ButtonLink } from "@/components/common/button-link";
import {
  DetailSkeleton,
  ErrorState,
  RefetchingBar,
} from "@/components/common/states";
import {
  DocumentsCard,
  RequestDetailsCard,
  TimelineCard,
} from "@/components/requests/request-detail-cards";
import { RespondPanel } from "@/components/requests/respond-panel";
import { StatusBadge } from "@/components/requests/status-badge";
import { WithdrawButton } from "@/components/requests/withdraw-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  customerActions,
  REQUEST_TYPE_META,
  STATUS_META,
} from "@/lib/constants/statuses";
import { formatDate } from "@/lib/format";
import { useGetRequestQuery } from "@/store/api/requestsApi";

export function RequestDetailView({ id }: { id: string }) {
  const { data: request, isLoading, isFetching, isError, error, refetch } =
    useGetRequestQuery(id);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !request) {
    return (
      <div className="flex flex-col gap-4">
        <ButtonLink
          href="/dashboard"
          variant="ghost"
          size="sm"
          className="w-fit -ml-2.5"
        >
          <CaretLeftIcon aria-hidden />
          My requests
        </ButtonLink>
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  // Every action decision comes from the status table, never inline conditionals.
  const actions = customerActions(request.status);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <ButtonLink
          href="/dashboard"
          variant="ghost"
          size="sm"
          className="w-fit -ml-2.5"
        >
          <CaretLeftIcon aria-hidden />
          My requests
        </ButtonLink>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-base font-medium tracking-tight">
              {request.requestNumber}
            </h1>
            <p className="text-xs text-muted-foreground">
              {REQUEST_TYPE_META[request.requestType].label} · submitted{" "}
              {formatDate(request.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={request.status} />
            {actions.canWithdraw ? (
              <WithdrawButton request={request} />
            ) : null}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {STATUS_META[request.status].description}
        </p>
      </div>

      <RefetchingBar active={isFetching && !isLoading} />

      <RequestDetailsCard request={request} />

      <DocumentsCard request={request} />

      {/* Rendered only when the status table permits it. */}
      {actions.canRespond ? (
        <Card>
          <CardHeader>
            <CardTitle>Respond to the officer</CardTitle>
            <CardDescription>
              This request is waiting on more information from you. Sending a
              response puts it back under review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RespondPanel request={request} />
          </CardContent>
        </Card>
      ) : null}

      <TimelineCard id={id} />
    </div>
  );
}

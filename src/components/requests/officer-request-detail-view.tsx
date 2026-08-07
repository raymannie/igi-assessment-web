"use client";

import { CaretLeftIcon } from "@phosphor-icons/react";

import { ButtonLink } from "@/components/common/button-link";
import {
  DetailSkeleton,
  ErrorState,
  RefetchingBar,
} from "@/components/common/states";
import { DocumentUploadPanel } from "@/components/requests/document-upload-panel";
import {
  DocumentsCard,
  RequestDetailsCard,
  TimelineCard,
} from "@/components/requests/request-detail-cards";
import {
  StatusActionPanel,
  hasAvailableActions,
} from "@/components/requests/status-action-panel";
import { StatusBadge } from "@/components/requests/status-badge";
import { RoleBadge } from "@/components/layout/role-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  officerActions,
  REQUEST_TYPE_META,
  STATUS_META,
} from "@/lib/constants/statuses";
import { formatDate } from "@/lib/format";
import { deref } from "@/lib/refs";
import { useGetRequestQuery } from "@/store/api/requestsApi";
import type { User } from "@/types";

export function OfficerRequestDetailView({
  id,
  officer,
}: {
  id: string;
  officer: User;
}) {
  const { data: request, isLoading, isFetching, isError, error, refetch } =
    useGetRequestQuery(id);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !request) {
    return (
      <div className="flex flex-col gap-4">
        <ButtonLink
          href="/officer"
          variant="ghost"
          size="sm"
          className="w-fit -ml-2.5"
        >
          <CaretLeftIcon aria-hidden />
          Queue
        </ButtonLink>
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  const assignee = deref(request.assignedOfficer);
  const isAssignee = assignee?._id === officer._id;
  const actions = officerActions(request.status, isAssignee);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <ButtonLink
          href="/officer"
          variant="ghost"
          size="sm"
          className="w-fit -ml-2.5"
        >
          <CaretLeftIcon aria-hidden />
          Queue
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
          <StatusBadge status={request.status} />
        </div>

        <p className="text-xs text-muted-foreground">
          {STATUS_META[request.status].description}
        </p>
      </div>

      <RefetchingBar active={isFetching && !isLoading} />

      {/*
        Always rendered. When this officer cannot act — a colleague owns it, or
        the request is closed — the panel explains who does rather than showing
        a dead set of buttons.
      */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            Assessment
            {assignee ? (
              <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                <RoleBadge role="OFFICER" showIcon={false} />
                {isAssignee ? "You own this request" : assignee.fullName}
              </span>
            ) : null}
          </CardTitle>
          {hasAvailableActions(request, officer._id) ? (
            <CardDescription>
              Only the transitions the state machine allows from{" "}
              {STATUS_META[request.status].label.toLowerCase()} are offered.
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <StatusActionPanel request={request} officerId={officer._id} />
        </CardContent>
      </Card>

      <RequestDetailsCard request={request} showCustomer />

      <DocumentsCard
        request={request}
        uploader={
          // SPEC §7: uploads are allowed while a request is not terminal.
          actions.canUploadDocuments ? (
            <DocumentUploadPanel request={request} />
          ) : undefined
        }
      />

      <TimelineCard id={id} />
    </div>
  );
}

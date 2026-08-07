"use client";

import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { ErrorState, RefetchingBar } from "@/components/common/states";
import { AuditTimeline } from "@/components/requests/audit-timeline";
import { DocumentList } from "@/components/requests/document-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PRODUCT_CATEGORY_OPTIONS } from "@/lib/constants/statuses";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { deref } from "@/lib/refs";
import { useGetAuditLogsQuery } from "@/store/api/requestsApi";
import type { PortalRequest } from "@/types";

/**
 * The parts of a request detail page that are identical for both portals. The
 * two views differ only in their header and which action panels they add.
 */

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xs font-medium">{children}</dd>
    </div>
  );
}

function categoryLabel(value: PortalRequest["productCategory"]): string {
  return (
    PRODUCT_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

export function RequestDetailsCard({
  request,
  showCustomer = false,
}: {
  request: PortalRequest;
  /** The officer queue needs the customer; a customer already knows who they are. */
  showCustomer?: boolean;
}) {
  const customer = deref(request.customer);
  const officer = deref(request.assignedOfficer);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request details</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {showCustomer ? (
            <DetailRow label="Customer">
              {customer?.fullName ?? "—"}
              {customer?.email ? (
                <span className="block font-normal text-muted-foreground">
                  {customer.email}
                </span>
              ) : null}
            </DetailRow>
          ) : null}
          <DetailRow label="Category">
            {categoryLabel(request.productCategory)}
          </DetailRow>
          <DetailRow label="Policy number">{request.policyNumber}</DetailRow>
          <DetailRow label="Estimated amount">
            {formatCurrency(request.estimatedAmount)}
          </DetailRow>
          <DetailRow label="Incident date">
            {formatDate(request.incidentDate)}
          </DetailRow>
          <DetailRow label="Last updated">
            {formatDateTime(request.updatedAt)}
          </DetailRow>
          <DetailRow label="Assigned officer">
            {officer?.fullName ?? "Not yet assigned"}
          </DetailRow>
          {request.serviceProvider ? (
            <DetailRow label="Service provider">
              {request.serviceProvider}
            </DetailRow>
          ) : null}
        </dl>

        <div className="flex flex-col gap-1 border-t pt-4">
          <span className="text-xs text-muted-foreground">Description</span>
          <p className="text-xs whitespace-pre-line">{request.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DocumentsCard({
  request,
  uploader,
}: {
  request: PortalRequest;
  /** Optional attach-files panel, rendered under the list. */
  uploader?: ReactNode;
}) {
  return (
    <Card className="gap-0">
      <CardHeader className="pb-(--card-spacing)">
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          {request.documents.length
            ? "Files attached to this request. Each opens in a new tab."
            : undefined}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <DocumentList documents={request.documents} />
      </CardContent>
      {uploader ? (
        <CardContent className="border-t pt-(--card-spacing)">
          {uploader}
        </CardContent>
      ) : null}
    </Card>
  );
}

export function TimelineCard({ id }: { id: string }) {
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetAuditLogsQuery(id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <ClockCounterClockwiseIcon className="size-4" aria-hidden />
          Audit trail
        </CardTitle>
        <CardDescription>
          Every action on this request, oldest first. Entries are never edited or
          removed.
        </CardDescription>
      </CardHeader>
      <RefetchingBar active={isFetching && !isLoading} />
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <AuditTimeline entries={data ?? []} />
        )}
      </CardContent>
    </Card>
  );
}

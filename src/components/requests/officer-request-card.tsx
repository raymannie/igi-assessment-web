"use client";

import { PaperclipIcon } from "@phosphor-icons/react";
import Link from "next/link";

import { AssignButton } from "@/components/requests/assign-button";
import { StatusBadge } from "@/components/requests/status-badge";
import { canAssignRow } from "@/components/requests/officer-request-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  PRODUCT_CATEGORY_OPTIONS,
  REQUEST_TYPE_META,
} from "@/lib/constants/statuses";
import { formatCurrency, formatDate } from "@/lib/format";
import { deref } from "@/lib/refs";
import type { PortalRequest } from "@/types";

function categoryLabel(value: PortalRequest["productCategory"]): string {
  return (
    PRODUCT_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

/** The `< md` presentation of a queue row. */
export function OfficerRequestCard({
  request,
  officerId,
}: {
  request: PortalRequest;
  officerId: string;
}) {
  const customer = deref(request.customer);
  const officer = deref(request.assignedOfficer);
  const mine = officer?._id === officerId;

  return (
    <Card size="sm" className="transition-colors hover:bg-muted/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/officer/requests/${request._id}`}
            className="flex items-center gap-1.5 font-heading text-sm font-medium underline-offset-4 hover:underline"
          >
            {request.requestNumber}
            {request.documents.length ? (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <PaperclipIcon className="size-3" aria-hidden />
                {request.documents.length}
              </span>
            ) : null}
          </Link>
          <StatusBadge status={request.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          {REQUEST_TYPE_META[request.requestType].label} ·{" "}
          {categoryLabel(request.productCategory)}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <div className="flex flex-col">
            <dt className="text-muted-foreground">Customer</dt>
            <dd className="truncate font-medium">
              {customer?.fullName ?? "—"}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="font-medium">
              {formatCurrency(request.estimatedAmount)}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-muted-foreground">Assigned officer</dt>
            <dd className="truncate">
              {officer ? (mine ? "You" : officer.fullName) : "Unassigned"}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-muted-foreground">Submitted</dt>
            <dd>{formatDate(request.createdAt)}</dd>
          </div>
        </dl>

        {canAssignRow(request, officerId) ? (
          <AssignButton request={request} size="xs" />
        ) : null}
      </CardContent>
    </Card>
  );
}

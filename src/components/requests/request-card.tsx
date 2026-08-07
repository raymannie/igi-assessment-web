"use client";

import { PaperclipIcon } from "@phosphor-icons/react";
import Link from "next/link";

import { StatusBadge } from "@/components/requests/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  PRODUCT_CATEGORY_OPTIONS,
  REQUEST_TYPE_META,
} from "@/lib/constants/statuses";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PortalRequest } from "@/types";

function categoryLabel(value: PortalRequest["productCategory"]): string {
  return (
    PRODUCT_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

/** The `< md` presentation of a request. Table takes over above that. */
export function RequestCard({ request }: { request: PortalRequest }) {
  return (
    <Card size="sm" className="transition-colors hover:bg-muted/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/requests/${request._id}`}
            className="font-heading text-sm font-medium underline-offset-4 hover:underline"
          >
            {request.requestNumber}
          </Link>
          <StatusBadge status={request.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          {REQUEST_TYPE_META[request.requestType].label} ·{" "}
          {categoryLabel(request.productCategory)}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {request.description}
        </p>
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <div className="flex gap-1">
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="font-medium">
              {formatCurrency(request.estimatedAmount)}
            </dd>
          </div>
          <div className="flex gap-1">
            <dt className="text-muted-foreground">Incident</dt>
            <dd>{formatDate(request.incidentDate)}</dd>
          </div>
          {request.documents.length ? (
            <div className="flex items-center gap-1 text-muted-foreground">
              <PaperclipIcon className="size-3" aria-hidden />
              <dt className="sr-only">Documents</dt>
              <dd>{request.documents.length}</dd>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}

"use client";

import { PaperclipIcon } from "@phosphor-icons/react";
import Link from "next/link";

import { StatusBadge } from "@/components/requests/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

/**
 * `md+` presentation. `showOfficer` exists so the officer queue can reuse this
 * unchanged — the customer portal has no use for an assignee column.
 */
export function RequestTable({
  requests,
  showOfficer = false,
}: {
  requests: PortalRequest[];
  showOfficer?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Request</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Incident</TableHead>
          {showOfficer ? <TableHead>Assignee</TableHead> : null}
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {requests.map((request) => {
          const officer = deref(request.assignedOfficer);

          return (
            <TableRow key={request._id}>
              <TableCell>
                <Link
                  href={`/requests/${request._id}`}
                  className="flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
                >
                  {request.requestNumber}
                  {request.documents.length ? (
                    <span
                      className="flex items-center gap-0.5 text-muted-foreground"
                      title={`${request.documents.length} document(s)`}
                    >
                      <PaperclipIcon className="size-3" aria-hidden />
                      {request.documents.length}
                    </span>
                  ) : null}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {REQUEST_TYPE_META[request.requestType].label}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {categoryLabel(request.productCategory)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(request.estimatedAmount)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(request.incidentDate)}
              </TableCell>
              {showOfficer ? (
                <TableCell className="text-muted-foreground">
                  {officer?.fullName ?? "—"}
                </TableCell>
              ) : null}
              <TableCell>
                <StatusBadge status={request.status} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

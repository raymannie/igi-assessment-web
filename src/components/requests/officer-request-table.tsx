"use client";

import { PaperclipIcon } from "@phosphor-icons/react";
import Link from "next/link";

import { AssignButton } from "@/components/requests/assign-button";
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
  officerActions,
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
 * An "Assign to me" row action appears only where the state machine allows it:
 * `officerActions().canAssign` covers the status half of SPEC §3's guard, and the
 * `assignedOfficer` must still be null for the other half.
 */
export function canAssignRow(request: PortalRequest, officerId: string) {
  const isAssignee = deref(request.assignedOfficer)?._id === officerId;
  return (
    officerActions(request.status, isAssignee).canAssign &&
    request.assignedOfficer === null
  );
}

export function OfficerRequestTable({
  requests,
  officerId,
}: {
  requests: PortalRequest[];
  officerId: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Request</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assigned officer</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {requests.map((request) => {
          const customer = deref(request.customer);
          const officer = deref(request.assignedOfficer);
          const mine = officer?._id === officerId;

          return (
            <TableRow key={request._id}>
              <TableCell>
                <Link
                  href={`/officer/requests/${request._id}`}
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
              <TableCell>{customer?.fullName ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {REQUEST_TYPE_META[request.requestType].label}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {categoryLabel(request.productCategory)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(request.estimatedAmount)}
              </TableCell>
              <TableCell>
                <StatusBadge status={request.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {officer ? (
                  <span className={mine ? "font-medium text-foreground" : undefined}>
                    {mine ? "You" : officer.fullName}
                  </span>
                ) : (
                  "Unassigned"
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(request.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                {canAssignRow(request, officerId) ? (
                  <AssignButton request={request} size="xs" />
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

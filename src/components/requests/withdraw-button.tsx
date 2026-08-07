"use client";

import { ArrowUUpLeftIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { isNormalizedApiError } from "@/lib/form-errors";
import { useWithdrawRequestMutation } from "@/store/api/requestsApi";
import type { PortalRequest } from "@/types";

/**
 * Only rendered when `customerActions(status).canWithdraw`. WITHDRAWN is
 * terminal (SPEC §3), so this is irreversible and goes through a confirmation.
 */
export function WithdrawButton({ request }: { request: PortalRequest }) {
  const [withdraw] = useWithdrawRequestMutation();

  const onConfirm = async () => {
    try {
      await withdraw(request._id).unwrap();
      toast.success(`${request.requestNumber} withdrawn`);
      return true;
    } catch (error) {
      toast.error(
        isNormalizedApiError(error)
          ? error.message
          : "Could not withdraw this request. Please try again."
      );
      return false;
    }
  };

  return (
    <ConfirmDialog
      trigger={
        <Button variant="destructive" size="sm">
          <ArrowUUpLeftIcon aria-hidden />
          Withdraw
        </Button>
      }
      title={`Withdraw ${request.requestNumber}?`}
      description="This closes the request permanently. It cannot be reopened, and you would need to submit a new request instead."
      confirmLabel="Withdraw request"
      pendingLabel="Withdrawing…"
      onConfirm={onConfirm}
    />
  );
}

"use client";

import { SpinnerIcon, UserPlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { isNormalizedApiError } from "@/lib/form-errors";
import { useAssignRequestMutation } from "@/store/api/requestsApi";
import type { NormalizedApiError, PortalRequest } from "@/types";

/**
 * SUBMITTED → ASSIGNED. Callers decide *whether* to render this from
 * `officerActions(status, …).canAssign` plus an unassigned check; this component
 * only performs it.
 */
export function AssignButton({
  request,
  size = "sm",
  onError,
}: {
  request: PortalRequest;
  size?: "xs" | "sm" | "default";
  /** Lets the detail panel show the failure inline as well as in a toast. */
  onError?: (error: NormalizedApiError) => void;
}) {
  const [assign, { isLoading }] = useAssignRequestMutation();

  const onClick = async () => {
    try {
      await assign(request._id).unwrap();
      toast.success(`${request.requestNumber} assigned to you`);
    } catch (error) {
      if (isNormalizedApiError(error)) {
        // e.g. another officer claimed it first: 409 "already assigned".
        toast.error(error.message);
        onError?.(error);
        return;
      }
      toast.error("Could not assign this request. Please try again.");
    }
  };

  return (
    <Button size={size} disabled={isLoading} onClick={onClick}>
      {isLoading ? (
        <SpinnerIcon className="animate-spin" aria-hidden />
      ) : (
        <UserPlusIcon aria-hidden />
      )}
      Assign to me
    </Button>
  );
}

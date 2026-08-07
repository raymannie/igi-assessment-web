"use client";

import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ProhibitIcon,
  QuestionIcon,
  SpinnerIcon,
  WarningCircleIcon,
  type Icon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { AssignButton } from "@/components/requests/assign-button";
import { CommentDialog } from "@/components/requests/comment-dialog";
import { Button } from "@/components/ui/button";
import {
  STATUS_META,
  isTerminal,
  officerActions,
  requiresComment,
  statusLabel,
  type OfficerActions,
} from "@/lib/constants/statuses";
import { isNormalizedApiError } from "@/lib/form-errors";
import { deref } from "@/lib/refs";
import { useUpdateStatusMutation } from "@/store/api/requestsApi";
import type { NormalizedApiError, PortalRequest, RequestStatus } from "@/types";

/**
 * The transitions an officer can perform, as data. Which ones appear comes from
 * `officerActions(status, isAssignee)` — the same table the backend enforces —
 * and *how* each one is confirmed comes from `requiresComment` / `isTerminal`.
 * Nothing here is keyed off a specific status, so adding a transition to SPEC §3
 * means adding one row, not editing JSX.
 */
interface TransitionAction {
  to: RequestStatus;
  label: string;
  icon: Icon;
  variant: "default" | "outline" | "destructive";
  permitted: (actions: OfficerActions) => boolean;
  /** Only used when the transition requires a comment. */
  commentLabel?: string;
  commentPlaceholder?: string;
}

const TRANSITIONS: TransitionAction[] = [
  {
    to: "UNDER_REVIEW",
    label: "Start review",
    icon: MagnifyingGlassIcon,
    variant: "default",
    permitted: (actions) => actions.canStartReview,
  },
  {
    to: "NEEDS_ADDITIONAL_INFO",
    label: "Request information",
    icon: QuestionIcon,
    variant: "outline",
    permitted: (actions) => actions.canRequestInfo,
    commentLabel: "What do you need from the customer?",
    commentPlaceholder:
      "e.g. Please upload the police report and a photograph of the damage.",
  },
  {
    to: "APPROVED",
    label: "Approve",
    icon: CheckCircleIcon,
    variant: "default",
    permitted: (actions) => actions.canApprove,
  },
  {
    to: "DENIED",
    label: "Deny",
    icon: ProhibitIcon,
    variant: "destructive",
    permitted: (actions) => actions.canDeny,
    commentLabel: "Reason for denial",
    commentPlaceholder:
      "e.g. The incident falls outside the cover period for this policy.",
  },
];

/**
 * Shown when the UI and the backend's state machine disagree, or when this
 * officer is not allowed to act. Deliberately surfaces the backend's own code and
 * message rather than a generic toast — if they ever diverge, whoever is looking
 * should be able to see which side said what.
 */
function TransitionError({ error }: { error: NormalizedApiError }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 border border-destructive/40 bg-destructive/5 px-2.5 py-2"
    >
      <WarningCircleIcon
        className="mt-0.5 size-4 shrink-0 text-destructive"
        aria-hidden
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-xs font-medium text-destructive">{error.message}</p>
        <p className="text-xs text-muted-foreground">
          Rejected by the server ({error.code}
          {error.status ? ` · HTTP ${error.status}` : ""}). The queue has been
          refreshed — reload if this request still looks out of date.
        </p>
      </div>
    </div>
  );
}

function ReadOnlyNote({
  request,
  isAssignee,
}: {
  request: PortalRequest;
  isAssignee: boolean;
}) {
  const officer = deref(request.assignedOfficer);

  const message = isTerminal(request.status)
    ? `This request is closed — ${statusLabel(request.status).toLowerCase()}. ${STATUS_META[request.status].description}.`
    : officer && !isAssignee
      ? `${officer.fullName} owns this request. Only the assigned officer can change its status.`
      : request.status === "NEEDS_ADDITIONAL_INFO"
        ? "Waiting on the customer to respond. It returns to Under review automatically once they do."
        : "There is nothing for you to action on this request right now.";

  return (
    <p className="text-xs text-muted-foreground">
      {message}
    </p>
  );
}

/**
 * Whether this officer has any transition available. Exported so the surrounding
 * card can drop its "these are your options" blurb when there are none, without
 * re-deriving the rules.
 */
export function hasAvailableActions(
  request: PortalRequest,
  officerId: string
): boolean {
  const isAssignee = deref(request.assignedOfficer)?._id === officerId;
  const actions = officerActions(request.status, isAssignee);
  return (
    (actions.canAssign && request.assignedOfficer === null) ||
    TRANSITIONS.some((transition) => transition.permitted(actions))
  );
}

export function StatusActionPanel({
  request,
  officerId,
}: {
  request: PortalRequest;
  officerId: string;
}) {
  const [updateStatus, { isLoading: updating }] = useUpdateStatusMutation();
  const [error, setError] = useState<NormalizedApiError | null>(null);
  // Which transition is in flight, so the right button shows the spinner while
  // the others simply disable.
  const [pendingTo, setPendingTo] = useState<RequestStatus | null>(null);

  const officer = deref(request.assignedOfficer);
  const isAssignee = officer?._id === officerId;
  const actions = officerActions(request.status, isAssignee);

  // SPEC §3's assign guard has two halves: the status, and `assignedOfficer`
  // being null. `officerActions` only knows the first.
  const canAssign = actions.canAssign && request.assignedOfficer === null;

  const available = TRANSITIONS.filter((transition) =>
    transition.permitted(actions)
  );

  const run = async (to: RequestStatus, comment?: string) => {
    setError(null);
    setPendingTo(to);
    try {
      await updateStatus({ id: request._id, status: to, comment }).unwrap();
      toast.success(`${request.requestNumber} moved to ${statusLabel(to)}`);
      return true;
    } catch (caught) {
      if (isNormalizedApiError(caught)) {
        setError(caught);
        toast.error(caught.message);
        return false;
      }
      toast.error("Could not update this request. Please try again.");
      return false;
    } finally {
      setPendingTo(null);
    }
  };

  const hasActions = canAssign || available.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {error ? <TransitionError error={error} /> : null}

      {hasActions ? (
        <div className="flex flex-wrap gap-2">
          {canAssign ? (
            <AssignButton request={request} onError={setError} />
          ) : null}

          {available.map((transition) => {
            const Icon = transition.icon;
            const isPending = pendingTo === transition.to;
            // Any transition in flight locks the whole set — two decisions must
            // not race.
            const button = (
              <Button
                variant={transition.variant}
                size="sm"
                disabled={updating}
              >
                {isPending ? (
                  <SpinnerIcon className="animate-spin" aria-hidden />
                ) : (
                  <Icon aria-hidden />
                )}
                {transition.label}
              </Button>
            );

            // A comment-required transition gets a textarea dialog; a terminal
            // one without a comment gets a confirmation; anything else acts
            // directly. All three come from the table, not from the status.
            if (requiresComment(transition.to)) {
              return (
                <CommentDialog
                  key={transition.to}
                  trigger={button}
                  title={`${transition.label} — ${request.requestNumber}`}
                  description={`This moves the request to ${statusLabel(
                    transition.to
                  )} and requires a comment.`}
                  label={transition.commentLabel ?? "Comment"}
                  placeholder={transition.commentPlaceholder}
                  confirmLabel={transition.label}
                  pendingLabel="Saving…"
                  variant={
                    transition.variant === "destructive"
                      ? "destructive"
                      : "default"
                  }
                  onConfirm={(comment) => run(transition.to, comment)}
                />
              );
            }

            if (isTerminal(transition.to)) {
              return (
                <ConfirmDialog
                  key={transition.to}
                  trigger={button}
                  title={`${transition.label} ${request.requestNumber}?`}
                  description={`${statusLabel(
                    transition.to
                  )} is a terminal status — the request cannot be reopened afterwards.`}
                  confirmLabel={transition.label}
                  pendingLabel="Saving…"
                  variant="default"
                  onConfirm={() => run(transition.to)}
                />
              );
            }

            // Neither comment-required nor terminal, so it acts immediately —
            // and owns its own pending state rather than a dialog's.
            return (
              <Button
                key={transition.to}
                variant={transition.variant}
                size="sm"
                disabled={updating}
                onClick={() => run(transition.to)}
              >
                {isPending ? (
                  <SpinnerIcon className="animate-spin" aria-hidden />
                ) : (
                  <Icon aria-hidden />
                )}
                {isPending ? "Saving…" : transition.label}
              </Button>
            );
          })}
        </div>
      ) : (
        <ReadOnlyNote request={request} isAssignee={isAssignee} />
      )}
    </div>
  );
}

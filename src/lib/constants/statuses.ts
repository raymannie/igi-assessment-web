import {
  ArrowUUpLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ProhibitIcon,
  QuestionIcon,
  UserCheckIcon,
  type Icon,
} from "@phosphor-icons/react";

import type { RequestStatus, RequestType, UserRole } from "@/types";

/**
 * SPEC.md §3 as data. Never re-derive any of this with inline JSX conditionals.
 * The backend enforces the same table — everything here is UX, not security.
 */

export const REQUEST_STATUSES: RequestStatus[] = [
  "SUBMITTED",
  "ASSIGNED",
  "UNDER_REVIEW",
  "NEEDS_ADDITIONAL_INFO",
  "APPROVED",
  "DENIED",
  "WITHDRAWN",
];

/**
 * Reachability only — which statuses can follow which, per SPEC §3's reference
 * table. It says nothing about *who* may perform a transition, so never derive a
 * role's available actions from this; use OFFICER_TRANSITIONS /
 * CUSTOMER_TRANSITIONS below.
 */
export const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  SUBMITTED: ["ASSIGNED"],
  ASSIGNED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["NEEDS_ADDITIONAL_INFO", "APPROVED", "DENIED"],
  NEEDS_ADDITIONAL_INFO: ["UNDER_REVIEW", "WITHDRAWN"],
  APPROVED: [],
  DENIED: [],
  WITHDRAWN: [],
};

/**
 * The Actor column of SPEC §3, split out per role.
 *
 * The distinction that matters: `NEEDS_ADDITIONAL_INFO → UNDER_REVIEW` belongs to
 * the **customer** and happens only through `POST /requests/:id/respond` — SPEC
 * says it is "never set directly". Deriving officer actions from the combined
 * table above would offer an officer a bogus "Start review" button on a request
 * that is waiting on the customer, and clicking it would PATCH a transition the
 * backend refuses.
 */
export const OFFICER_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  SUBMITTED: ["ASSIGNED"],
  ASSIGNED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["NEEDS_ADDITIONAL_INFO", "APPROVED", "DENIED"],
  NEEDS_ADDITIONAL_INFO: [],
  APPROVED: [],
  DENIED: [],
  WITHDRAWN: [],
};

export const CUSTOMER_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  SUBMITTED: [],
  ASSIGNED: [],
  UNDER_REVIEW: [],
  NEEDS_ADDITIONAL_INFO: ["UNDER_REVIEW", "WITHDRAWN"],
  APPROVED: [],
  DENIED: [],
  WITHDRAWN: [],
};

/** Transitions the backend rejects without a `comment`. */
export const COMMENT_REQUIRED: RequestStatus[] = [
  "NEEDS_ADDITIONAL_INFO",
  "DENIED",
];

export const TERMINAL_STATUSES: RequestStatus[] = [
  "APPROVED",
  "DENIED",
  "WITHDRAWN",
];

export function isTerminal(status: RequestStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function requiresComment(to: RequestStatus): boolean {
  return COMMENT_REQUIRED.includes(to);
}

/** Reachable at all, by anyone. */
export function canTransition(
  from: RequestStatus,
  to: RequestStatus
): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Reachable by an officer through `PATCH /requests/:id/status`. */
export function officerCanTransition(
  from: RequestStatus,
  to: RequestStatus
): boolean {
  return OFFICER_TRANSITIONS[from].includes(to);
}

/** Reachable by the owning customer. */
export function customerCanTransition(
  from: RequestStatus,
  to: RequestStatus
): boolean {
  return CUSTOMER_TRANSITIONS[from].includes(to);
}

export interface StatusMeta {
  label: string;
  /** Badge classes. Status colour carries meaning — see CLAUDE.md design notes. */
  className: string;
  /**
   * Solid fill for charts. The badge classes are deliberately pale for text
   * contrast, which reads as washed out on a bar, so each status carries both.
   */
  barClassName: string;
  icon: Icon;
  description: string;
}

export const STATUS_META: Record<RequestStatus, StatusMeta> = {
  SUBMITTED: {
    label: "Submitted",
    className:
      "bg-zinc-100 text-zinc-700 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
    barClassName: "bg-zinc-400 dark:bg-zinc-500",
    icon: ClockIcon,
    description: "Waiting to be picked up by an officer",
  },
  ASSIGNED: {
    label: "Assigned",
    className:
      "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900",
    barClassName: "bg-sky-500",
    icon: UserCheckIcon,
    description: "An officer owns this request",
  },
  UNDER_REVIEW: {
    label: "Under review",
    className:
      "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900",
    barClassName: "bg-blue-500",
    icon: MagnifyingGlassIcon,
    description: "Being assessed by the assigned officer",
  },
  NEEDS_ADDITIONAL_INFO: {
    label: "Needs information",
    className:
      "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
    barClassName: "bg-amber-500",
    icon: QuestionIcon,
    description: "Waiting on a response from the customer",
  },
  APPROVED: {
    label: "Approved",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900",
    barClassName: "bg-emerald-500",
    icon: CheckCircleIcon,
    description: "Closed — approved",
  },
  DENIED: {
    label: "Denied",
    className:
      "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900",
    barClassName: "bg-red-500",
    icon: ProhibitIcon,
    description: "Closed — denied",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    className:
      "bg-zinc-100 text-zinc-500 ring-zinc-300 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-700",
    barClassName: "bg-zinc-300 dark:bg-zinc-600",
    icon: ArrowUUpLeftIcon,
    description: "Closed — withdrawn by the customer",
  },
};

export function statusLabel(status: RequestStatus): string {
  return STATUS_META[status].label;
}

// ---------------------------------------------------------------------------
// Permitted actions per role — derived from TRANSITIONS, not hand-maintained
// ---------------------------------------------------------------------------

export interface CustomerActions {
  canRespond: boolean;
  canWithdraw: boolean;
  canUploadDocuments: boolean;
}

export function customerActions(status: RequestStatus): CustomerActions {
  return {
    // Via POST /respond, which the backend turns into → UNDER_REVIEW.
    canRespond: customerCanTransition(status, "UNDER_REVIEW"),
    canWithdraw: customerCanTransition(status, "WITHDRAWN"),
    // SPEC §7: uploads are allowed while a request is not terminal.
    canUploadDocuments: !isTerminal(status),
  };
}

export interface OfficerActions {
  canAssign: boolean;
  canStartReview: boolean;
  canRequestInfo: boolean;
  canApprove: boolean;
  canDeny: boolean;
  /** Convenience for the decision panel. */
  canDecide: boolean;
  canUploadDocuments: boolean;
}

export function officerActions(
  status: RequestStatus,
  isAssignee: boolean
): OfficerActions {
  const canApprove = isAssignee && officerCanTransition(status, "APPROVED");
  const canDeny = isAssignee && officerCanTransition(status, "DENIED");

  return {
    // Assignment is guarded on `assignedOfficer` being null, which the caller
    // knows from the request itself; status SUBMITTED is the status half.
    canAssign: officerCanTransition(status, "ASSIGNED"),
    canStartReview: isAssignee && officerCanTransition(status, "UNDER_REVIEW"),
    canRequestInfo:
      isAssignee && officerCanTransition(status, "NEEDS_ADDITIONAL_INFO"),
    canApprove,
    canDeny,
    canDecide: canApprove || canDeny,
    canUploadDocuments: !isTerminal(status),
  };
}

// ---------------------------------------------------------------------------
// Other §4 enum labels
// ---------------------------------------------------------------------------

export const REQUEST_TYPE_META: Record<
  RequestType,
  { label: string; prefix: string }
> = {
  INSURANCE_CLAIM: { label: "Insurance claim", prefix: "CLM" },
  HMO_PRE_AUTHORIZATION: { label: "HMO pre-authorization", prefix: "PRE" },
};

export const REQUEST_TYPE_OPTIONS = [
  { value: "INSURANCE_CLAIM", label: "Insurance claim" },
  { value: "HMO_PRE_AUTHORIZATION", label: "HMO pre-authorization" },
] as const;

export const PRODUCT_CATEGORY_OPTIONS = [
  { value: "MOTOR", label: "Motor" },
  { value: "HEALTH", label: "Health" },
  { value: "TRAVEL", label: "Travel" },
  { value: "LIFE", label: "Life" },
  { value: "PROPERTY", label: "Property" },
  { value: "MARINE", label: "Marine" },
] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: "Customer",
  OFFICER: "Officer",
};

/** Human-readable audit lines — see CLAUDE-frontend.md's audit timeline notes. */
export const AUDIT_ACTION_LABELS = {
  REQUEST_CREATED: "created this request",
  REQUEST_ASSIGNED: "assigned this request",
  STATUS_CHANGED: "changed the status",
  DOCUMENT_UPLOADED: "uploaded documents",
  CUSTOMER_RESPONDED: "responded with more information",
  REQUEST_WITHDRAWN: "withdrew this request",
} as const;

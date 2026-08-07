/**
 * Mirror of SPEC.md §4 (enums) and §5 (data model).
 *
 * Conventions:
 * - Mongo `ObjectId`s arrive as strings over JSON; `Date`s arrive as ISO strings.
 * - Keys match SPEC exactly, including `_id`. If the backend's serialisation
 *   interceptor maps `_id` → `id`, this file is the single place to change.
 * - Fields SPEC marks "never serialised" (`passwordHash`, `refreshTokenHash`)
 *   are deliberately absent.
 */

// ---------------------------------------------------------------------------
// §4 Enums — must match the backend exactly
// ---------------------------------------------------------------------------

export type UserRole = "CUSTOMER" | "OFFICER";

export type RequestType = "INSURANCE_CLAIM" | "HMO_PRE_AUTHORIZATION";

export type ProductCategory =
  | "MOTOR"
  | "HEALTH"
  | "TRAVEL"
  | "LIFE"
  | "PROPERTY"
  | "MARINE";

export type RequestStatus =
  | "SUBMITTED"
  | "ASSIGNED"
  | "UNDER_REVIEW"
  | "NEEDS_ADDITIONAL_INFO"
  | "APPROVED"
  | "DENIED"
  | "WITHDRAWN";

export type AuditAction =
  | "REQUEST_CREATED"
  | "REQUEST_ASSIGNED"
  | "STATUS_CHANGED"
  | "DOCUMENT_UPLOADED"
  | "CUSTOMER_RESPONDED"
  | "REQUEST_WITHDRAWN";

// ---------------------------------------------------------------------------
// References
// ---------------------------------------------------------------------------

/**
 * A Mongo reference that may or may not be populated by the backend. Use the
 * helpers in `@/lib/refs` (`refId`, `deref`) rather than narrowing inline.
 */
export type Ref<T> = string | T;

/**
 * What a populated `User` reference actually carries. Verified against the
 * deployed API: `customer`, `assignedOfficer` and `actor` are populated with
 * exactly these three fields — no `role`, no `policyNumber`. Use `AuditLog`'s
 * denormalised `actorRole`/`actorName` when you need a role for an actor.
 */
export type UserSummary = Pick<User, "_id" | "fullName" | "email">;

// ---------------------------------------------------------------------------
// §5 Documents
// ---------------------------------------------------------------------------

export interface User {
  _id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string | null;
  /** Customers only. */
  policyNumber?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** SPEC calls this embedded shape `Document`; renamed to avoid the DOM global. */
export interface RequestDocument {
  url: string;
  /** Cloudinary public id — kept so files can be deleted later. */
  publicId: string;
  fileName: string;
  mimeType: string;
  /** Bytes. */
  size: number;
  uploadedBy: Ref<UserSummary>;
  uploadedAt: string;
}

/**
 * SPEC's `requests` document. Named `PortalRequest` rather than `Request` so it
 * never shadows the global fetch `Request` (which `proxy.ts` and any future
 * route handler rely on).
 */
export interface PortalRequest {
  _id: string;
  /** Human readable, unique — `CLM-2026-000001` / `PRE-2026-000001`. */
  requestNumber: string;
  customer: Ref<UserSummary>;
  assignedOfficer: Ref<UserSummary> | null;
  requestType: RequestType;
  productCategory: ProductCategory;
  policyNumber: string;
  /** 10–2000 chars. */
  description: string;
  incidentDate: string;
  /** Required when `requestType === 'HMO_PRE_AUTHORIZATION'`. */
  serviceProvider?: string | null;
  /** NGN, > 0. */
  estimatedAmount: number;
  status: RequestStatus;
  documents: RequestDocument[];
  createdAt: string;
  updatedAt: string;
}

/** Append-only. No update or delete routes exist. */
export interface AuditLog {
  _id: string;
  request: Ref<PortalRequest>;
  actor: Ref<UserSummary>;
  /** Denormalised so history survives role changes. */
  actorRole: UserRole;
  /** Denormalised snapshot. */
  actorName: string;
  action: AuditAction;
  fromStatus?: RequestStatus | null;
  toStatus?: RequestStatus | null;
  comment?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// §6 API envelope
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** What list endpoints hand components after `transformResponse` unwrapping. */
export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Raw success envelope — unwrapped at the API layer, never seen by components. */
export interface ApiEnvelope<TData, TMeta = unknown> {
  success: true;
  data: TData;
  meta?: TMeta;
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_TRANSITION"
  | "COMMENT_REQUIRED"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "INTERNAL_ERROR";

/** Raw error envelope from the backend. */
export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: ApiErrorCode | string;
    message: string;
    details?: unknown[];
  };
}

/**
 * Every RTK Query error is normalised to this by `baseQueryWithReauth`, so
 * `error` is the same shape whether it came from the API, a network failure, or
 * a parse failure.
 */
export interface NormalizedApiError {
  code: ApiErrorCode | string;
  message: string;
  details: unknown[];
  /** HTTP status when there was one. */
  status?: number;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthSession {
  accessToken: string;
  user: User;
}

// ---------------------------------------------------------------------------
// §6 `GET /requests` query params
// ---------------------------------------------------------------------------

export interface RequestListParams {
  status?: RequestStatus | RequestStatus[];
  requestType?: RequestType;
  productCategory?: ProductCategory;
  dateFrom?: string;
  dateTo?: string;
  /** Officer only. */
  assignedToMe?: boolean;
  search?: string;
  page?: number;
  /** Max 50. */
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ---------------------------------------------------------------------------
// §6 `GET /dashboard/stats`
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalRequests: number;
  byStatus: Record<RequestStatus, number>;
  byType: Record<RequestType, number>;
  approvalRate: number;
  pendingAssignment: number;
  assignedToMe: number;
  totalEstimatedValue: number;
}

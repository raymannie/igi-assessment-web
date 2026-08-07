import { baseApi, unwrap, unwrapPaginated } from "@/store/api/baseApi";
import type {
  AuditLog,
  Paginated,
  PortalRequest,
  ProductCategory,
  RequestListParams,
  RequestStatus,
  RequestType,
} from "@/types";

/** The body `POST /requests` accepts — dates as ISO strings, no files. */
export interface CreateRequestBody {
  requestType: RequestType;
  productCategory: ProductCategory;
  policyNumber: string;
  description: string;
  incidentDate: string;
  serviceProvider?: string;
  estimatedAmount: number;
}

/**
 * Built by hand rather than handed to `fetchBaseQuery`'s `params`, because SPEC
 * §6 allows repeated values for `status` (`?status=SUBMITTED&status=ASSIGNED`)
 * and `URLSearchParams` from an object would comma-join the array instead.
 */
function buildRequestsUrl(filters: RequestListParams = {}): string {
  const search = new URLSearchParams();
  const { status, ...rest } = filters;

  if (status) {
    for (const value of Array.isArray(status) ? status : [status]) {
      search.append("status", value);
    }
  }

  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `/requests?${query}` : "/requests";
}

/**
 * Every mutation that touches a request invalidates the request, its timeline,
 * the list, and the officer stats. A status change that leaves the audit
 * timeline stale reads as a bug, so `AuditLog` is not optional here.
 */
const invalidateRequest = (id: string) =>
  [
    { type: "Request" as const, id },
    { type: "AuditLog" as const, id },
    "RequestList" as const,
    "Stats" as const,
  ] as const;

export const requestsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRequests: build.query<
      Paginated<PortalRequest>,
      RequestListParams | void
    >({
      query: (filters) => buildRequestsUrl(filters ?? undefined),
      transformResponse: unwrapPaginated<PortalRequest>,
      // Per-item tags alongside the list tag, so updating one request can
      // invalidate it precisely without forcing every list to refetch.
      providesTags: (result) => [
        "RequestList",
        ...(result?.items ?? []).map((request) => ({
          type: "Request" as const,
          id: request._id,
        })),
      ],
    }),

    getRequest: build.query<PortalRequest, string>({
      query: (id) => `/requests/${id}`,
      transformResponse: unwrap<PortalRequest>,
      providesTags: (_result, _error, id) => [{ type: "Request", id }],
    }),

    /** Ascending by `createdAt` — the API already orders it. */
    getAuditLogs: build.query<AuditLog[], string>({
      query: (id) => `/requests/${id}/audit-logs`,
      transformResponse: unwrap<AuditLog[]>,
      providesTags: (_result, _error, id) => [{ type: "AuditLog", id }],
    }),

    createRequest: build.mutation<PortalRequest, CreateRequestBody>({
      query: (body) => ({ url: "/requests", method: "POST", body }),
      transformResponse: unwrap<PortalRequest>,
      invalidatesTags: ["RequestList", "Stats"],
    }),

    uploadDocuments: build.mutation<
      PortalRequest,
      { id: string; files: File[] }
    >({
      query: ({ id, files }) => {
        const body = new FormData();
        // SPEC §6: multipart field name is `files`, max 5 per call.
        for (const file of files) body.append("files", file);
        return { url: `/requests/${id}/documents`, method: "POST", body };
        // Content-Type is intentionally unset — the browser must add the
        // multipart boundary itself, and fetchBaseQuery passes FormData through.
      },
      transformResponse: unwrap<PortalRequest>,
      invalidatesTags: (_result, _error, { id }) => [...invalidateRequest(id)],
    }),

    respondToRequest: build.mutation<
      PortalRequest,
      { id: string; message: string; files?: File[] }
    >({
      query: ({ id, message, files }) => {
        // Only reach for multipart when there is actually a file to send;
        // a plain response stays JSON.
        if (files?.length) {
          const body = new FormData();
          body.append("message", message);
          for (const file of files) body.append("files", file);
          return { url: `/requests/${id}/respond`, method: "POST", body };
        }
        return {
          url: `/requests/${id}/respond`,
          method: "POST",
          body: { message },
        };
      },
      transformResponse: unwrap<PortalRequest>,
      invalidatesTags: (_result, _error, { id }) => [...invalidateRequest(id)],
    }),

    /**
     * SPEC §3: SUBMITTED → ASSIGNED. The backend sets `assignedOfficer` to the
     * acting officer and 409s if it is already set, so no officer id is sent.
     */
    assignRequest: build.mutation<PortalRequest, string>({
      query: (id) => ({ url: `/requests/${id}/assign`, method: "POST" }),
      transformResponse: unwrap<PortalRequest>,
      invalidatesTags: (_result, _error, id) => [...invalidateRequest(id)],
    }),

    /**
     * SPEC §3 transitions available to the assignee. `comment` is required for
     * NEEDS_ADDITIONAL_INFO and DENIED — the backend answers 400
     * COMMENT_REQUIRED without it.
     */
    updateStatus: build.mutation<
      PortalRequest,
      { id: string; status: RequestStatus; comment?: string }
    >({
      query: ({ id, status, comment }) => ({
        url: `/requests/${id}/status`,
        method: "PATCH",
        body: comment ? { status, comment } : { status },
      }),
      transformResponse: unwrap<PortalRequest>,
      invalidatesTags: (_result, _error, { id }) => [...invalidateRequest(id)],
    }),

    withdrawRequest: build.mutation<PortalRequest, string>({
      query: (id) => ({ url: `/requests/${id}/withdraw`, method: "POST" }),
      transformResponse: unwrap<PortalRequest>,
      invalidatesTags: (_result, _error, id) => [...invalidateRequest(id)],
    }),
  }),
});

export const {
  useGetRequestsQuery,
  useGetRequestQuery,
  useGetAuditLogsQuery,
  useCreateRequestMutation,
  useUploadDocumentsMutation,
  useRespondToRequestMutation,
  useWithdrawRequestMutation,
  useAssignRequestMutation,
  useUpdateStatusMutation,
} = requestsApi;

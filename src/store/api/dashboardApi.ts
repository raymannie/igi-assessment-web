import { baseApi, unwrap } from "@/store/api/baseApi";
import type { DashboardStats } from "@/types";

/**
 * SPEC §6 `GET /dashboard/stats` — officer only; the API answers 403 FORBIDDEN
 * for a customer token.
 *
 * Tagged `Stats`, which every request mutation already invalidates, so the
 * metrics follow an assignment or a decision without any extra wiring.
 */
export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStats: build.query<DashboardStats, void>({
      query: () => "/dashboard/stats",
      transformResponse: unwrap<DashboardStats>,
      providesTags: ["Stats"],
    }),
  }),
});

export const { useGetStatsQuery } = dashboardApi;

import type { LoginInput, RegisterInput } from "@/lib/schemas/auth";
import { clearSessionHint, markSessionHint } from "@/lib/session-hint";
import { baseApi, unwrap } from "@/store/api/baseApi";
import {
  credentialsReceived,
  loggedOut,
  userReceived,
} from "@/store/slices/authSlice";
import type { ApiEnvelope, AuthSession, User } from "@/types";

/**
 * SPEC.md §6 Auth. Injected into `baseApi` — never a second `createApi`.
 *
 * The slice is updated from `onQueryStarted` rather than at the call site so
 * every caller (login form, bootstrap, a future session-expiry retry) keeps
 * auth state consistent without remembering to dispatch.
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Creates a CUSTOMER only. SPEC does not specify a response body, so nothing
     * here depends on one — the register screen sends the user to /login after.
     */
    register: build.mutation<void, RegisterInput>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
    }),

    login: build.mutation<AuthSession, LoginInput>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      transformResponse: unwrap<AuthSession>,
      // Deliberately NOT `invalidatesTags: ['Me']`. The invalidation is
      // dispatched by the middleware the moment the mutation fulfils, which
      // races ahead of the `credentialsReceived` below — the refetch would go
      // out with no bearer token, 401, and burn a refresh round trip on every
      // login. Login already returns the user, so seed the cache instead.
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(credentialsReceived(data));
          dispatch(
            authApi.util.upsertQueryData("getMe", undefined, data.user)
          );
          // Lets proxy.ts stop redirecting this browser to /login.
          markSessionHint();
        } catch {
          // The form surfaces the error; nothing to record in the slice.
        }
      },
    }),

    logout: build.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        // Clear locally either way — a failed logout call must not leave the
        // user looking signed in.
        try {
          await queryFulfilled;
        } finally {
          clearSessionHint();
          dispatch(loggedOut());
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),

    /**
     * With no access token in memory this 401s, which the reauth path turns into
     * a silent `POST /auth/refresh` and a retry — that is how a page reload
     * restores the session without persisting anything sensitive.
     */
    getMe: build.query<User, void>({
      query: () => "/auth/me",
      transformResponse: (response: ApiEnvelope<User>) => unwrap(response),
      providesTags: ["Me"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(userReceived(data));
          markSessionHint();
        } catch (rejected) {
          // Status has to settle either way, or the app bootstraps forever.
          dispatch(loggedOut());
          // Only drop the hint when the server actually rejected the session —
          // a network blip must not sign the user out of their next page load.
          const code = (rejected as { error?: { code?: string } })?.error?.code;
          if (code === "UNAUTHORIZED" || code === "FORBIDDEN") {
            clearSessionHint();
          }
        }
      },
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
} = authApi;

import { configureStore } from "@reduxjs/toolkit";

import { baseApi } from "@/store/api/baseApi";
import authReducer from "@/store/slices/authSlice";

// Side-effect import: registers the auth endpoints on `baseApi` before any
// component calls their hooks. Feature API modules go here as they land.
import "@/store/api/authApi";
import "@/store/api/requestsApi";
import "@/store/api/dashboardApi";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;

let browserStore: AppStore | undefined;

/**
 * One store per browser page load, and a fresh one per server render.
 *
 * The server branch matters for isolation: a module-level singleton would be
 * shared across concurrent SSR requests. The browser branch matters for
 * correctness — the access token lives in store state, so a second store means a
 * second identity. React Strict Mode remounts this tree in development, and with
 * a per-mount store the remount would drop the token, re-run the bootstrap, and
 * fire a second `POST /auth/refresh`. Since the backend rotates refresh tokens,
 * two stores racing on a 401 can consume the same token and log the user out.
 */
export function getStore(): AppStore {
  if (typeof window === "undefined") return makeStore();
  return (browserStore ??= makeStore());
}
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

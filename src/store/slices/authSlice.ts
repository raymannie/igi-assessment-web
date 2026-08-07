import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AuthSession, User } from "@/types";

/**
 * The access token lives here and nowhere else — never localStorage, never
 * sessionStorage, never redux-persist. The refresh token is an httpOnly cookie
 * the client cannot read; a page reload restores the session by calling
 * `GET /auth/me`, which the reauth path in `baseApi` silently refreshes.
 */

export type AuthStatus =
  /** Before `AuthBootstrap`'s `getMe` has settled — role is unknown. */
  | "bootstrapping"
  | "authenticated"
  | "unauthenticated";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  status: AuthStatus;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  status: "bootstrapping",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Login succeeded — token and user arrive together. */
    credentialsReceived(state, action: PayloadAction<AuthSession>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.status = "authenticated";
    },
    /** A refresh rotated the access token; the user is unchanged. */
    tokenReceived(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    /** `getMe` resolved — this is what ends bootstrapping. */
    userReceived(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.status = "authenticated";
    },
    /** Logout, or a refresh that failed. Clears everything. */
    loggedOut(state) {
      state.accessToken = null;
      state.user = null;
      state.status = "unauthenticated";
    },
  },
  selectors: {
    selectAccessToken: (state) => state.accessToken,
    selectCurrentUser: (state) => state.user,
    selectAuthStatus: (state) => state.status,
    selectIsAuthenticated: (state) => state.status === "authenticated",
  },
});

export const { credentialsReceived, tokenReceived, userReceived, loggedOut } =
  authSlice.actions;

export const {
  selectAccessToken,
  selectCurrentUser,
  selectAuthStatus,
  selectIsAuthenticated,
} = authSlice.selectors;

export default authSlice.reducer;

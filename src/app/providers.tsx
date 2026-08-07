"use client";

import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";

import { Toaster } from "@/components/ui/sonner";
import { getStore } from "@/store";
import { useGetMeQuery } from "@/store/api/authApi";

/**
 * Fires `GET /auth/me` exactly once per mount to resolve the session.
 *
 * On a cold load there is no access token in memory, so the call 401s, the
 * reauth path in `baseApi` silently exchanges the httpOnly refresh cookie for a
 * new token, and the retry succeeds. If there is no valid cookie the query fails
 * and `authSlice.status` settles on `unauthenticated`.
 *
 * Children render immediately — route group layouts gate on `status` so public
 * pages are not blocked behind an auth probe.
 */
function AuthBootstrap({ children }: { children: ReactNode }) {
  useGetMeQuery();
  return children;
}

export function Providers({ children }: { children: ReactNode }) {
  // Lazy initialiser, and `getStore` is idempotent in the browser, so a Strict
  // Mode remount reattaches to the same store rather than minting a new one.
  const [store] = useState(getStore);

  return (
    <Provider store={store}>
      {/*
        Light only, whatever the visitor's OS says and whatever a previous visit
        left in localStorage. `forcedTheme` is the load-bearing prop: it pins the
        class on <html> and sets `color-scheme: light` so native controls (the
        date pickers especially) match.
        The dark tokens and `dark:` variants stay in place but inert — dropping
        `forcedTheme` re-enables them.
      */}
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        forcedTheme="light"
      >
        <AuthBootstrap>{children}</AuthBootstrap>
        {/*
          `theme` is passed explicitly because shadcn's Toaster reads
          `useTheme().theme`, which reports the *saved* preference rather than the
          forced one — so a visitor with `theme=dark` in localStorage, or the
          "system" default, would hand sonner a dark theme to resolve itself while
          the rest of the app stayed light.
        */}
        <Toaster position="top-right" theme="light" />
      </ThemeProvider>
    </Provider>
  );
}

import { NextResponse, type NextRequest } from "next/server";

import { isPublicRoute } from "@/lib/routes";
import { SESSION_HINT_COOKIE } from "@/lib/session-hint";

/**
 * Next.js 16 renamed the `middleware` convention to `proxy` (and this runs on the
 * Node runtime only — the edge runtime is not supported here).
 *
 * This is a coarse redirect, not authorisation. It reads the session *hint*
 * cookie, because the actual refresh token is httpOnly and scoped to the API's
 * own domain — unreadable from here. See `lib/session-hint.ts` for why.
 *
 * The hint says nothing about *who* the user is, so `/officer/*` vs customer
 * separation belongs in the route group layouts, which have the resolved user
 * from `getMe`. A stale or forged hint just means the page loads and the layout
 * redirects a moment later.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const hasSession = Boolean(request.cookies.get(SESSION_HINT_COOKIE)?.value);
  const isPublic = isPublicRoute(pathname);

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  // Someone with a session landing on /login or /register goes to the root,
  // which routes on by role once the feature screens exist.
  if (hasSession && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals, the favicon, and static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

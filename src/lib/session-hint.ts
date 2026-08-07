/**
 * A routing hint — deliberately **not** a credential.
 *
 * The real refresh token is an httpOnly cookie set by the API on *its own*
 * domain (`Set-Cookie: refreshToken=…; Path=/api/v1/auth; HttpOnly; Secure;
 * SameSite=None`). Cookies are domain-scoped, so the Next.js server — a different
 * origin — can never read it. `proxy.ts` therefore cannot gate on the refresh
 * cookie: it would see nothing and bounce every signed-in user to /login.
 *
 * This cookie exists only so `proxy.ts` can make that redirect decision before
 * paint. It holds no token, no identity, and no claims — just "a session was
 * established in this browser at some point". It is JS-writable and forgeable,
 * and that is fine: forging it gets you a page that immediately calls
 * `GET /auth/me`, fails, and redirects. Authorisation lives on the API, and role
 * separation lives in the route group layouts, which have the resolved user.
 */

export const SESSION_HINT_COOKIE = "igi_session";

/** Matches the refresh token TTL from SPEC.md §6 (7 days). */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function write(value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${SESSION_HINT_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/** Call when a session is established or refreshed. */
export function markSessionHint() {
  write("1", MAX_AGE_SECONDS);
}

/** Call on logout, or when a refresh proves there is no usable session. */
export function clearSessionHint() {
  write("", 0);
}

import type { UserRole } from "@/types";

/** Routes reachable without a session. `proxy.ts` and the reauth path share this. */
export const PUBLIC_ROUTES = ["/login", "/register"] as const;

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Where a signed-in user lands. These screens don't exist yet — this is the one
 * place to change when the route groups are built.
 */
export function homeForRole(role: UserRole): string {
  return role === "OFFICER" ? "/officer" : "/dashboard";
}

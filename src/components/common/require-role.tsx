"use client";

import { SpinnerIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { homeForRole } from "@/lib/routes";
import { useAppSelector } from "@/store/hooks";
import { selectAuthStatus, selectCurrentUser } from "@/store/slices/authSlice";
import type { UserRole } from "@/types";

function Waiting({ label }: { label: string }) {
  return (
    <div
      className="flex flex-1 items-center justify-center py-24"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <SpinnerIcon className="size-4 animate-spin" aria-hidden />
        {label}
      </span>
    </div>
  );
}

/**
 * Role separation for a route group.
 *
 * `proxy.ts` can only tell that *some* session exists — the httpOnly refresh
 * cookie lives on the API's domain and carries the role, so neither is readable
 * from the Next server. The role check therefore has to happen here, against the
 * user resolved by `getMe`.
 *
 * Renders a waiting state rather than the page while the role is unknown or a
 * redirect is pending, so nobody sees a flash of the wrong portal.
 */
export function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const router = useRouter();
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectCurrentUser);

  const wrongRole = user !== null && user.role !== role;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (wrongRole && user) {
      router.replace(homeForRole(user.role));
    }
  }, [status, wrongRole, user, router]);

  if (status === "bootstrapping") return <Waiting label="Restoring session…" />;
  if (status === "unauthenticated") return <Waiting label="Redirecting…" />;
  if (!user || wrongRole) return <Waiting label="Redirecting…" />;

  return children;
}

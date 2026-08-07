"use client";

import { SpinnerIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { homeForRole } from "@/lib/routes";
import { useAppSelector } from "@/store/hooks";
import { selectAuthStatus, selectCurrentUser } from "@/store/slices/authSlice";

export function HomeRedirect() {
  const router = useRouter();
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectCurrentUser);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (user) router.replace(homeForRole(user.role));
  }, [status, user, router]);

  return (
    <div
      className="flex flex-1 items-center justify-center py-24"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <SpinnerIcon className="size-4 animate-spin" aria-hidden />
        Loading your portal…
      </span>
    </div>
  );
}

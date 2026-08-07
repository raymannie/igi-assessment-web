"use client";

import { ArrowLeftIcon, HouseIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { ButtonLink } from "@/components/common/button-link";
import { Button } from "@/components/ui/button";
import { homeForRole } from "@/lib/routes";
import { useAppSelector } from "@/store/hooks";
import { selectAuthStatus, selectCurrentUser } from "@/store/slices/authSlice";

/** Sends the user somewhere useful — which depends on who they are. */
export function NotFoundActions() {
  const router = useRouter();
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectCurrentUser);

  // While `getMe` is still in flight the role is unknown. Don't tell a
  // signed-in user to sign in — point at "/", which routes by role once the
  // session resolves. Only an actually-rejected session gets "Sign in".
  const signedOut = status === "unauthenticated";
  const home = signedOut ? "/login" : user ? homeForRole(user.role) : "/";

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="outline" size="sm" onClick={() => router.back()}>
        <ArrowLeftIcon aria-hidden />
        Go back
      </Button>
      <ButtonLink href={home} size="sm">
        <HouseIcon aria-hidden />
        {signedOut ? "Sign in" : "Back to my portal"}
      </ButtonLink>
    </div>
  );
}

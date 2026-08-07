"use client";

import { CaretLeftIcon } from "@phosphor-icons/react";
import { ButtonLink } from "@/components/common/button-link";
import { RequestForm } from "@/components/requests/request-form";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";

export function NewRequestView() {
  const user = useAppSelector(selectCurrentUser);
  // The customer layout resolves the user before this renders.
  if (!user) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <ButtonLink
          href="/dashboard"
          variant="ghost"
          size="sm"
          className="w-fit -ml-2.5"
        >
          <CaretLeftIcon aria-hidden />
          My requests
        </ButtonLink>
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-base font-medium tracking-tight">
            New request
          </h1>
          <p className="text-xs text-muted-foreground">
            Submit an insurance claim or an HMO pre-authorization request.
          </p>
        </div>
      </div>

      <RequestForm user={user} />
    </div>
  );
}

"use client";

import { ArrowClockwiseIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary. Data-fetching failures are handled inline by each
 * view's `isError` branch — this catches the unexpected: a render crash, or a bad
 * shape the API layer let through.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Production would ship this to an error reporter.
    console.error("[route error]", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-1 items-center justify-center px-4 py-24"
    >
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <WarningCircleIcon className="size-6 text-destructive" aria-hidden />
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-base font-medium tracking-tight">
            Something went wrong on this page
          </h1>
          <p className="text-xs text-muted-foreground">
            {error.message || "An unexpected error stopped this page rendering."}
          </p>
          {error.digest ? (
            <p className="text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
        <Button size="sm" onClick={reset}>
          <ArrowClockwiseIcon aria-hidden />
          Try again
        </Button>
      </div>
    </div>
  );
}

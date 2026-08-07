"use client";

import { ArrowClockwiseIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toDisplayError } from "@/lib/form-errors";
import { cn } from "@/lib/utils";

/**
 * The four states every list view owes the user (CLAUDE.md rule 7): first-load
 * skeleton, background-refetch bar, error with a retry, and an empty state with
 * something to do next.
 */

export function EmptyState({
  title,
  description,
  icon,
  action,
  /** Tighter padding for empty states nested inside a card. */
  compact = false,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 text-center",
        compact ? "py-8" : "py-16"
      )}
    >
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <div className="flex flex-col gap-1">
        <p className="font-heading text-sm font-medium">{title}</p>
        {description ? (
          <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  error: rawError,
  onRetry,
  className,
}: {
  /** Pass a query hook's `error` straight through — the union is handled. */
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const error = toDisplayError(rawError);

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className
      )}
    >
      <WarningCircleIcon className="size-6 text-destructive" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="font-heading text-sm font-medium">
          {error?.message ?? "Something went wrong."}
        </p>
        {error?.code ? (
          <p className="text-xs text-muted-foreground">{error.code}</p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <ArrowClockwiseIcon aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Shown for `isFetching` without `isLoading` — a background refetch should be a
 * hint, not a screen-clearing skeleton.
 */
export function RefetchingBar({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden={!active}
      className={cn(
        "h-0.5 w-full overflow-hidden bg-transparent transition-opacity",
        active ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className={cn(
          "h-full w-1/3 bg-primary",
          active && "animate-[indeterminate_1.1s_ease-in-out_infinite]"
        )}
      />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-32 w-full" />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}

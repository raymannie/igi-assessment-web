"use client";

import { ArrowRightIcon, type Icon } from "@phosphor-icons/react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A single metric. When `href` is given the whole card becomes a link into the
 * queue with the equivalent filter applied, so a number is never a dead end.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: MetricIcon,
  href,
  emphasis = false,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: Icon;
  href?: string;
  /** Draws attention to something needing action, e.g. pending assignment. */
  emphasis?: boolean;
}) {
  const body = (
    <CardContent className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MetricIcon className="size-3.5 shrink-0" aria-hidden />
          {label}
        </span>
        {href ? (
          <ArrowRightIcon
            className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100"
            aria-hidden
          />
        ) : null}
      </div>

      <span
        className={cn(
          "font-heading text-xl leading-none font-medium tabular-nums",
          emphasis && "text-amber-600 dark:text-amber-400"
        )}
      >
        {value}
      </span>

      {hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </CardContent>
  );

  if (!href) return <Card size="sm">{body}</Card>;

  return (
    <Card
      size="sm"
      className="transition-colors focus-within:bg-muted/40 hover:bg-muted/40"
    >
      <Link
        href={href}
        className="rounded-none outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {body}
      </Link>
    </Card>
  );
}

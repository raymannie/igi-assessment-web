"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/types";

/**
 * Compact numeric pagination with ellipses. Keeps the window small enough to fit
 * a 375px viewport, where only the current page and the arrows are shown.
 */
function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page]);
  if (page - 1 > 1) pages.add(page - 1);
  if (page + 1 < totalPages) pages.add(page + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "gap")[] = [];

  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) result.push("gap");
    result.push(value);
  });

  return result;
}

export function Pagination({
  meta,
  onPageChange,
  disabled,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const { page, totalPages, total, limit } = meta;
  if (totalPages <= 1) return null;

  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 border-t px-3 py-3 sm:flex-row"
    >
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {first}–{last} of {total}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <CaretLeftIcon aria-hidden />
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {pageWindow(page, totalPages).map((entry, index) =>
            entry === "gap" ? (
              <span
                key={`gap-${index}`}
                className="px-1 text-xs text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Button
                key={entry}
                variant={entry === page ? "default" : "ghost"}
                size="icon-sm"
                aria-label={`Page ${entry}`}
                aria-current={entry === page ? "page" : undefined}
                disabled={disabled}
                onClick={() => onPageChange(entry)}
              >
                {entry}
              </Button>
            )
          )}
        </div>

        <span className="px-1 text-xs text-muted-foreground sm:hidden">
          {page} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <CaretRightIcon aria-hidden />
        </Button>
      </div>
    </nav>
  );
}

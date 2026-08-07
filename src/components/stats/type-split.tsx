"use client";

import Link from "next/link";

import { REQUEST_TYPE_META } from "@/lib/constants/statuses";
import { cn } from "@/lib/utils";
import type { DashboardStats, RequestType } from "@/types";

const TYPE_BARS: Record<RequestType, string> = {
  INSURANCE_CLAIM: "bg-indigo-500",
  HMO_PRE_AUTHORIZATION: "bg-teal-500",
};

const TYPES: RequestType[] = ["INSURANCE_CLAIM", "HMO_PRE_AUTHORIZATION"];

/** A single stacked bar plus a legend — the split only ever has two parts. */
export function TypeSplit({
  byType,
}: {
  byType: DashboardStats["byType"];
}) {
  const total = TYPES.reduce((sum, type) => sum + (byType[type] ?? 0), 0);

  if (total === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No requests to break down yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex h-4 w-full overflow-hidden bg-muted"
        role="img"
        aria-label={TYPES.map(
          (type) =>
            `${REQUEST_TYPE_META[type].label}: ${byType[type] ?? 0} of ${total}`
        ).join("; ")}
      >
        {TYPES.map((type) => {
          const count = byType[type] ?? 0;
          if (!count) return null;
          return (
            <span
              key={type}
              className={cn("h-full", TYPE_BARS[type])}
              style={{ width: `${(count / total) * 100}%` }}
            />
          );
        })}
      </div>

      <ul className="flex flex-col gap-2 sm:flex-row sm:gap-6">
        {TYPES.map((type) => {
          const count = byType[type] ?? 0;
          const share = Math.round((count / total) * 100);

          return (
            <li key={type} className="min-w-0 flex-1">
              <Link
                href={`/officer?requestType=${type}`}
                className="flex items-center gap-2 rounded-none outline-none hover:opacity-80 focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span
                  className={cn("size-2.5 shrink-0", TYPE_BARS[type])}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {REQUEST_TYPE_META[type].label}
                </span>
                <span className="text-xs tabular-nums">
                  <span className="font-medium">{count}</span>
                  <span className="text-muted-foreground"> · {share}%</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

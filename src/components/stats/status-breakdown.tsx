"use client";

import Link from "next/link";

import { StatusBadge } from "@/components/requests/status-badge";
import { REQUEST_STATUSES, STATUS_META } from "@/lib/constants/statuses";
import { cn } from "@/lib/utils";
import type { DashboardStats, RequestStatus } from "@/types";

/**
 * Horizontal bars, plain CSS. A charting library would be a lot of bytes for two
 * simple breakdowns, and bars built from `STATUS_META.barClassName` stay in step
 * with the badges everywhere else by construction.
 *
 * Bars are also links, so a slice of the chart takes you to the matching queue.
 */
export function StatusBreakdown({
  byStatus,
  total,
}: {
  byStatus: DashboardStats["byStatus"];
  total: number;
}) {
  // Scale against the largest bucket so small counts stay visible.
  const peak = Math.max(1, ...REQUEST_STATUSES.map((s) => byStatus[s] ?? 0));

  return (
    <ul className="flex flex-col gap-2.5">
      {REQUEST_STATUSES.map((status: RequestStatus) => {
        const count = byStatus[status] ?? 0;
        const share = total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <li key={status}>
            <Link
              href={`/officer?status=${status}`}
              className="group flex items-center gap-3 rounded-none outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span className="w-36 shrink-0 sm:w-40">
                <StatusBadge status={status} />
              </span>

              <span
                className="h-4 min-w-0 flex-1 bg-muted"
                role="img"
                aria-label={`${STATUS_META[status].label}: ${count} of ${total} (${share}%)`}
              >
                <span
                  className={cn(
                    "block h-full transition-[width] duration-500 group-hover:opacity-80",
                    STATUS_META[status].barClassName
                  )}
                  // Width is data, not a design token — inline is correct here.
                  style={{ width: `${(count / peak) * 100}%` }}
                />
              </span>

              <span className="w-16 shrink-0 text-right text-xs tabular-nums">
                <span className="font-medium">{count}</span>
                <span className="text-muted-foreground"> · {share}%</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

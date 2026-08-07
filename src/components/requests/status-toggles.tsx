"use client";

import { StatusBadge } from "@/components/requests/status-badge";
import { REQUEST_STATUSES } from "@/lib/constants/statuses";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/types";

/**
 * Multi-select status filter. Shared by both portals' filter bars — the badge
 * itself still comes from STATUS_META, so the filter and the table can never
 * disagree about a status's colour or label.
 */
export function StatusToggles({
  active,
  onToggle,
  className,
}: {
  active: RequestStatus[];
  onToggle: (status: RequestStatus) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {REQUEST_STATUSES.map((status) => {
        const selected = active.includes(status);
        return (
          <button
            key={status}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(status)}
            className={cn(
              "rounded-none outline-none transition-opacity focus-visible:ring-1 focus-visible:ring-ring",
              selected ? "opacity-100" : "opacity-45 hover:opacity-80"
            )}
          >
            <StatusBadge status={status} />
          </button>
        );
      })}
    </div>
  );
}

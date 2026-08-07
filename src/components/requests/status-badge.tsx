"use client";

import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/lib/constants/statuses";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/types";

/**
 * The only place a status turns into colour, label or icon. Everything comes
 * from STATUS_META — no inline `status === 'X'` conditionals anywhere.
 */
export function StatusBadge({
  status,
  className,
  showIcon = true,
}: {
  status: RequestStatus;
  className?: string;
  showIcon?: boolean;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <Badge
      variant="outline"
      title={meta.description}
      className={cn("gap-1 border-transparent ring-1", meta.className, className)}
    >
      {showIcon ? <Icon aria-hidden /> : null}
      {meta.label}
    </Badge>
  );
}

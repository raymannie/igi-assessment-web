"use client";

import { BriefcaseIcon, UserIcon } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants/statuses";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const ROLE_STYLES: Record<UserRole, string> = {
  CUSTOMER:
    "bg-zinc-100 text-zinc-700 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
  OFFICER:
    "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-900",
};

const ROLE_ICONS: Record<UserRole, typeof UserIcon> = {
  CUSTOMER: UserIcon,
  OFFICER: BriefcaseIcon,
};

export function RoleBadge({
  role,
  className,
  showIcon = true,
}: {
  role: UserRole;
  className?: string;
  showIcon?: boolean;
}) {
  const Icon = ROLE_ICONS[role];

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 border-transparent ring-1", ROLE_STYLES[role], className)}
    >
      {showIcon ? <Icon aria-hidden /> : null}
      {ROLE_LABELS[role]}
    </Badge>
  );
}

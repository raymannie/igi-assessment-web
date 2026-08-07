"use client";

import { ChartBarIcon, ListChecksIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { RequireRole } from "@/components/common/require-role";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";

const OFFICER_NAV: NavItem[] = [
  { href: "/officer/stats", label: "Dashboard", icon: ChartBarIcon },
  {
    href: "/officer",
    label: "Request queue",
    icon: ListChecksIcon,
    // Keep the queue highlighted while viewing a request under it. `/officer/stats`
    // is a longer match, so it still wins there.
    matchPrefix: true,
  },
];

function Shell({ children }: { children: ReactNode }) {
  const user = useAppSelector(selectCurrentUser);
  // RequireRole has already resolved the user before this renders.
  if (!user) return null;

  return (
    <AppShell user={user} nav={OFFICER_NAV} sectionLabel="Officer portal">
      {children}
    </AppShell>
  );
}

export function OfficerShell({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="OFFICER">
      <Shell>{children}</Shell>
    </RequireRole>
  );
}

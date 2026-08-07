"use client";

import { FilePlusIcon, SquaresFourIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { RequireRole } from "@/components/common/require-role";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";

const CUSTOMER_NAV: NavItem[] = [
  { href: "/dashboard", label: "My requests", icon: SquaresFourIcon },
  { href: "/requests/new", label: "New request", icon: FilePlusIcon },
];

function Shell({ children }: { children: ReactNode }) {
  const user = useAppSelector(selectCurrentUser);
  // RequireRole has already resolved the user before this renders.
  if (!user) return null;

  return (
    <AppShell user={user} nav={CUSTOMER_NAV} sectionLabel="Customer portal">
      {children}
    </AppShell>
  );
}

export function CustomerShell({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="CUSTOMER">
      <Shell>{children}</Shell>
    </RequireRole>
  );
}

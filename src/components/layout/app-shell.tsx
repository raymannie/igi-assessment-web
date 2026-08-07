"use client";

import { ListIcon, type Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/layout/logo";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  /** Match nested routes too, e.g. /requests/[id] under /requests. */
  matchPrefix?: boolean;
}

/**
 * Most specific match wins. Without this, a `matchPrefix` parent like `/officer`
 * would stay highlighted on `/officer/stats` alongside the child, so two nav
 * items would look active at once.
 */
function activeHref(pathname: string, items: NavItem[]): string | undefined {
  return items
    .filter(
      (item) =>
        pathname === item.href ||
        (item.matchPrefix && pathname.startsWith(`${item.href}/`)),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

function NavLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const current = activeHref(pathname, items);

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.href === current;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 px-2.5 py-2 text-xs transition-colors",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex-col items-center gap-2.5">
      <Logo className="h-10" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-xs text-muted-foreground">
          {subtitle}
        </span>
      </div>
    </div>
  );
}

/**
 * Sidebar on `md+`, a sheet triggered from the top bar below that. Serves both
 * portals — the caller supplies the nav items and the section label.
 */
export function AppShell({
  user,
  nav,
  sectionLabel,
  children,
}: {
  user: User;
  nav: NavItem[];
  sectionLabel: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-56 shrink-0 flex-col gap-6 border-r bg-muted/30 px-3 py-4 md:flex">
        <div className="px-2.5">
          <Brand subtitle={sectionLabel} />
        </div>
        <NavLinks items={nav} pathname={pathname} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-background px-3">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="md:hidden"
                    aria-label="Open navigation"
                  />
                }
              >
                <ListIcon aria-hidden />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 gap-6 px-3 py-4">
                <SheetHeader className="px-2.5 text-left">
                  <SheetTitle className="p-0">
                    <Brand subtitle={sectionLabel} />
                  </SheetTitle>
                </SheetHeader>
                <NavLinks
                  items={nav}
                  pathname={pathname}
                  onNavigate={() => setMobileNavOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <Logo className="h-6 md:hidden" />
            {/* <span className="truncate font-heading text-xs font-medium md:hidden">
              IGI Portal
            </span> */}
          </div>

          <UserMenu user={user} />
        </header>

        <main className="min-w-0 flex-1 px-3 py-4 sm:px-4 sm:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

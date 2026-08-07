"use client";

import { CaretDownIcon, SignOutIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { RoleBadge } from "@/components/layout/role-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import { useLogoutMutation } from "@/store/api/authApi";
import type { User } from "@/types";

export function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();

  const onLogout = async () => {
    // `logout` clears local auth state in its `finally`, so a failed network
    // call still signs the user out of the UI rather than leaving them stuck.
    await logout().unwrap().catch(() => undefined);
    toast.success("Signed out");
    router.replace("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-2 pr-1.5" />
        }
      >
        <Avatar className="size-5">
          <AvatarFallback className="text-[10px]">
            {initials(user.fullName)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-32 truncate sm:inline">
          {user.fullName}
        </span>
        <CaretDownIcon aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-56">
        {/*
          A plain header, not `DropdownMenuLabel` — Base UI's GroupLabel throws
          without a `Menu.Group` ancestor, and this labels the whole menu rather
          than a group of items.
        */}
        <div
          role="presentation"
          className="flex flex-col gap-1.5 px-2 py-2 text-xs text-muted-foreground"
        >
          <span className="font-medium">{user.fullName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
          <span className="flex items-center gap-1.5 pt-0.5">
            <RoleBadge role={user.role} />
            {user.policyNumber ? (
              <span className="text-xs font-normal text-muted-foreground">
                {user.policyNumber}
              </span>
            ) : null}
          </span>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled={isLoading} onClick={onLogout}>
          <SignOutIcon aria-hidden />
          {isLoading ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import type { VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A link that looks like a button.
 *
 * Deliberately styles a real `next/link` rather than rendering Base UI's Button
 * as an anchor: `<Button nativeButton={false} render={<Link/>}>` stamps
 * `role="button"` on the element, so something that navigates would announce
 * itself as a button and lose link affordances — Cmd/middle click, "open in new
 * tab", the status-bar URL preview. Sharing `buttonVariants` keeps it visually
 * identical to a Button.
 */
export function ButtonLink({
  className,
  variant,
  size,
  children,
  ...props
}: ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return (
    <Link
      data-slot="button-link"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Link>
  );
}

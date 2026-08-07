import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The IGI brand lockup. Always paired with the "IGI Portal" wordmark in the UI,
 * so the image itself is decorative (`alt=""`) — the adjacent text carries the
 * name for assistive tech.
 *
 * The artwork is dark blue on a transparent background, so it gets a white
 * plate in dark mode. Inverting instead would drop the brand colours, including
 * the red dot. Padding stays constant across themes so the box doesn't resize.
 *
 * Callers set the height (`h-8`, `h-12`, …); width follows the 138×100 ratio.
 */
export function Logo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo-138x100.png"
      alt=""
      width={138}
      height={100}
      priority={priority}
      className={cn(
        "w-auto shrink-0 object-contain p-0.5 dark:bg-white",
        className
      )}
    />
  );
}

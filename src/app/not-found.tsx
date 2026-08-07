import type { Metadata } from "next";

import { NotFoundActions } from "@/components/common/not-found-actions";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="font-heading text-sm text-muted-foreground">404</span>
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-base font-medium tracking-tight">
            We could not find that page
          </h1>
          <p className="text-xs text-muted-foreground">
            The link may be out of date, or the request may have been withdrawn.
            Check the address, or head back to your portal.
          </p>
        </div>
        {/* Client component: the destination depends on the signed-in role. */}
        <NotFoundActions />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";

import { CardListSkeleton } from "@/components/common/states";
import { OfficerQueueGate } from "@/components/requests/officer-queue-gate";

export const metadata: Metadata = {
  title: "Request queue",
  description: "Review, assign and decide claims and pre-authorization requests.",
};

export default function OfficerQueuePage() {
  return (
    // The queue reads its filters from the URL, so it needs a Suspense boundary.
    <Suspense fallback={<CardListSkeleton />}>
      <OfficerQueueGate />
    </Suspense>
  );
}

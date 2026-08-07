import type { Metadata } from "next";
import { Suspense } from "react";

import { CardListSkeleton } from "@/components/common/states";
import { RequestListView } from "@/components/requests/request-list-view";

export const metadata: Metadata = {
  title: "My requests",
  description: "Track the claims and pre-authorization requests you have submitted.",
};

export default function DashboardPage() {
  return (
    // The list reads its filters from the URL, so it needs a Suspense boundary.
    <Suspense fallback={<CardListSkeleton />}>
      <RequestListView />
    </Suspense>
  );
}

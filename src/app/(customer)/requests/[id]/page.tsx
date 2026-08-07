import type { Metadata } from "next";

import { RequestDetailView } from "@/components/requests/request-detail-view";

export const metadata: Metadata = {
  title: "Request",
  description: "Request details, documents and full audit trail.",
};

export default async function RequestDetailPage({
  params,
}: PageProps<"/requests/[id]">) {
  // `params` is a Promise in Next 16 — synchronous access was removed.
  const { id } = await params;
  return <RequestDetailView id={id} />;
}

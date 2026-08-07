import type { Metadata } from "next";

import { OfficerRequestDetailGate } from "@/components/requests/officer-request-detail-gate";

export const metadata: Metadata = {
  title: "Request assessment",
  description: "Assess a request, record a decision and read its audit trail.",
};

export default async function OfficerRequestDetailPage({
  params,
}: PageProps<"/officer/requests/[id]">) {
  // `params` is a Promise in Next 16 — synchronous access was removed.
  const { id } = await params;
  return <OfficerRequestDetailGate id={id} />;
}

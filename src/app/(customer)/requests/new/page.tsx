import type { Metadata } from "next";

import { NewRequestView } from "@/components/requests/new-request-view";

export const metadata: Metadata = {
  title: "New request",
  description: "Submit an insurance claim or an HMO pre-authorization request.",
};

export default function NewRequestPage() {
  return <NewRequestView />;
}

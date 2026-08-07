import type { Metadata } from "next";

import { StatsGate } from "@/components/stats/stats-gate";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Queue metrics for claims and pre-authorization officers.",
};

export default function OfficerStatsPage() {
  return <StatsGate />;
}

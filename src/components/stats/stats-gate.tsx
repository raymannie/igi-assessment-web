"use client";

import { StatsView } from "@/components/stats/stats-view";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";

/** The officer layout resolves the user before this renders. */
export function StatsGate() {
  const user = useAppSelector(selectCurrentUser);
  if (!user) return null;
  return <StatsView officer={user} />;
}

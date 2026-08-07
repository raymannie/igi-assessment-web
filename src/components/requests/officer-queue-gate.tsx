"use client";

import { OfficerQueueView } from "@/components/requests/officer-queue-view";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";

/**
 * Reads the resolved officer out of the store so the queue can compare
 * `assignedOfficer` against them. The officer layout guarantees a user is
 * present by the time this renders.
 */
export function OfficerQueueGate() {
  const user = useAppSelector(selectCurrentUser);
  if (!user) return null;
  return <OfficerQueueView officer={user} />;
}

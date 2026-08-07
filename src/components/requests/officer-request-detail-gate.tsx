"use client";

import { OfficerRequestDetailView } from "@/components/requests/officer-request-detail-view";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";

/** Supplies the resolved officer, who decides assignee-only affordances. */
export function OfficerRequestDetailGate({ id }: { id: string }) {
  const user = useAppSelector(selectCurrentUser);
  if (!user) return null;
  return <OfficerRequestDetailView id={id} officer={user} />;
}

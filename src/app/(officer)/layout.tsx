import { OfficerShell } from "@/components/layout/officer-shell";

// A route group layout sits at the root segment, so its typed path is "/".
export default function OfficerLayout({ children }: LayoutProps<"/">) {
  return <OfficerShell>{children}</OfficerShell>;
}

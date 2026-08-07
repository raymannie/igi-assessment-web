import { CustomerShell } from "@/components/layout/customer-shell";

export default function CustomerLayout({ children }: LayoutProps<"/">) {
  return <CustomerShell>{children}</CustomerShell>;
}

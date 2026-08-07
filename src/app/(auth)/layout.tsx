import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col justify-center items-center gap-3">
          <Logo className="h-12" priority />
          <div className="flex flex-col gap-1">
            {/* <span className="font-heading text-sm font-medium tracking-tight">
              IGI Portal
            </span> */}
            <span className="text-xs text-muted-foreground">
              Claims &amp; pre-authorization management
            </span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

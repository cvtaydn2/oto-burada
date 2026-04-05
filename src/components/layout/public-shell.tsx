import type { PropsWithChildren } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export function PublicShell({ children }: PropsWithChildren) {
  return (
    <>
      <SiteHeader />
      <div className="flex min-h-[calc(100vh-73px)] flex-col">
        <div className="flex-1 pb-24 lg:pb-0">{children}</div>
        <SiteFooter />
      </div>
      <MobileNav />
    </>
  );
}

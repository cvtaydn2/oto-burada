import type { PropsWithChildren } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { getCurrentUser } from "@/lib/auth/session";

export async function PublicShell({ children }: PropsWithChildren) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader user={user} />
      <div className="flex flex-col flex-1 pt-[68px]">
        <main className="flex-1 pb-24 lg:pb-0" role="main">
          {children}
        </main>
        <SiteFooter />
      </div>
      <MobileNav userId={user?.id ?? null} />
      <ScrollToTop />
    </div>
  );
}

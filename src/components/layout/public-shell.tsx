import type { PropsWithChildren } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ScrollToTop } from "@/components/shared/scroll-to-top";

export function PublicShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip navigation — visible on focus for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground focus:shadow-sm"
      >
        Ana içeriğe geç
      </a>
      <SiteHeader />
      <div className="flex flex-col flex-1 pt-[68px]">
        <main id="main-content" className="flex-1 pb-24 lg:pb-0" role="main">
          {children}
        </main>
        <SiteFooter />
      </div>
      <MobileNav />
      <ScrollToTop />
    </div>
  );
}

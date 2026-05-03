import type { PropsWithChildren } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";

export async function PublicShell({ children }: PropsWithChildren) {
  const references = await getLiveMarketplaceReferenceData();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground focus:shadow-sm"
      >
        Ana içeriğe geç
      </a>
      <SiteHeader searchSuggestions={references.searchSuggestions} />
      <div className="flex flex-1 flex-col pt-[68px]">
        <main id="main-content" className="flex-1 pb-28 lg:pb-0" role="main">
          {children}
        </main>
        <SiteFooter />
      </div>
      <MobileNav searchSuggestions={references.searchSuggestions} />
      <ScrollToTop />
    </div>
  );
}

import Link from "next/link";
import { CarFront } from "lucide-react";

import { SiteHeaderAuth } from "@/components/layout/site-header-auth";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";
import { HeaderMobileNav } from "./header-mobile-nav";
import { SearchWithSuggestions } from "@/components/ui/search-with-suggestions";
 
export async function SiteHeader() {
  const references = await getLiveMarketplaceReferenceData();

  return (
    <header className="sticky top-0 left-0 right-0 z-50 h-[68px] border-b border-slate-200/80 bg-white/98 backdrop-blur-sm" role="banner">
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between gap-2 px-3 sm:px-5 lg:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2 group shrink-0" aria-label="OtoBurada - Ana Sayfa">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500 text-white" aria-hidden="true">
              <CarFront size={18} className="stroke-[2.5]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-500">
              Oto<span className="text-slate-900">Burada</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 lg:flex">
            <Link href="/listings" className="hover:text-blue-500 transition-colors">İlanlar</Link>
            <Link href="/compare" className="hover:text-blue-500 transition-colors">Karşılaştır</Link>
          </nav>
        </div>

        <div className="hidden flex-1 max-w-lg mx-8 lg:flex relative">
          <SearchWithSuggestions
            placeholder="Marka, model veya kelime ara..."
            suggestions={references.searchSuggestions}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <SiteHeaderAuth
            favoritesHrefGuest="/favorites"
            postListingHrefAuthenticated="/dashboard/listings"
          />
          <HeaderMobileNav
            searchSuggestions={references.searchSuggestions}
          />
        </div>
      </div>
    </header>
  );
}

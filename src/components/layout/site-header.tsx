import { CarFront } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";
import { features } from "@/lib/features";

import { SiteHeaderAuth } from "@/components/layout/site-header-auth";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";
import { SearchWithSuggestions } from "@/components/ui/search-with-suggestions";
import { ThemeToggle } from "@/components/shared/theme-toggle";

// Arama önerileri ayrı Suspense boundary'de — header'ın geri kalanını bloklamaz
async function HeaderSearch() {
  const references = await getLiveMarketplaceReferenceData();
  return (
    <SearchWithSuggestions
      placeholder="Marka, model veya kelime ara..."
      suggestions={references.searchSuggestions}
      className="w-full"
    />
  );
}
 
export async function SiteHeader() {
  return (
    <header className="sticky top-0 left-0 right-0 z-50 h-[68px] border-b border-border/80 bg-background/98 backdrop-blur-sm" role="banner">
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between gap-2 px-3 sm:px-5 lg:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2 group shrink-0" aria-label="OtoBurada - Ana Sayfa">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500 text-white" aria-hidden="true">
              <CarFront size={18} className="stroke-[2.5]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-500">
              Oto<span className="text-foreground">Burada</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
            <Link href="/listings" className="hover:text-blue-500 transition-colors">İlanlar</Link>
            {features.compare && (
              <Link href="/compare" className="hover:text-blue-500 transition-colors">Karşılaştır</Link>
            )}
          </nav>
        </div>

        <div className="hidden flex-1 max-w-lg mx-8 lg:flex relative">
          <Suspense fallback={
            <div className="w-full h-10 rounded-full bg-gray-100 animate-pulse" />
          }>
            <HeaderSearch />
          </Suspense>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <SiteHeaderAuth
            favoritesHrefGuest="/favorites"
            postListingHrefAuthenticated="/dashboard/listings"
          />
          {/* Desktop dark mode toggle */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

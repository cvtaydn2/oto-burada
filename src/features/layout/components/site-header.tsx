import { CarFront } from "lucide-react";
import Link from "next/link";

import { DesktopNav } from "@/features/layout/components/desktop-nav";
import { SiteHeaderAuth } from "@/features/layout/components/site-header-auth";
import { ThemeToggle } from "@/features/shared/components/theme-toggle";
import { SearchWithSuggestions } from "@/features/ui/components/search-with-suggestions";
import type { SearchSuggestionItem } from "@/types";

interface SiteHeaderProps {
  searchSuggestions: SearchSuggestionItem[];
}

export async function SiteHeader({ searchSuggestions }: SiteHeaderProps) {
  return (
    <header
      className="sticky left-0 right-0 top-0 z-50 h-[68px] border-b border-border/80 bg-background/98 backdrop-blur-sm"
      role="banner"
    >
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between gap-2 px-4 sm:px-5 lg:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            prefetch={false}
            className="group shrink-0 flex items-center space-x-2"
            aria-label="OtoBurada - Ana Sayfa"
          >
            <div
              className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-5deg]"
              aria-hidden="true"
            >
              <CarFront size={18} className="stroke-[2.5]" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-primary transition-colors duration-300 group-hover:text-primary/90">
              Oto<span className="text-foreground">Burada</span>
            </span>
          </Link>

          <DesktopNav />
        </div>

        <div className="relative mx-8 hidden max-w-lg flex-1 lg:flex">
          <SearchWithSuggestions
            placeholder="Marka, model veya kelime ara..."
            suggestions={searchSuggestions}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <SiteHeaderAuth
            favoritesHrefGuest="/favorites"
            postListingHrefAuthenticated="/dashboard/listings"
          />
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

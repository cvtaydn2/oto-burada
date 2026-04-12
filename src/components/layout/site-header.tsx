import Link from "next/link";
import { headers } from "next/headers";
import { Bell, CarFront, Heart, PlusCircle, User, Zap } from "lucide-react";

import { getCurrentUser, getUserRole } from "@/lib/auth/session";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";
import { HeaderMobileNav } from "./header-mobile-nav";
import { SearchWithSuggestions } from "@/components/ui/search-with-suggestions";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NotificationDropdown } from "@/components/shared/notification-dropdown";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const references = await getLiveMarketplaceReferenceData();
  const isAdmin = user ? getUserRole(user) === "admin" : false;
  
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || ""; 
  // Note: x-pathname needs to be set in middleware if not available. 
  // If not available, we can use a Client Component wrapper.
  // For now, let's assume we want to show it everywhere EXCEPT homepage hero.
  
  const accountHref = user ? "/dashboard" : "/login";
  const favoritesHref = user ? "/dashboard/favorites" : "/favorites";
  const postListingHref = user ? "/dashboard/listings" : "/login";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl" role="banner">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group" aria-label="OtoBurada - Ana Sayfa">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 transition-all group-hover:scale-105 group-active:scale-95" aria-hidden="true">
                <CarFront size={22} className="stroke-[2]" />
              </div>
              <span className="text-xl font-black tracking-tighter text-foreground hidden sm:block">
                Oto<span className="text-primary italic">Burada</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            {pathname !== "/" && (
              <SearchWithSuggestions
                placeholder="Marka, model ara..."
                suggestions={references.searchSuggestions}
              />
            )}
          </div>

          <nav className="hidden md:flex items-center gap-1.5" aria-label="Ana navigasyon">
            <ThemeToggle />
            {user && <NotificationDropdown userId={user.id} />}
            
            <Link 
              href={favoritesHref} 
              className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
              title="Favoriler"
            >
              <Heart size={20} />
            </Link>

            {isAdmin && (
              <Link 
                href="/admin" 
                className="flex items-center justify-center h-10 px-4 rounded-xl text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
              >
                Admin
              </Link>
            )}

            <div className="h-6 w-px bg-border mx-2" />

            <Link 
              href={accountHref}
              className="flex items-center justify-center h-10 px-4 rounded-xl text-sm font-bold text-foreground border border-border hover:bg-secondary transition-all"
            >
              <User size={18} className="mr-2 text-muted-foreground" />
              {user ? "Hesabım" : "Giriş"}
            </Link>

            <Link 
              href={postListingHref} 
              className="flex items-center justify-center h-10 px-6 rounded-xl text-sm font-black text-white bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 active:scale-95 transition-all ml-1"
            >
              <PlusCircle size={18} className="mr-2" />
              İlan Ver
            </Link>
          </nav>

          <HeaderMobileNav
            user={user}
            isAdmin={isAdmin}
            accountHref={accountHref}
            favoritesHref={favoritesHref}
            postListingHref={postListingHref}
            searchSuggestions={references.searchSuggestions}
          />
        </div>
      </div>
    </header>
  );
}


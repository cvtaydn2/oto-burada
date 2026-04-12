import Link from "next/link";
import { headers } from "next/headers";
import { CarFront, Heart, PlusCircle, User } from "lucide-react";

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
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none px-4" role="banner">
      <div className="mx-auto w-full max-w-7xl glass rounded-[24px] pointer-events-auto h-20 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center px-6 gap-6 ring-1 ring-white/20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group shrink-0" aria-label="OtoBurada - Ana Sayfa">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] shadow-primary/40 transition-all group-hover:scale-105 group-hover:rotate-2 group-active:scale-95" aria-hidden="true">
              <CarFront size={26} className="stroke-[2.5]" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-foreground hidden sm:block">
              Oto<span className="text-primary italic">Burada</span>
            </span>
          </Link>
        </div>

        <div className="hidden lg:flex flex-1 max-w-lg mx-auto">
          {pathname !== "/" && (
            <SearchWithSuggestions
              placeholder="Marka, model ara..."
              suggestions={references.searchSuggestions}
              className="showroom-search"
            />
          )}
        </div>

        <nav className="hidden md:flex items-center gap-2" aria-label="Ana navigasyon">
          <ThemeToggle />
          {user && <NotificationDropdown userId={user.id} />}
          
          <Link 
            href={favoritesHref} 
            className="flex items-center justify-center w-12 h-12 rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all relative group"
            title="Favoriler"
          >
            <Heart size={22} className="group-hover:fill-primary/20 transition-all" />
          </Link>

          {isAdmin && (
            <Link 
              href="/admin" 
              className="flex items-center justify-center h-12 px-5 rounded-2xl text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            >
              Admin
            </Link>
          )}

          <div className="h-8 w-px bg-border/40 mx-2" />

          <Link 
            href={accountHref}
            className="flex items-center justify-center h-12 px-5 rounded-2xl text-sm font-black tracking-widest uppercase border border-border/40 hover:bg-secondary/50 hover:border-primary/20 transition-all"
          >
            <User size={18} className="mr-2.5 text-primary" />
            {user ? "Hesabım" : "Giriş"}
          </Link>

          <Link 
            href={postListingHref} 
            className="flex items-center justify-center h-12 px-7 rounded-2xl text-sm font-black uppercase tracking-tighter text-white bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-95 shadow-[0_10px_25px_-5px_rgba(var(--primary),0.4)] transition-all ml-2"
          >
            <PlusCircle size={18} className="mr-2.5" />
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
    </header>
  );
}


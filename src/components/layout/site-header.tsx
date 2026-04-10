import Link from "next/link";
import { Bell, CarFront, Heart, PlusCircle, User } from "lucide-react";

import { getCurrentUser, getUserRole } from "@/lib/auth/session";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";
import { HeaderMobileNav } from "./header-mobile-nav";
import { SearchWithSuggestions } from "@/components/ui/search-with-suggestions";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const references = await getLiveMarketplaceReferenceData();
  const isAdmin = user ? getUserRole(user) === "admin" : false;
  const accountHref = user ? "/dashboard" : "/login";
  const favoritesHref = user ? "/dashboard/favorites" : "/favorites";
  const postListingHref = user ? "/dashboard/listings" : "/login";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/80 backdrop-blur-xl" role="banner">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group" aria-label="OtoBurada - Ana Sayfa">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105" aria-hidden="true">
                <CarFront size={20} />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent hidden sm:block">
                OtoBurada
              </span>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <SearchWithSuggestions
              placeholder="Marka, model veya şehir ara..."
              suggestions={references.searchSuggestions}
            />
          </div>

          <nav className="hidden md:flex items-center gap-1" aria-label="Ana navigasyon">
            {user && (
              <Link 
                href="/dashboard/notifications" 
                className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all"
                title="Bildirimler"
              >
                <Bell size={20} />
              </Link>
            )}
            <Link 
              href={favoritesHref} 
              className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all"
              title="Favoriler"
            >
              <Heart size={20} />
            </Link>
            {isAdmin && (
              <Link 
                href="/admin" 
                className="flex items-center justify-center h-10 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all"
              >
                Admin
              </Link>
            )}
            <Link 
              href={accountHref}
              className="flex items-center justify-center h-10 px-5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
            >
              <User size={18} className="mr-2" />
              {user ? "Hesabım" : "Giriş"}
            </Link>
            <Link 
              href={postListingHref} 
              className="flex items-center justify-center h-10 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all ml-1"
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

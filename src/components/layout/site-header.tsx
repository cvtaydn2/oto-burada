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
  
  const accountHref = user ? "/dashboard" : "/login";
  const favoritesHref = user ? "/dashboard/favorites" : "/favorites";
  const postListingHref = user ? "/dashboard/listings" : "/login";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-20 flex items-center shadow-sm" role="banner">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12 flex items-center justify-between gap-8">
        {/* Logo & Main Nav */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2 group shrink-0" aria-label="OtoBurada - Ana Sayfa">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white" aria-hidden="true">
              <CarFront size={20} className="stroke-[2.5]" />
            </div>
            <span className="text-xl font-black tracking-tightest text-slate-900">
              Oto<span className="text-primary">Burada</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-bold text-slate-600 uppercase tracking-widest italic">
            <Link href="/listings" className="hover:text-primary transition-colors">İlanlar</Link>
            <Link href="/compare" className="hover:text-primary transition-colors">Karşılaştır</Link>
          </nav>
        </div>

        {/* Global Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-xl">
          <SearchWithSuggestions
            placeholder="Marka, model veya kelime ara..."
            suggestions={references.searchSuggestions}
            className="w-full bg-slate-50 border-none rounded-xl h-11 text-sm focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 pr-4 border-r border-slate-100">
             <Link 
               href={favoritesHref} 
               className="size-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-primary hover:bg-slate-50 transition-all"
               title="Favoriler"
             >
               <Heart size={20} />
             </Link>
             <Link 
               href="/dashboard/messages" 
               className="size-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-primary hover:bg-slate-50 transition-all"
               title="Mesajlar"
             >
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
             </Link>
          </div>

          <div className="flex items-center gap-3">
             <Link 
               href={accountHref}
               className="h-11 px-6 rounded-xl text-sm font-black tracking-tighter uppercase border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
             >
               {user ? (
                 <>
                   <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
                     {(user.user_metadata?.full_name as string)?.[0] || 'U'}
                   </div>
                   Hesabım
                 </>
               ) : "Giriş Yap"}
             </Link>

             <Link 
               href={postListingHref} 
               className="hidden sm:flex h-11 px-6 rounded-xl text-sm font-black uppercase tracking-tighter text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all items-center justify-center gap-2"
             >
               <PlusCircle size={18} />
               İlan Ver
             </Link>
          </div>

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


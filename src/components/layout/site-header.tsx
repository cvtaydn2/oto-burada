import Link from "next/link";
import { CarFront, Heart, MessageSquare, PlusCircle } from "lucide-react";

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
    <header className="sticky top-0 left-0 right-0 z-50 h-[68px] border-b border-slate-200/80 bg-white/98 backdrop-blur-sm" role="banner">
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between gap-4 px-5 lg:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="OtoBurada - Ana Sayfa">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white" aria-hidden="true">
              <CarFront size={18} className="stroke-[2]" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Oto<span className="text-primary">Burada</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 lg:flex">
            <Link href="/listings" className="hover:text-primary transition-colors">İlanlar</Link>
            <Link href="/compare" className="hover:text-primary transition-colors">Karşılaştır</Link>
          </nav>
        </div>

        <div className="hidden flex-1 max-w-lg lg:flex">
          <SearchWithSuggestions
            placeholder="Marka, model veya kelime ara..."
            suggestions={references.searchSuggestions}
            className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 text-sm font-medium focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1 border-r border-slate-200 pr-3 md:flex">
             <Link 
               href={favoritesHref} 
               className="flex size-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary transition-all"
               title="Favoriler"
             >
               <Heart size={18} />
             </Link>
             <Link 
               href="/dashboard/messages" 
               className="flex size-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary transition-all"
               title="Mesajlar"
             >
               <MessageSquare size={18} />
             </Link>
          </div>

          <div className="flex items-center gap-3">
             <Link 
               href={accountHref}
               className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
             >
               {user ? (
                 <>
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {(user.user_metadata?.full_name as string)?.[0] || 'U'}
                    </div>
                    Hesabım
                 </>
               ) : "Giriş Yap"}
             </Link>

             <Link 
               href={postListingHref} 
               className="hidden h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-white transition-all hover:bg-primary/90 sm:flex"
             >
               <PlusCircle size={16} />
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


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
    <header className="sticky top-0 left-0 right-0 z-50 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-sm" role="banner">
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group shrink-0" aria-label="OtoBurada - Ana Sayfa">
            <div className="flex size-7 items-center justify-center rounded-md bg-sky-500 text-white" aria-hidden="true">
              <CarFront size={16} className="stroke-[2.25]" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              Oto<span className="text-primary">Burada</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 lg:flex">
            <Link href="/listings" className="hover:text-primary transition-colors">İlanlar</Link>
            <Link href="/compare" className="hover:text-primary transition-colors">Karşılaştır</Link>
          </nav>
        </div>

        <div className="hidden flex-1 max-w-md lg:flex">
          <SearchWithSuggestions
            placeholder="Marka, model veya kelime ara..."
            suggestions={references.searchSuggestions}
            className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 text-sm focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 border-r border-slate-200 pr-2 md:flex">
             <Link 
               href={favoritesHref} 
               className="flex size-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-primary transition-all"
               title="Favoriler"
             >
               <Heart size={17} />
             </Link>
             <Link 
               href="/dashboard/messages" 
               className="flex size-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-primary transition-all"
               title="Mesajlar"
             >
               <MessageSquare size={17} />
             </Link>
          </div>

          <div className="flex items-center gap-3">
             <Link 
               href={accountHref}
               className="flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
             >
               {user ? (
                 <>
                  <div className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
                     {(user.user_metadata?.full_name as string)?.[0] || 'U'}
                   </div>
                   Hesabım
                 </>
               ) : "Giriş Yap"}
             </Link>

             <Link 
               href={postListingHref} 
               className="hidden h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white transition-all hover:bg-primary/90 sm:flex"
             >
               <PlusCircle size={15} />
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


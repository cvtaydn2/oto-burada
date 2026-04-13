import Link from "next/link";
import Image from "next/image";
import { CarFront, Heart, MessageSquare, PlusCircle } from "lucide-react";

import { getUserRole } from "@/lib/auth/session";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";
import { HeaderMobileNav } from "./header-mobile-nav";
import { SearchWithSuggestions } from "@/components/ui/search-with-suggestions";

interface SiteHeaderProps {
  user: Awaited<ReturnType<typeof import("@/lib/auth/session").getCurrentUser>>;
}

export async function SiteHeader({ user }: SiteHeaderProps) {
  const references = await getLiveMarketplaceReferenceData();
  const isAdmin = user ? getUserRole(user) === "admin" : false;
  
  const accountHref = user ? "/dashboard" : "/login";
  const favoritesHref = user ? "/dashboard/favorites" : "/favorites";
  const postListingHref = user ? "/dashboard/listings" : "/login";

  return (
    <header className="sticky top-0 left-0 right-0 z-50 h-[68px] border-b border-slate-200/80 bg-white/98 backdrop-blur-sm" role="banner">
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between gap-4 px-5 lg:px-6">
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

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 border-r border-gray-200 pr-4 md:flex">
             <Link 
               href={favoritesHref} 
               className="text-gray-500 hover:text-red-500 transition-colors"
               title="Favoriler"
             >
               <Heart size={22} strokeWidth={1.5} />
             </Link>
             <Link 
               href="/dashboard/messages" 
               className="text-gray-500 hover:text-blue-500 transition-colors"
               title="Mesajlar"
             >
               <MessageSquare size={22} strokeWidth={1.5} />
             </Link>
          </div>

          <div className="flex items-center gap-4">
             <Link 
               href={accountHref}
               className="flex items-center gap-2 group"
             >
               {user ? (
                 <div className="size-8 rounded-full border border-gray-200 overflow-hidden">
                    <Image 
                      src={`https://i.pravatar.cc/150?u=${user.id}`} 
                      alt="Profil" 
                      className="w-full h-full object-cover" 
                      width={32} 
                      height={32} 
                    />
                 </div>
               ) : (
                 <span className="text-sm font-medium text-gray-600 hover:text-blue-500 transition-colors">Giriş Yap</span>
               )}
             </Link>

             <Link 
               href={postListingHref} 
               className="hidden h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-4 text-sm font-bold text-white transition-all hover:bg-blue-600 sm:flex shadow-sm"
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

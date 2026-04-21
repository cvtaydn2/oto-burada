"use client";

import Link from "next/link";
import { Heart, PlusCircle, User as UserIcon, UserPlus } from "lucide-react";

import { useAuthUser } from "@/components/shared/auth-provider";
import { SearchWithSuggestions } from "@/components/ui/search-with-suggestions";
import type { SearchSuggestionItem } from "@/types";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface HeaderMobileNavProps {
  searchSuggestions: SearchSuggestionItem[];
}

const mobileQuickLinks = [
  { href: "/listings", label: "Tüm İlanlar" },
  { href: "/listings?transmission=otomatik", label: "Otomatik" },
  { href: "/listings?maxMileage=80000&sort=mileage_asc", label: "Düşük KM" },
  { href: "/listings?minYear=2020&sort=year_desc", label: "Yeni Model" },
] as const;

export function HeaderMobileNav({
  searchSuggestions,
}: HeaderMobileNavProps) {
  const { isAdmin, isAuthenticated, isReady } = useAuthUser();
  const accountHref = isAuthenticated ? "/dashboard" : "/login";
  const favoritesHref = isAuthenticated ? "/dashboard/favorites" : "/favorites";
  const postListingHref = isAuthenticated ? "/dashboard/listings" : "/login";

  return (
    <div className="p-4 space-y-6 pb-pb-safe">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Menü</h2>
        <ThemeToggle />
      </div>

      <SearchWithSuggestions
        placeholder="Marka, model veya şehir ara..."
        suggestions={searchSuggestions}
      />

      <div className="grid grid-cols-1 gap-2">
        <Link 
          href={accountHref}
          className="flex items-center h-14 px-4 rounded-2xl text-sm font-semibold text-foreground bg-muted/50 hover:bg-muted transition-all active:scale-[0.98]"
        >
          <UserIcon size={20} className="mr-3 text-muted-foreground" />
          {!isReady ? (
            <span className="h-4 w-16 rounded bg-muted animate-pulse inline-block" />
          ) : isAuthenticated ? "Hesabım" : "Giriş Yap"}
        </Link>

        {isReady && !isAuthenticated && (
          <Link
            href="/register"
            className="flex items-center h-14 px-4 rounded-2xl text-sm font-semibold text-foreground bg-muted/50 hover:bg-muted transition-all active:scale-[0.98]"
          >
            <UserPlus size={20} className="mr-3 text-muted-foreground" />
            Kayıt Ol
          </Link>
        )}

        <Link 
          href={favoritesHref}
          className="flex items-center h-14 px-4 rounded-2xl text-sm font-semibold text-foreground bg-muted/50 hover:bg-muted transition-all active:scale-[0.98]"
        >
          <Heart size={20} className="mr-3 text-muted-foreground" />
          Favoriler
        </Link>

        {isAdmin && (
          <Link 
            href="/admin"
            className="flex items-center h-14 px-4 rounded-2xl text-sm font-semibold text-foreground bg-muted/50 hover:bg-muted transition-all active:scale-[0.98]"
          >
            <PlusCircle size={20} className="mr-3 text-muted-foreground" />
            Admin Panel
          </Link>
        )}

        <Link 
          href={postListingHref}
          className="flex items-center justify-center h-14 px-4 rounded-2xl text-sm font-bold text-white bg-primary shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
        >
          <PlusCircle size={20} className="mr-2" />
          Ücretsiz İlan Ver
        </Link>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Hızlı Erişim</p>
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {mobileQuickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 px-5 py-2.5 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold whitespace-nowrap active:scale-95 transition-all"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

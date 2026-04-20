"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Menu, PlusCircle, User as UserIcon, UserPlus, X } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin, isAuthenticated, isReady } = useAuthUser();
  const accountHref = isAuthenticated ? "/dashboard" : "/login";
  const favoritesHref = isAuthenticated ? "/dashboard/favorites" : "/favorites";
  const postListingHref = isAuthenticated ? "/dashboard/listings" : "/login";

  return (
    <div className="md:hidden flex items-center gap-2">
      <ThemeToggle />
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-xl text-foreground hover:bg-muted transition-all"
        aria-label="Menüyü aç"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background border-b border-border shadow-sm animate-in slide-in-from-top-2">
          <div className="p-4 space-y-4">
            <SearchWithSuggestions
              placeholder="Marka, model veya şehir ara..."
              suggestions={searchSuggestions}
            />

            <div className="flex flex-col gap-2">
              <Link 
                href={accountHref}
                onClick={() => setIsOpen(false)}
                className="flex items-center h-12 px-4 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-all"
              >
                <UserIcon size={18} className="mr-3" />
                {/* isReady false iken "Giriş Yap" flash'ını önle */}
                {!isReady ? (
                  <span className="h-4 w-16 rounded bg-muted animate-pulse inline-block" />
                ) : isAuthenticated ? "Hesabım" : "Giriş Yap"}
              </Link>
              {/* Kayıt Ol linki sadece giriş yapılmamışsa göster */}
              {isReady && !isAuthenticated && (
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center h-12 px-4 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-all"
                >
                  <UserPlus size={18} className="mr-3" />
                  Kayıt Ol
                </Link>
              )}
              <Link 
                href={favoritesHref}
                onClick={() => setIsOpen(false)}
                className="flex items-center h-12 px-4 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-all"
              >
                <Heart size={18} className="mr-3" />
                Favoriler
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center h-12 px-4 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-all"
                >
                  Admin Panel
                </Link>
              )}
              <Link 
                href={postListingHref}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center h-12 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-all"
              >
                <PlusCircle size={18} className="mr-2" />
                İlan Ver
              </Link>
            </div>

            <div className="pt-2 border-t border-border">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mobileQuickLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="shrink-0 px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

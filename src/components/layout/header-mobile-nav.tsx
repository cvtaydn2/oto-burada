"use client";

import { PlusCircle } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SearchWithSuggestions } from "@/components/ui/search-with-suggestions";
import { useNavigation } from "@/hooks/use-navigation";
import type { SearchSuggestionItem } from "@/types";

interface HeaderMobileNavProps {
  searchSuggestions: SearchSuggestionItem[];
}

const mobileQuickLinks = [
  { href: "/listings", label: "Tüm İlanlar" },
  { href: "/listings?transmission=otomatik", label: "Otomatik" },
  { href: "/listings?maxMileage=80000&sort=mileage_asc", label: "Düşük KM" },
  { href: "/listings?minYear=2020&sort=year_desc", label: "Yeni Model" },
] as const;

export function HeaderMobileNav({ searchSuggestions }: HeaderMobileNavProps) {
  const { allItems, isReady, isAuthenticated, isLoading } = useNavigation();

  // "Hesabım" veya "Giriş" için özel href
  const accountHref = isAuthenticated ? "/dashboard" : "/login";
  const postListingHref = isAuthenticated ? "/dashboard/listings" : "/login";

  return (
    <div className="p-4 space-y-6 pb-safe">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Menü</h2>
        <ThemeToggle />
      </div>

      <SearchWithSuggestions
        placeholder="Marka, model veya şehir ara..."
        suggestions={searchSuggestions}
      />

      <div className="grid grid-cols-1 gap-2">
        {/* Auth Yükleniyor Durumu — Bu sırada Giriş/Kayıt listelenmemeli */}
        {isLoading && (
          <div className="space-y-2">
            <div className="h-14 w-full rounded-2xl bg-muted animate-pulse" />
            <div className="h-14 w-full rounded-2xl bg-muted animate-pulse opacity-50" />
          </div>
        )}

        {/* Ana Aksiyonlar (Sadece durum netleşince) */}
        {!isLoading &&
          allItems.map((item) => {
            const Icon = item.icon;

            // Ana sayfayı ve ilanları burada göstermeyelim (bottom nav'da varlar)
            if (["/", "/listings"].includes(item.href)) return null;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="flex items-center h-14 px-4 rounded-2xl text-sm font-semibold text-foreground bg-muted/50 hover:bg-muted transition-all active:scale-[0.98]"
              >
                <Icon size={20} className="mr-3 text-muted-foreground" />
                {item.label}
              </Link>
            );
          })}

        {/* İlan Ver Butonu (Her zaman en altta ve belirgin) */}
        <Link
          href={postListingHref}
          prefetch={false}
          className="flex items-center justify-center h-14 px-4 rounded-2xl text-sm font-bold text-white bg-primary shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
        >
          <PlusCircle size={20} className="mr-2" />
          Ücretsiz İlan Ver
        </Link>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Hızlı Erişim
        </p>
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {mobileQuickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
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

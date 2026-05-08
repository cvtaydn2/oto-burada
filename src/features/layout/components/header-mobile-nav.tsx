"use client";

import { PlusCircle } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/features/shared/components/theme-toggle";
import { SearchWithSuggestions } from "@/features/ui/components/search-with-suggestions";
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
  const { allItems, isAuthenticated, isLoading } = useNavigation();

  // "İlan Ver" için özel href
  const postListingHref = isAuthenticated ? "/dashboard/listings" : "/login";

  return (
    <div className="space-y-6 px-4 pb-safe pt-4">
      <div className="rounded-[1.4rem] border border-border/70 bg-card/95 p-4 shadow-sm shadow-slate-950/5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">
              Navigasyon
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">Menü</h2>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="rounded-[1.4rem] border border-border/70 bg-card/95 p-3 shadow-sm shadow-slate-950/5">
        <SearchWithSuggestions
          placeholder="Marka, model veya şehir ara..."
          suggestions={searchSuggestions}
        />
      </div>

      <div className="grid grid-cols-1 gap-2.5 rounded-[1.4rem] border border-border/70 bg-card/95 p-3 shadow-sm shadow-slate-950/5">
        {/* Auth Yükleniyor Durumu — Bu sırada Giriş/Kayıt listelenmemeli */}
        {isLoading && (
          <div className="space-y-2">
            <div className="h-14 w-full animate-pulse rounded-2xl bg-muted/80" />
            <div className="h-14 w-full animate-pulse rounded-2xl bg-muted/55" />
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
                className="flex h-14 items-center rounded-2xl border border-transparent bg-muted/35 px-4 text-sm font-semibold text-foreground shadow-sm shadow-transparent transition-all hover:border-border/70 hover:bg-muted/60 hover:shadow-slate-950/5 active:scale-[0.98]"
              >
                <Icon size={20} className="mr-3 text-muted-foreground/90" />
                {item.label}
              </Link>
            );
          })}

        {/* İlan Ver Butonu (Her zaman en altta ve belirgin) */}
        <Link
          href={postListingHref}
          prefetch={false}
          className="flex h-14 items-center justify-center rounded-2xl border border-primary/90 bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/95 active:scale-[0.98]"
        >
          <PlusCircle size={20} className="mr-2" />
          Ücretsiz İlan Ver
        </Link>
      </div>

      <div className="rounded-[1.4rem] border border-border/70 bg-card/95 p-4 shadow-sm shadow-slate-950/5">
        <p className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Hızlı Erişim
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {mobileQuickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="shrink-0 whitespace-nowrap rounded-full border border-border/70 bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm shadow-slate-950/5 transition-all active:scale-95"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

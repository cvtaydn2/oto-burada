"use client";

import Link from "next/link";
import { ArrowRight, Heart, Sparkles } from "lucide-react";

import { ListingCard } from "@/components/listings/listing-card";
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton";
import { useFavorites } from "@/hooks/use-favorites";
import { formatCurrency } from "@/lib/utils";
import type { Listing } from "@/types";

interface FavoritesPageClientProps {
  listings: Listing[];
}

export function FavoritesPageClient({ listings }: FavoritesPageClientProps) {
  const { favoriteIds, hydrated } = useFavorites();

  const favoriteListings = listings.filter((listing) =>
    favoriteIds.includes(listing.id),
  );
  const averageFavoritePrice =
    favoriteListings.length > 0
      ? Math.round(
          favoriteListings.reduce((total, listing) => total + listing.price, 0) /
            favoriteListings.length,
        )
      : 0;
  const lowMileageCount = favoriteListings.filter((listing) => listing.mileage <= 80_000).length;

  if (!hydrated) {
    return (
      <section className="space-y-5">
        <div className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-8 w-16 animate-pulse rounded bg-muted" />
        </div>
        <ListingsGridSkeleton count={4} />
      </section>
    );
  }

  if (favoriteListings.length === 0) {
    return (
      <section className="rounded-[2rem] border border-dashed border-border bg-background p-8 text-center shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
          Favoriler
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
          Henüz favori ilan eklemedin.
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          Beğendiğin ilanları kalp ikonuyla kaydedebilir, sonra burada hızlıca tekrar görebilirsin.
        </p>
        <Link
          href="/listings"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          İlanları İncele
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Heart className="size-3.5" />
              Favori ozeti
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Kaydettigin ilanlar burada</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                AI Studio dilinden uyarlanan bu alan, favori listenin genel durumunu tek bakista
                gormeni ve tekrar aksiyon almani kolaylastirir.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Toplam favori
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{favoriteListings.length}</p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Ortalama fiyat
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {formatCurrency(averageFavoritePrice)}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Dusuk km
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{lowMileageCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-background p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="size-4" />
              Hemen devam et
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Kaydettigin ilanlardan birini secip detaylari yeniden kontrol et ya da yeni
              favoriler eklemek icin listeye geri don.
            </p>
            <Link
              href="/listings"
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Yeni ilanlara bak
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {favoriteListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}

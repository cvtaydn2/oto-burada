"use client";

import Link from "next/link";
import { ArrowRight, Heart, LogIn } from "lucide-react";

import { ListingCard } from "@/components/listings/listing-card";
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton";
import { useFavorites } from "@/hooks/use-favorites";
import { formatCurrency } from "@/lib/utils";
import type { Listing } from "@/types";

interface FavoritesPageClientProps {
  listings: Listing[];
  userId?: string;
}

export function FavoritesPageClient({ listings, userId }: FavoritesPageClientProps) {
  const { favoriteIds, hydrated } = useFavorites();
  const isGuest = !userId;

  const favoriteListings = listings.filter((listing) =>
    favoriteIds.includes(listing.id),
  );
  const avgPrice =
    favoriteListings.length > 0
      ? Math.round(
          favoriteListings.reduce((total, l) => total + l.price, 0) /
            favoriteListings.length,
        )
      : 0;

  if (!hydrated) {
    return <ListingsGridSkeleton count={4} />;
  }

  if (favoriteListings.length === 0) {
    return (
      <div className="space-y-4">
        {isGuest ? (
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-6 text-center">
            <LogIn className="mx-auto size-8 text-amber-600" />
            <h2 className="mt-3 text-lg font-semibold">Favorilerin bu cihazda saklanir</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Begendigin ilanlari kalp ikonuyla kaydedebilirsin. Giris yaparsan cihazlar arasinda
              senkronize edilir.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Link
                href="/login"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Giriş Yap
              </Link>
            </div>
          </div>
        ) : null}
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <Heart className="mx-auto size-8 text-muted-foreground/50" />
          <h2 className="mt-3 text-lg font-semibold">Favori yok</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isGuest
              ? "İlanları inceleyip beğendiklerini bu cihazda kaydedebilirsin."
              : "İlanları inceleyip beğendiklerinizi kaydedebilirsiniz."}
          </p>
          <Link
            href="/listings"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            İlanlara Git
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isGuest ? (
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-800">Favorilerin bu cihazda saklanir</p>
              <p className="mt-1 text-sm text-amber-900/80">
                Giris yaparsan kaydettigin ilanlar tum cihazlarda senkronize olur.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-background p-4">
          <div className="text-xs font-medium uppercase text-muted-foreground">
            Toplam
          </div>
          <p className="mt-1 text-2xl font-semibold">{favoriteListings.length}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background p-4">
          <div className="text-xs font-medium uppercase text-muted-foreground">
            Ortalama
          </div>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(avgPrice)}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background p-4">
          <div className="text-xs font-medium uppercase text-muted-foreground">
            Düşük Km
          </div>
          <p className="mt-1 text-2xl font-semibold">
            {favoriteListings.filter((l) => l.mileage <= 80000).length}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {favoriteListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      <Link
        href="/listings"
        className="flex items-center justify-center gap-2 rounded-lg border border-border p-3 text-sm font-medium hover:bg-muted"
      >
        Yeni ilanlara bak
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

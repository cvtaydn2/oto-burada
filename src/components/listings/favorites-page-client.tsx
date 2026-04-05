"use client";

import Link from "next/link";

import { ListingCard } from "@/components/listings/listing-card";
import { useFavorites } from "@/hooks/use-favorites";
import type { Listing } from "@/types";

interface FavoritesPageClientProps {
  listings: Listing[];
}

export function FavoritesPageClient({ listings }: FavoritesPageClientProps) {
  const { favoriteIds, hydrated } = useFavorites();

  const favoriteListings = listings.filter((listing) =>
    favoriteIds.includes(listing.id),
  );

  if (!hydrated) {
    return (
      <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm text-muted-foreground">Favoriler yükleniyor...</p>
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
      <div className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Toplam favori</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{favoriteListings.length}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {favoriteListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}

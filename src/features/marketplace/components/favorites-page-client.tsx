"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Heart, RefreshCw, SortAsc } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { useFavorites } from "@/components/shared/favorites-provider";
import { ListingsGridSkeleton } from "@/features/marketplace/components/listings-grid-skeleton";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types";

import { FavoriteCard } from "./favorites/favorite-card";
import { FavoritesStats } from "./favorites/favorites-stats";
import { GuestBanner } from "./favorites/guest-banner";

interface FavoritesPageClientProps {
  listings: Listing[];
  userId?: string;
}

type SortKey = "newest" | "price_asc" | "price_desc" | "mileage_asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "En Yeni" },
  { value: "price_asc", label: "Fiyat (Düşük → Yüksek)" },
  { value: "price_desc", label: "Fiyat (Yüksek → Düşük)" },
  { value: "mileage_asc", label: "Kilometre (Az → Çok)" },
];

export function FavoritesPageClient({ listings, userId }: FavoritesPageClientProps) {
  const { favoriteIds, hydrated, toggleFavorite } = useFavorites();
  const [sort, setSort] = useState<SortKey>("newest");
  const isGuest = !userId;
  const queryClient = useQueryClient();

  const { refreshing, pullDistance, isActive } = usePullToRefresh({
    threshold: 80,
    onRefresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const favoriteListings = useMemo(
    () => listings.filter((l) => favoriteIdSet.has(l.id)),
    [listings, favoriteIdSet]
  );

  const sortedListings = useMemo(() => {
    const copy = [...favoriteListings];
    switch (sort) {
      case "price_asc":
        return copy.sort((a, b) => a.price - b.price);
      case "price_desc":
        return copy.sort((a, b) => b.price - a.price);
      case "mileage_asc":
        return copy.sort((a, b) => a.mileage - b.mileage);
      default:
        return copy.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [favoriteListings, sort]);

  const stats = useMemo(() => {
    if (favoriteListings.length === 0) return null;
    const prices = favoriteListings.map((l) => l.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
    const withExpert = favoriteListings.filter((l) => l.expertInspection?.hasInspection).length;
    const lowMileage = favoriteListings.filter((l) => l.mileage <= 80_000).length;
    return { minPrice, maxPrice, avgPrice, withExpert, lowMileage };
  }, [favoriteListings]);

  if (!hydrated) return <ListingsGridSkeleton count={4} />;

  if (favoriteListings.length === 0) {
    return (
      <div className="space-y-6">
        {isGuest && <GuestBanner />}
        <EmptyState
          title="Henüz Favori İlan Yok"
          description="İlanları gezerken kalp ikonuna tıklayarak buraya ekleyebilirsin. Favorilerin tüm cihazlarda senkronize olur."
          icon={<Heart size={40} />}
          primaryAction={{
            label: "İlanları Keşfet",
            onClick: () => {},
            href: "/listings",
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {isActive && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-4 bg-background/95 backdrop-blur-sm transition-transform"
          style={{ transform: `translateY(${Math.min(pullDistance, 80)}px)` }}
          aria-live="polite"
        >
          <RefreshCw className={cn("size-6 text-primary", refreshing && "animate-spin")} />
        </div>
      )}

      {isGuest && <GuestBanner compact />}

      {stats && <FavoritesStats totalCount={favoriteListings.length} stats={stats} />}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          <span className="font-bold text-foreground">{favoriteListings.length}</span> favori ilan
        </p>
        <div className="flex items-center gap-2">
          <SortAsc size={15} className="text-muted-foreground/70" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sıralama seçeneği"
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/90 outline-none focus:border-blue-400 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sortedListings.map((listing, i) => (
          <FavoriteCard
            key={listing.id}
            listing={listing}
            priority={i < 3}
            onRemove={() => toggleFavorite(listing.id)}
          />
        ))}
      </div>

      <Link
        href="/listings"
        className="group flex items-center justify-between rounded-2xl border border-border bg-card px-6 py-4 transition hover:border-blue-300 hover:shadow-sm"
      >
        <div>
          <p className="text-sm font-bold text-foreground">Daha fazla ilan keşfet</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">Binlerce araç seni bekliyor</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted/30 text-muted-foreground transition group-hover:bg-blue-600 group-hover:text-white">
          <ArrowRight size={18} />
        </div>
      </Link>
    </div>
  );
}

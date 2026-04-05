"use client";

import { Heart } from "lucide-react";

import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  listingId: string;
  className?: string;
}

export function FavoriteButton({
  listingId,
  className,
}: FavoriteButtonProps) {
  const { hydrated, isFavorite, toggleFavorite } = useFavorites();
  const active = hydrated && isFavorite(listingId);

  return (
    <button
      type="button"
      aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-pressed={active}
      disabled={!hydrated}
      onClick={() => toggleFavorite(listingId)}
      className={cn(
        "flex items-center justify-center rounded-full border border-border/70 bg-background/95 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        active && "border-primary/30 bg-primary/10 text-primary",
        className,
      )}
    >
      <Heart className={cn("size-4", active && "fill-current")} />
    </button>
  );
}

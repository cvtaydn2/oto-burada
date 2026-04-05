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
      onClick={() => toggleFavorite(listingId)}
      className={cn(
        "flex items-center justify-center rounded-full border border-border/70 bg-background/95 text-foreground shadow-sm transition-colors hover:bg-background",
        active && "border-primary/30 bg-primary/10 text-primary",
        className,
      )}
    >
      <Heart className={cn("size-4", active && "fill-current")} />
    </button>
  );
}

"use client";

import { Heart, LogIn } from "lucide-react";
import Link from "next/link";

import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  listingId: string;
  className?: string;
  showGuestHint?: boolean;
}

export function FavoriteButton({
  listingId,
  className,
  showGuestHint = true,
}: FavoriteButtonProps) {
  const { hydrated, isFavorite, toggleFavorite } = useFavorites();
  const active = hydrated && isFavorite(listingId);

  const handleClick = () => {
    toggleFavorite(listingId);
  };

  return (
    <div className="relative group">
      <button
        type="button"
        aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
        aria-pressed={active}
        disabled={!hydrated}
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center rounded-full border border-border/70 bg-background/95 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
          active && "border-primary/30 bg-primary/10 text-primary",
          className,
        )}
      >
        <Heart className={cn("size-4", active && "fill-current")} />
      </button>
      {showGuestHint && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Favori olarak kaydetmek için giriş yap
          <Link
            href="/login"
            className="ml-2 inline-flex items-center text-indigo-300 hover:text-white"
          >
            <LogIn className="size-3 mr-1" />
            Giriş
          </Link>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

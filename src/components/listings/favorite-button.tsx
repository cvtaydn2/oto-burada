"use client";

import { Heart, LogIn } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useFavorites } from "@/components/shared/favorites-provider";
import { Button } from "@/components/ui/button";
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
  const { hydrated, isAuthenticated, isFavorite, toggleFavorite } = useFavorites();
  const active = hydrated && isFavorite(listingId);
  const [showHint, setShowHint] = useState(false);
  const [announcement, setAnnouncement] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      toggleFavorite(listingId);
      setShowHint(true);
      setAnnouncement("Favori yerel olarak kaydedildi.");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowHint(false), 3000);
      return;
    }

    toggleFavorite(listingId);
    setAnnouncement(active ? "Favorilerden çıkarıldı" : "Favorilere eklendi");
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <Button
        type="button"
        aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
        aria-pressed={active}
        disabled={!hydrated}
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center rounded-full border border-border/70 bg-background/95 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
          "size-11",
          active && "border-primary/30 bg-primary/10 text-primary",
          className
        )}
      >
        <Heart
          className={cn("size-4 transition-all duration-300", active && "fill-current scale-110")}
          aria-hidden="true"
        />
        <span className="sr-only" aria-live="polite">
          {announcement}
        </span>
      </Button>
      {showGuestHint && !isAuthenticated && showHint && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          Bu cihazda kaydedilir. Giriş yaparsan favorilerin tüm cihazlarda senkronize olur.
          <Link
            href="/login"
            className="mt-2 inline-flex items-center text-indigo-300 hover:text-white"
          >
            <LogIn className="mr-1 size-3" />
            Giriş
          </Link>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

"use client";

import { Heart, LogIn } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useFavorites } from "@/features/shared/components/favorites-provider";
import { Button } from "@/features/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/ui/components/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/features/ui/components/tooltip";
import { cn } from "@/lib";

interface FavoriteButtonProps {
  listingId: string;
  className?: string;
  showGuestHint?: boolean;
}

export function FavoriteButton({
  listingId,
  className,
  showGuestHint = true, // We will keep it but use it in the condition
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

  const isGuestHintOpen = Boolean(showGuestHint && !isAuthenticated && showHint);

  return (
    <TooltipProvider>
      <Tooltip>
        <Popover open={isGuestHintOpen} onOpenChange={setShowHint}>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                type="button"
                aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
                aria-pressed={active}
                disabled={!hydrated}
                onClick={handleClick}
                className={cn(
                  "flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border/70 bg-background/95 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
                  "size-11",
                  active && "border-primary/30 bg-primary/10 text-primary",
                  className
                )}
              >
                <Heart
                  className={cn(
                    "size-4 transition-all duration-300",
                    active && "fill-current scale-110"
                  )}
                  aria-hidden="true"
                />
                <span className="sr-only" aria-live="polite">
                  {announcement}
                </span>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent sideOffset={4}>
            {active ? "Favorilerden çıkar" : "Favorilere ekle"}
          </TooltipContent>
          <PopoverContent
            side="top"
            align="center"
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="relative z-50 w-64 overflow-visible rounded-2xl border-none bg-slate-900 p-3 text-xs text-white shadow-sm"
          >
            <div className="flex flex-col gap-2.5">
              <span className="leading-5 text-slate-100">
                Bu cihazda kaydedilir. Giriş yaparsan favorilerin tüm cihazlarda senkronize olur.
              </span>
              <Link
                href="/login"
                className="inline-flex min-h-9 items-center gap-1 rounded-lg text-indigo-300 transition hover:text-white"
              >
                <LogIn className="size-3.5" />
                Giriş
              </Link>
            </div>
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-slate-900" />
          </PopoverContent>
        </Popover>
      </Tooltip>
    </TooltipProvider>
  );
}

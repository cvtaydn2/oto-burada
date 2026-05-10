"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ListingCard } from "@/components/shared/listing-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types";

interface FeaturedCarouselProps {
  listings: Listing[];
  className?: string;
}

export function FeaturedCarousel({ listings, className }: FeaturedCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: listings.length > 1,
    align: "start",
    skipSnaps: false,
    dragFree: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(listings.length);

  const hasMultipleItems = listings.length > 1;

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const syncState = useCallback(() => {
    if (!emblaApi) return;

    setSelectedIndex(emblaApi.selectedScrollSnap());
    setSnapCount(emblaApi.scrollSnapList().length || listings.length);
  }, [emblaApi, listings.length]);

  useEffect(() => {
    if (!emblaApi) return;

    // Sync initial state asynchronously to prevent React concurrent warning
    queueMicrotask(() => syncState());

    emblaApi.on("select", syncState);
    emblaApi.on("reInit", syncState);

    return () => {
      emblaApi.off("select", syncState);
      emblaApi.off("reInit", syncState);
    };
  }, [emblaApi, syncState]);

  const mobileIndicators = useMemo(() => {
    if (snapCount <= 1) return [];

    const windowSize = Math.min(5, snapCount);
    const half = Math.floor(windowSize / 2);

    let start = Math.max(0, selectedIndex - half);
    const end = Math.min(snapCount, start + windowSize);

    if (end - start < windowSize) {
      start = Math.max(0, end - windowSize);
    }

    return Array.from({ length: end - start }, (_, offset) => start + offset);
  }, [selectedIndex, snapCount]);

  if (listings.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">Premium Vitrin Akışı</h2>
            <p className="text-xs text-muted-foreground">
              Bu ilanlar satın alınan görünürlük paketleriyle burada gösterilir.
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!hasMultipleItems}
            className="size-9 rounded-xl"
            aria-label="Önceki premium ilanlara git"
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!hasMultipleItems}
            className="size-9 rounded-xl"
            aria-label="Sonraki premium ilanlara git"
          >
            <ChevronRight size={18} />
          </Button>
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!hasMultipleItems}
            className="size-10 rounded-full"
            aria-label="Önceki premium ilanlara git"
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!hasMultipleItems}
            className="size-10 rounded-full"
            aria-label="Sonraki premium ilanlara git"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between sm:hidden">
        <p className="text-xs font-medium text-muted-foreground">Kaydırarak incele</p>
        <span className="text-xs text-muted-foreground">
          {Math.min(selectedIndex + 1, snapCount)} / {snapCount}
        </span>
      </div>

      <div className="overflow-hidden" ref={emblaRef} aria-roledescription="carousel">
        <div className="flex gap-3 sm:gap-4">
          {listings.map((listing, index) => (
            <div
              key={listing.id}
              className="min-w-0 flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%] xl:flex-[0_0_23%]"
              aria-roledescription="slide"
              aria-label={`${index + 1}. premium ilan`}
            >
              <ListingCard listing={listing} priority={index < 2} />
            </div>
          ))}
        </div>
      </div>

      {mobileIndicators.length > 1 && (
        <div
          className="mt-4 flex items-center justify-center gap-2 sm:hidden"
          role="group"
          aria-label="Premium vitrin konum göstergesi"
        >
          {mobileIndicators.map((snapIndex) => (
            <button
              key={snapIndex}
              type="button"
              onClick={() => emblaApi?.scrollTo(snapIndex)}
              className={cn(
                "rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                selectedIndex === snapIndex ? "h-2 w-6 bg-primary" : "size-2 bg-muted-foreground/30"
              )}
              aria-label={`Premium vitrin ${snapIndex + 1}. öğeye git`}
              aria-current={selectedIndex === snapIndex ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

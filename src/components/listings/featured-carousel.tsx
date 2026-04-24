"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ListingCard } from "@/components/shared/listing-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types";

interface FeaturedCarouselProps {
  listings: Listing[];
  className?: string;
}

/**
 * Featured Carousel Component
 * Displays gallery-priority listings in a horizontal carousel.
 * Used on homepage to showcase premium doping listings.
 */
export function FeaturedCarousel({ listings, className }: FeaturedCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    skipSnaps: false,
    dragFree: false,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    // Initialize scroll state
    const initScrollState = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    initScrollState();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (listings.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Vitrin Galerisi</h2>
            <p className="text-xs text-muted-foreground">Öne çıkan premium ilanlar</p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="size-9 rounded-xl"
            aria-label="Önceki"
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="size-9 rounded-xl"
            aria-label="Sonraki"
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 sm:gap-5">
          {listings.map((listing, index) => (
            <div
              key={listing.id}
              className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%] xl:flex-[0_0_23%] min-w-0"
            >
              <ListingCard listing={listing} priority={index < 2} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Navigation Dots */}
      <div className="flex sm:hidden justify-center gap-2 mt-4">
        {listings.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "size-2 rounded-full transition-all",
              emblaApi?.selectedScrollSnap() === index ? "bg-primary w-6" : "bg-muted-foreground/30"
            )}
            aria-label={`Slayt ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

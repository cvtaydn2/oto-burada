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

export function FeaturedCarousel({ listings, className }: FeaturedCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    skipSnaps: false,
    dragFree: false,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

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
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const initScrollState = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
      setSelectedIndex(emblaApi.selectedScrollSnap());
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">Vitrin Galerisi</h2>
            <p className="text-xs text-muted-foreground">Öne çıkan premium ilanlar</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
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

      <div className="mb-3 flex items-center justify-between sm:hidden">
        <p className="text-xs font-medium text-muted-foreground">Kaydırarak incele</p>
        <span className="text-xs text-muted-foreground">
          {selectedIndex + 1} / {listings.length}
        </span>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 sm:gap-5">
          {listings.map((listing, index) => (
            <div
              key={listing.id}
              className="min-w-0 flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%] xl:flex-[0_0_23%]"
            >
              <ListingCard listing={listing} priority={index < 2} />
            </div>
          ))}
        </div>
      </div>

      <div
        className="mt-4 flex justify-center gap-2 sm:hidden"
        role="tablist"
        aria-label="Vitrin galeri slaytları"
      >
        {listings.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "rounded-full transition-all",
              selectedIndex === index ? "h-2 w-6 bg-primary" : "size-2 bg-muted-foreground/30"
            )}
            aria-label={`Slayt ${index + 1}`}
            aria-current={selectedIndex === index ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Rotate3d, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Listing360View } from "@/features/marketplace/components/listing-360-view";
import { supabaseImageUrl } from "@/lib/utils/image";
import type { ListingImage } from "@/types";

const ListingGalleryLightbox = dynamic(() =>
  import("@/features/marketplace/components/listing-gallery-lightbox").then(
    (mod) => mod.ListingGalleryLightbox
  )
);

import { SafeImage } from "@/components/shared/safe-image";

interface ListingGalleryProps {
  images: ListingImage[];
  title: string;
  /** Legacy override — auto-detected from images with type="360" */
  has360View?: boolean;
}

export function ListingGallery({ images, title, has360View = false }: ListingGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [is360Open, setIs360Open] = useState(false);

  // Auto-detect 360° image
  const panoramaImage = images.find((img) => img.type === "360");
  const show360Button = has360View || Boolean(panoramaImage);
  const panoramaUrl = panoramaImage?.url ?? "";

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    containScroll: "trimSnaps",
  });

  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
      if (thumbApi) thumbApi.scrollTo(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, thumbApi]);

  const onThumbClick = (index: number) => {
    if (!emblaApi || !thumbApi) return;
    emblaApi.scrollTo(index);
  };

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] sm:aspect-[16/9] bg-muted rounded-2xl flex items-center justify-center">
        <p className="text-muted-foreground/70">Görsel bulunamadı</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
        <div className="space-y-3 p-3 sm:space-y-4 sm:p-5 lg:p-6">
          {/* Main Viewport */}
          <div className="relative group">
            <div className="overflow-hidden rounded-2xl bg-muted touch-pan-y" ref={emblaRef}>
              <div className="flex">
                {images.map((image, index) => (
                  <div
                    key={image.id || image.url}
                    className="relative flex-[0_0_100%] min-w-0 aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/10]"
                  >
                    <SafeImage
                      src={supabaseImageUrl(image.url, 1200, 85)}
                      alt={`${title} - ${index + 1}`}
                      fill
                      priority={index === 0}
                      sizes="(min-width: 1280px) 65vw, 100vw"
                      placeholder={image.placeholderBlur ? "blur" : "empty"}
                      blurDataURL={image.placeholderBlur ?? undefined}
                      className="object-cover cursor-pointer"
                      onClick={() => setIsLightboxOpen(true)}
                    />
                    {/* 360° badge on panoramic images */}
                    {image.type === "360" && (
                      <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none">
                        <Rotate3d size={11} />
                        360°
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows (Desktop Only) */}
            {images.length > 1 && (
              <>
                <Button
                  onClick={scrollPrev}
                  aria-label="Önceki"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/90 backdrop-blur-md hidden sm:flex items-center justify-center text-foreground/90 opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-card z-10"
                >
                  <ChevronLeft size={24} />
                </Button>
                <Button
                  onClick={scrollNext}
                  aria-label="Sonraki"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/90 backdrop-blur-md hidden sm:flex items-center justify-center text-foreground/90 opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-card z-10"
                >
                  <ChevronRight size={24} />
                </Button>
              </>
            )}

            {/* Overlay Indicators */}
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-end justify-between gap-2 px-3 sm:bottom-4 sm:px-6">
              <div className="rounded-full bg-black/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest italic text-white backdrop-blur-md">
                {currentIndex + 1} / {images.length}
              </div>
              <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
                <Button
                  onClick={() => setIsLightboxOpen(true)}
                  className="h-9 rounded-full bg-card/90 px-3 text-[10px] font-bold uppercase tracking-widest italic text-foreground shadow-sm transition-all hover:bg-card sm:h-auto sm:px-4 sm:py-2.5"
                >
                  Tam Ekran
                  <Sparkles size={12} className="text-primary" />
                </Button>
                {show360Button && (
                  <Button
                    onClick={() => setIs360Open(true)}
                    className="h-9 rounded-full bg-blue-500 px-3 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-blue-600 sm:h-auto sm:px-4 sm:py-2.5"
                  >
                    <Rotate3d size={12} />
                    360° Görünüm
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="hidden overflow-hidden py-2 sm:block" ref={thumbRef}>
            <div className="flex gap-2 sm:gap-3">
              {images.map((image, index) => (
                <Button
                  key={image.id || image.url}
                  onClick={() => onThumbClick(index)}
                  className={`relative flex-[0_0_64px] sm:flex-[0_0_100px] md:flex-[0_0_120px] aspect-square rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all touch-manipulation ${
                    index === currentIndex
                      ? "border-primary ring-2 ring-primary/30 scale-95"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <SafeImage
                    src={supabaseImageUrl(image.url, 150, 70)}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                    placeholder={image.placeholderBlur ? "blur" : "empty"}
                    blurDataURL={image.placeholderBlur ?? undefined}
                  />
                  {image.type === "360" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Rotate3d size={14} className="text-white" />
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ListingGalleryLightbox
        currentIndex={currentIndex}
        images={images}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNext={() => emblaApi?.scrollNext()}
        onPrev={() => emblaApi?.scrollPrev()}
        title={title}
      />

      <Listing360View
        isOpen={is360Open}
        imageUrl={panoramaUrl}
        onClose={() => setIs360Open(false)}
      />
    </>
  );
}

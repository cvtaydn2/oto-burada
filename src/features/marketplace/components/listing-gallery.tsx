"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Rotate3d, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { type KeyboardEvent, useEffect, useId, useState } from "react";

import { SafeImage } from "@/components/shared/safe-image";
import { Button } from "@/components/ui/button";
import { Listing360View } from "@/features/marketplace/components/listing-360-view";
import { useAnalytics } from "@/hooks/use-analytics";
import { supabaseImageUrl } from "@/lib/utils/image";
import type { ListingImage } from "@/types";

const ListingGalleryLightbox = dynamic(() =>
  import("@/features/marketplace/components/listing-gallery-lightbox").then(
    (mod) => mod.ListingGalleryLightbox
  )
);

interface ListingGalleryProps {
  images: ListingImage[];
  title: string;
  listingId?: string;
  /** Legacy override — auto-detected from images with type="360" */
  has360View?: boolean;
}

export function ListingGallery({
  images,
  title,
  listingId,
  has360View = false,
}: ListingGalleryProps) {
  const { track } = useAnalytics();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [is360Open, setIs360Open] = useState(false);
  const galleryHeadingId = useId();

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
      const selectedIndex = emblaApi.selectedScrollSnap();
      setCurrentIndex(selectedIndex);
      thumbApi?.scrollTo(selectedIndex);

      if (listingId) {
        track("image_gallery_interaction", {
          listing_id: listingId,
          image_index: selectedIndex,
          total_images: images.length,
        });
      }
    };

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, thumbApi, listingId, images.length, track]);

  const onThumbClick = (index: number) => {
    if (!emblaApi) return;
    emblaApi.scrollTo(index);
  };

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  const openLightbox = () => setIsLightboxOpen(true);
  const closeLightbox = () => setIsLightboxOpen(false);

  const open360View = () => {
    if (!show360Button || !panoramaUrl) return;
    setIs360Open(true);
  };
  const close360View = () => setIs360Open(false);

  const onViewportKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!emblaApi || images.length <= 1) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollPrev();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollNext();
    }
  };

  if (images.length === 0) {
    return (
      <section
        aria-labelledby={galleryHeadingId}
        aria-roledescription="carousel"
        className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-muted sm:aspect-[16/9]"
      >
        <h2 id={galleryHeadingId} className="sr-only">
          {title} görsel galerisi
        </h2>
        <p className="text-muted-foreground/70">Görsel bulunamadı</p>
      </section>
    );
  }

  return (
    <>
      <section
        aria-labelledby={galleryHeadingId}
        aria-roledescription="carousel"
        className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm"
      >
        <h2 id={galleryHeadingId} className="sr-only">
          {title} görsel galerisi
        </h2>

        <div className="space-y-3 p-3 sm:space-y-4 sm:p-5 lg:p-6">
          <div className="group relative">
            <div
              ref={emblaRef}
              tabIndex={0}
              onKeyDown={onViewportKeyDown}
              aria-label={`${title} için görsel galeri. Sol ve sağ ok tuşlarıyla gezinebilirsiniz.`}
              className="overflow-hidden rounded-2xl bg-muted touch-pan-y focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <div className="flex">
                {images.map((image, index) => (
                  <div
                    key={image.id || image.url}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${index + 1} / ${images.length}`}
                    className="relative aspect-[4/3] min-w-0 flex-[0_0_100%] sm:aspect-[16/9] lg:aspect-[16/10]"
                  >
                    <button
                      type="button"
                      onClick={openLightbox}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openLightbox();
                        }
                      }}
                      className="relative aspect-[4/3] min-w-0 flex-[0_0_100%] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:aspect-[16/9] lg:aspect-[16/10]"
                      aria-label={`${title} - ${index + 1} görselini tam ekran aç`}
                    >
                      <SafeImage
                        src={supabaseImageUrl(image.url, 1200, 85)}
                        alt=""
                        fill
                        priority={index === 0}
                        sizes="(min-width: 1280px) 65vw, 100vw"
                        placeholder={image.placeholderBlur ? "blur" : "empty"}
                        blurDataURL={image.placeholderBlur ?? undefined}
                        className="pointer-events-none object-cover"
                      />
                    </button>

                    {image.type === "360" && (
                      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-blue-600/90 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                        <Rotate3d size={11} />
                        360°
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {images.length > 1 && (
              <>
                <Button
                  type="button"
                  onClick={scrollPrev}
                  aria-label="Önceki görsel"
                  className="absolute left-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground/90 opacity-0 shadow-sm backdrop-blur-md transition-all hover:bg-card group-hover:opacity-100 sm:flex"
                >
                  <ChevronLeft size={24} />
                </Button>
                <Button
                  type="button"
                  onClick={scrollNext}
                  aria-label="Sonraki görsel"
                  className="absolute right-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground/90 opacity-0 shadow-sm backdrop-blur-md transition-all hover:bg-card group-hover:opacity-100 sm:flex"
                >
                  <ChevronRight size={24} />
                </Button>
              </>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-end justify-between gap-2 px-3 sm:bottom-4 sm:px-6">
              <div
                aria-live="polite"
                aria-atomic="true"
                className="rounded-full bg-black/50 px-3 py-1.5 text-[10px] font-bold uppercase italic tracking-widest text-white backdrop-blur-md"
              >
                {currentIndex + 1} / {images.length}
              </div>

              <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  onClick={openLightbox}
                  aria-label="Galeriyi tam ekran aç"
                  className="h-9 rounded-full bg-card/90 px-3 text-[10px] font-bold uppercase italic tracking-widest text-foreground shadow-sm transition-all hover:bg-card sm:h-auto sm:px-4 sm:py-2.5"
                >
                  Tam Ekran
                  <Sparkles size={12} className="text-primary" />
                </Button>

                {show360Button && panoramaUrl && (
                  <Button
                    type="button"
                    onClick={open360View}
                    aria-label="360 derece görünümü aç"
                    className="h-9 rounded-full bg-blue-500 px-3 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-blue-600 sm:h-auto sm:px-4 sm:py-2.5"
                  >
                    <Rotate3d size={12} />
                    360° Görünüm
                  </Button>
                )}
              </div>
            </div>
          </div>

          {images.length > 1 && (
            <div className="hidden overflow-hidden py-2 sm:block" ref={thumbRef}>
              <div className="flex gap-2 sm:gap-3">
                {images.map((image, index) => {
                  const isActive = currentIndex === index;

                  return (
                    <Button
                      key={`${image.id || image.url}-thumb`}
                      type="button"
                      variant="ghost"
                      onClick={() => onThumbClick(index)}
                      aria-label={`${index + 1}. görsele git`}
                      aria-current={isActive ? true : undefined}
                      className={[
                        "relative h-20 min-w-[96px] overflow-hidden rounded-2xl border p-0 transition-all",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                        isActive
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border/60 opacity-80 hover:opacity-100",
                      ].join(" ")}
                    >
                      <SafeImage
                        src={supabaseImageUrl(image.url, 240, 75)}
                        alt=""
                        fill
                        sizes="160px"
                        placeholder={image.placeholderBlur ? "blur" : "empty"}
                        blurDataURL={image.placeholderBlur ?? undefined}
                        className="object-cover"
                      />
                      {image.type === "360" && (
                        <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full bg-blue-600/90 px-2 py-1 text-[9px] font-bold text-white backdrop-blur">
                          <Rotate3d size={10} />
                          360°
                        </div>
                      )}
                      <span className="sr-only">
                        {title} {index + 1}. görsel
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <ListingGalleryLightbox
        currentIndex={currentIndex}
        images={images}
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
        onNext={scrollNext}
        onPrev={scrollPrev}
        title={title}
      />

      {show360Button && panoramaUrl ? (
        <Listing360View isOpen={is360Open} imageUrl={panoramaUrl} onClose={close360View} />
      ) : null}
    </>
  );
}

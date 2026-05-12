"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Rotate3d, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";

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
  has360View?: boolean;
}

export function ListingGallery({
  images,
  title,
  listingId,
  has360View = false,
}: ListingGalleryProps) {
  const { track } = useAnalytics();
  const galleryHeadingId = useId();
  const slideIdPrefix = useId();
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [is360Open, setIs360Open] = useState(false);

  const panoramaImage = images.find((image) => image.type === "360");
  const panoramaUrl = panoramaImage ? supabaseImageUrl(panoramaImage.url, 2400, 90) : "";
  const show360Button = has360View || Boolean(panoramaImage);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: images.length > 1,
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
  }, [emblaApi, images.length, listingId, thumbApi, track]);

  const openLightbox = () => {
    if (listingId) {
      track("listing_lightbox_opened", {
        listing_id: listingId,
        image_index: currentIndex,
      });
    }

    setIsLightboxOpen(true);
  };

  const open360View = () => {
    if (listingId) {
      track("listing_360_opened", {
        listing_id: listingId,
      });
    }

    setIs360Open(true);
  };

  const goToSlide = (index: number, shouldFocusThumb = false) => {
    if (!emblaApi) return;

    emblaApi.scrollTo(index);
    thumbApi?.scrollTo(index);

    if (shouldFocusThumb) {
      thumbRefs.current[index]?.focus();
    }
  };

  const onThumbClick = (index: number) => {
    goToSlide(index);
  };

  const scrollPrev = () => {
    emblaApi?.scrollPrev();
  };

  const scrollNext = () => {
    emblaApi?.scrollNext();
  };

  const onViewportKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!emblaApi || images.length <= 1) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      emblaApi.scrollPrev();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      emblaApi.scrollNext();
    }

    if (event.key === "Home") {
      event.preventDefault();
      emblaApi.scrollTo(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      emblaApi.scrollTo(images.length - 1);
    }
  };

  const onThumbKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (images.length <= 1) return;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      goToSlide((index + 1) % images.length, true);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      goToSlide((index - 1 + images.length) % images.length, true);
    }

    if (event.key === "Home") {
      event.preventDefault();
      goToSlide(0, true);
    }

    if (event.key === "End") {
      event.preventDefault();
      goToSlide(images.length - 1, true);
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToSlide(index, true);
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
                    id={`${slideIdPrefix}-${index}`}
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
                      className="relative h-full w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
                {show360Button && panoramaUrl ? (
                  <Button
                    type="button"
                    onClick={open360View}
                    className="rounded-full bg-blue-600/90 px-3 py-2 text-xs font-bold text-white shadow-sm backdrop-blur transition hover:bg-blue-600"
                  >
                    <Rotate3d className="mr-1.5 size-4" />
                    360° Görünüm
                  </Button>
                ) : null}

                <Button
                  type="button"
                  onClick={openLightbox}
                  className="rounded-full bg-black/50 px-3 py-2 text-xs font-bold text-white shadow-sm backdrop-blur transition hover:bg-black/65"
                >
                  <Sparkles className="mr-1.5 size-4" />
                  Tüm fotoğraflar
                </Button>
              </div>
            </div>
          </div>

          {images.length > 1 && (
            <div ref={thumbRef} className="overflow-hidden" aria-label="Galeri küçük önizlemeleri">
              <div className="flex gap-2">
                {images.map((image, index) => {
                  const isActive = index === currentIndex;

                  return (
                    <button
                      key={`thumb-${image.id || image.url}`}
                      ref={(node) => {
                        thumbRefs.current[index] = node;
                      }}
                      type="button"
                      onClick={() => onThumbClick(index)}
                      onKeyDown={(event) => onThumbKeyDown(event, index)}
                      tabIndex={isActive ? 0 : -1}
                      aria-label={`${index + 1}. görsele git${image.type === "360" ? " - 360 derece" : ""}`}
                      aria-controls={`${slideIdPrefix}-${index}`}
                      aria-current={isActive ? "true" : undefined}
                      className={[
                        "relative aspect-[4/3] min-w-[84px] overflow-hidden rounded-xl border transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:min-w-[96px]",
                        isActive
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border/60 opacity-80 hover:opacity-100",
                      ].join(" ")}
                    >
                      <SafeImage
                        src={supabaseImageUrl(image.url, 240, 75)}
                        alt=""
                        fill
                        sizes="96px"
                        placeholder={image.placeholderBlur ? "blur" : "empty"}
                        blurDataURL={image.placeholderBlur ?? undefined}
                        className="object-cover"
                      />
                      {image.type === "360" && (
                        <div className="absolute left-1.5 top-1.5 rounded-full bg-blue-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          360°
                        </div>
                      )}
                    </button>
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
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={(index) => goToSlide(index)}
        onNext={scrollNext}
        onPrev={scrollPrev}
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

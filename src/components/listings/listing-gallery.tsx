"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Sparkles, Rotate3d } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import type { ListingImage } from "@/types";
import { Listing360View } from "@/components/listings/listing-360-view";

const ListingGalleryLightbox = dynamic(
  () => import("@/components/listings/listing-gallery-lightbox").then((mod) => mod.ListingGalleryLightbox),
);

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
      <div className="aspect-[4/3] sm:aspect-[16/9] bg-slate-100 rounded-2xl flex items-center justify-center">
        <p className="text-slate-400">Görsel bulunamadı</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-6 space-y-4">

          {/* Main Viewport */}
          <div className="relative group">
            <div className="overflow-hidden rounded-2xl bg-slate-100 touch-pan-y" ref={emblaRef}>
              <div className="flex">
                {images.map((image, index) => (
                  <div
                    key={image.id || image.url}
                    className="relative flex-[0_0_100%] min-w-0 aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/10]"
                  >
                    <Image
                      src={image.url}
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
                      <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none">
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
                <button
                  onClick={scrollPrev}
                  aria-label="Önceki"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md hidden sm:flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-white z-10"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={scrollNext}
                  aria-label="Sonraki"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md hidden sm:flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-white z-10"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Overlay Indicators */}
            <div className="absolute inset-x-0 bottom-4 flex items-center justify-between px-6 pointer-events-none">
              <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest italic">
                {currentIndex + 1} / {images.length}
              </div>
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-widest italic hover:bg-white transition-all shadow-lg flex items-center gap-1.5"
                >
                  Tam Ekran
                  <Sparkles size={12} className="text-primary" />
                </button>
                {show360Button && (
                  <button
                    onClick={() => setIs360Open(true)}
                    className="px-3 py-1.5 rounded-full bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center gap-1.5"
                  >
                    <Rotate3d size={12} />
                    360° Görünüm
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="overflow-hidden" ref={thumbRef}>
            <div className="flex gap-3">
              {images.map((image, index) => (
                <button
                  key={image.id || image.url}
                  onClick={() => onThumbClick(index)}
                  className={`relative flex-[0_0_80px] sm:flex-[0_0_120px] aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? "border-primary ring-4 ring-primary/20 scale-95"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                    placeholder={image.placeholderBlur ? "blur" : "empty"}
                    blurDataURL={image.placeholderBlur ?? undefined}
                  />
                  {image.type === "360" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Rotate3d size={16} className="text-white" />
                    </div>
                  )}
                </button>
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

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import type { ListingImage } from "@/types";

interface ListingGalleryProps {
  images: ListingImage[];
  title: string;
}

export function ListingGallery({ images, title }: ListingGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "start",
    containScroll: "trimSnaps"
  });

  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true
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
                  <div key={image.id || image.url} className="relative flex-[0_0_100%] min-w-0 aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/10]">
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
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows (Desktop Only) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={scrollPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md hidden sm:flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-white z-10"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={scrollNext}
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
              <div 
                className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-widest italic pointer-events-auto cursor-pointer flex items-center gap-1.5 shadow-lg"
                onClick={() => setIsLightboxOpen(true)}
              >
                Tam Ekran
                <Sparkles size={12} className="text-primary" />
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
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox with Swipe Support (Manual Selection) */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-2xl flex flex-col" onClick={() => setIsLightboxOpen(false)}>
          <div className="flex items-center justify-between p-6">
            <div className="text-white text-sm font-black italic uppercase tracking-widest">
              {title} <span className="text-white/40 ml-2">({currentIndex + 1} / {images.length})</span>
            </div>
            <button
               onClick={() => setIsLightboxOpen(false)}
               className="size-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-2xl"
            >
               <X size={24} />
            </button>
          </div>

          <div className="flex-1 relative flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
             {images.map((img, idx) => (
                <div 
                  key={img.id || img.url} 
                  className={`absolute inset-0 transition-opacity duration-500 ease-in-out flex items-center justify-center p-4 ${
                    idx === currentIndex ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                  }`}
                >
                   <div className="relative w-full h-full max-w-7xl">
                      <Image
                        src={img.url}
                        alt=""
                        fill
                        className="object-contain"
                        sizes="100vw"
                        priority
                        placeholder={img.placeholderBlur ? "blur" : "empty"}
                        blurDataURL={img.placeholderBlur ?? undefined}
                      />
                   </div>
                </div>
             ))}

             {/* Lightbox Nav */}
             {images.length > 1 && (
               <>
                 <button onClick={() => { if (emblaApi) emblaApi.scrollPrev(); }} className="absolute left-6 size-16 rounded-full bg-white/5 hidden sm:flex items-center justify-center text-white hover:bg-white/10 transition-all"><ChevronLeft size={32}/></button>
                 <button onClick={() => { if (emblaApi) emblaApi.scrollNext(); }} className="absolute right-6 size-16 rounded-full bg-white/5 hidden sm:flex items-center justify-center text-white hover:bg-white/10 transition-all"><ChevronRight size={32}/></button>
               </>
             )}
          </div>
          
          <div className="p-8 flex justify-center gap-2 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
             {images.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? "bg-primary w-8" : "bg-white/20 w-1.5"}`}
                />
             ))}
          </div>
        </div>
      )}
    </>
  );
}
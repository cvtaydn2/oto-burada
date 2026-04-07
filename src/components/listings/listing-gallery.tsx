"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ListingGalleryProps {
  images: { id?: string; url: string; order: number; isCover?: boolean }[];
  title: string;
}

export function ListingGallery({ images, title }: ListingGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

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
          {/* Main Image with Slider */}
          <div className="relative group">
            <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
              <Image
                src={images[currentIndex].url}
                alt={`${title} - ${currentIndex + 1}`}
                fill
                priority
                sizes="(min-width: 1280px) 65vw, 100vw"
                className="object-cover cursor-pointer transition-transform duration-500 hover:scale-105"
                onClick={() => setIsLightboxOpen(true)}
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-white"
                    aria-label="Önceki görsel"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); goToNext(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-white"
                    aria-label="Sonraki görsel"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Bottom Info */}
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                    {currentIndex + 1} / {images.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
                  Tam ekran
                </div>
              </div>
            </div>

            {/* Slide Indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex 
                        ? "bg-white w-6" 
                        : "bg-white/50 hover:bg-white/80"
                    }`}
                    aria-label={`Görsel ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {images.map((image, index) => (
              <button
                key={image.id ?? image.url}
                onClick={() => goToSlide(index)}
                className={`relative w-20 h-16 sm:w-24 sm:h-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 border-2 transition-all cursor-pointer ${
                  index === currentIndex 
                    ? "border-indigo-500 ring-2 ring-indigo-500/30" 
                    : "border-transparent hover:border-slate-300"
                }`}
              >
                <Image
                  src={image.url}
                  alt={`${title} - ${index + 1}`}
                  fill
                  sizes="100px"
                  className="object-cover"
                />
                {index === currentIndex && (
                  <div className="absolute inset-0 bg-indigo-500/20" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Kapat"
          >
            <X size={24} />
          </button>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Önceki"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Sonraki"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {/* Main Image */}
          <div 
            className="relative w-full h-full max-w-6xl max-h-[85vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[currentIndex].url}
              alt={`${title} - ${currentIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Thumbnail Strip in Lightbox */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/50 rounded-xl backdrop-blur-md">
            {images.map((image, index) => (
              <button
                key={image.id ?? image.url}
                onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
                className={`relative w-16 h-12 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  index === currentIndex 
                    ? "border-white ring-2 ring-indigo-500" 
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={image.url}
                  alt={`${title} - ${index + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {/* Counter */}
          <div className="absolute top-4 left-4 px-4 py-2 bg-black/50 rounded-full backdrop-blur-md text-white text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
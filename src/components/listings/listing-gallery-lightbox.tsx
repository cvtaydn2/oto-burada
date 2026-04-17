"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { ListingImage } from "@/types";

interface ListingGalleryLightboxProps {
  currentIndex: number;
  images: ListingImage[];
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  title: string;
}

export function ListingGalleryLightbox({
  currentIndex,
  images,
  isOpen,
  onClose,
  onNext,
  onPrev,
  title,
}: ListingGalleryLightboxProps) {
  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onNext();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onNext, onPrev, onClose]);

  if (!isOpen) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/98 backdrop-blur-2xl"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} - Fotoğraf görüntüleyici`}
    >
      <div className="flex items-center justify-between p-6">
        <div className="text-sm font-black uppercase tracking-widest text-white">
          {title}{" "}
          <span className="ml-2 text-white/40">
            ({currentIndex + 1} / {images.length})
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="flex size-12 items-center justify-center rounded-full bg-card/10 text-white shadow-2xl transition-all hover:bg-card/20"
        >
          <X size={24} />
        </button>
      </div>

      {/* Only render the current image — not all images at once */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {currentImage && (
          <div className="relative h-full w-full max-w-7xl">
            <Image
              key={currentImage.url} // force re-render on slide change
              src={currentImage.url}
              alt={`${title} - ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              placeholder={currentImage.placeholderBlur ? "blur" : "empty"}
              blurDataURL={currentImage.placeholderBlur ?? undefined}
            />
          </div>
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={onPrev}
              aria-label="Önceki fotoğraf"
              className="absolute left-6 hidden size-16 items-center justify-center rounded-full bg-card/5 text-white transition-all hover:bg-card/10 sm:flex"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={onNext}
              aria-label="Sonraki fotoğraf"
              className="absolute right-6 hidden size-16 items-center justify-center rounded-full bg-card/5 text-white transition-all hover:bg-card/10 sm:flex"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}
      </div>

      {/* Dot navigation */}
      <div
        className="flex justify-center gap-2 overflow-x-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {images.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex ? "w-8 bg-primary" : "w-1.5 bg-card/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

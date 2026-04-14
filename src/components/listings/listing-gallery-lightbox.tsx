"use client";

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
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/98 backdrop-blur-2xl" onClick={onClose}>
      <div className="flex items-center justify-between p-6">
        <div className="text-sm font-black uppercase tracking-widest text-white">
          {title} <span className="ml-2 text-white/40">({currentIndex + 1} / {images.length})</span>
        </div>
        <button
          onClick={onClose}
          className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white shadow-2xl transition-all hover:bg-white/20"
        >
          <X size={24} />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {images.map((image, index) => (
          <div
            key={image.id || image.url}
            className={`absolute inset-0 flex items-center justify-center p-4 transition-opacity duration-500 ease-in-out ${
              index === currentIndex ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div className="relative h-full w-full max-w-7xl">
              <Image
                src={image.url}
                alt=""
                fill
                className="object-contain"
                sizes="100vw"
                priority
                placeholder={image.placeholderBlur ? "blur" : "empty"}
                blurDataURL={image.placeholderBlur ?? undefined}
              />
            </div>
          </div>
        ))}

        {images.length > 1 ? (
          <>
            <button
              onClick={onPrev}
              className="absolute left-6 hidden size-16 items-center justify-center rounded-full bg-white/5 text-white transition-all hover:bg-white/10 sm:flex"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={onNext}
              className="absolute right-6 hidden size-16 items-center justify-center rounded-full bg-white/5 text-white transition-all hover:bg-white/10 sm:flex"
            >
              <ChevronRight size={32} />
            </button>
          </>
        ) : null}
      </div>

      <div className="flex justify-center gap-2 overflow-x-auto p-8" onClick={(e) => e.stopPropagation()}>
        {images.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all ${index === currentIndex ? "w-8 bg-primary" : "w-1.5 bg-white/20"}`}
          />
        ))}
      </div>
    </div>
  );
}

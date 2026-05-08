"use client";

import { ChevronLeft, ChevronRight, Maximize2, Play, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";

import { Button } from "@/features/ui/components/button";
import { cn } from "@/lib";
import type { ListingImage } from "@/types";

interface GalleryViewerProps {
  images: ListingImage[];
  title: string;
}

export function GalleryViewer({ images, title }: GalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;
  const hasVideo = images.some((img) => img.type === "video");
  const has360 = images.some((img) => img.type === "360");

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") setIsFullscreen(false);
    },
    [goToPrevious, goToNext]
  );

  if (!images.length) {
    return (
      <div className="aspect-[4/3] bg-muted rounded-3xl flex items-center justify-center">
        <p className="text-muted-foreground/70">Fotoğraf yok</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-3xl overflow-hidden bg-muted/30",
        isFullscreen ? "fixed inset-0 z-50" : "aspect-[4/3]"
      )}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Main Image/Video Display */}
      <div className="relative w-full h-full">
        {currentImage?.type === "video" ? (
          <video
            src={currentImage.url}
            poster={currentImage.thumbnailUrl || undefined}
            controls
            className="w-full h-full object-contain"
            autoPlay={false}
          />
        ) : (
          <Image
            src={currentImage.url}
            alt={`${title} - ${currentIndex + 1}`}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}

        {/* 360 Badge */}
        {currentImage?.type === "360" && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
            <Maximize2 size={14} />
            360° Görünüm
          </div>
        )}

        {/* Video Badge */}
        {currentImage?.type === "video" && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
            <Play size={14} />
            Video
          </div>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Navigation Arrows */}
        {hasMultiple && (
          <>
            <Button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-card/90 shadow-sm rounded-full p-3 hover:bg-card transition-all"
              aria-label="Önceki"
            >
              <ChevronLeft size={20} />
            </Button>
            <Button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-card/90 shadow-sm rounded-full p-3 hover:bg-card transition-all"
              aria-label="Sonraki"
            >
              <ChevronRight size={20} />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {hasMultiple && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {images.map((img, idx) => (
              <Button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all",
                  idx === currentIndex
                    ? "border-white ring-2 ring-primary"
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                {img.type === "video" ? (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <Play size={14} className="text-white" />
                  </div>
                ) : img.type === "360" ? (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <Maximize2 size={14} className="text-white" />
                  </div>
                ) : (
                  <Image
                    src={img.url}
                    alt={`${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Toggle */}
      {(hasVideo || has360) && (
        <Button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-lg hover:bg-black/80 transition-all"
        >
          {isFullscreen ? <X size={18} /> : <Maximize2 size={18} />}
        </Button>
      )}
    </div>
  );
}

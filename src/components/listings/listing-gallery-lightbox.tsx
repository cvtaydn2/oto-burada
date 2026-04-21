"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, GripVertical } from "lucide-react";
import { SafeImage } from "@/components/shared/safe-image";
import { supabaseImageUrl } from "@/lib/utils";

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
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = Math.min(Math.max(1, scale + (e.deltaY > 0 ? -0.25 : 0.25)), 4);
    setScale(newScale);
    if (newScale === 1) setPosition({ x: 0, y: 0 });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStart && scale === 1) {
      const diffX = e.touches[0].clientX - touchStart.x;
      if (Math.abs(diffX) > 50) {
        if (diffX > 0) onPrev();
        else onNext();
        setTouchStart(null);
      }
    } else if (e.touches.length === 2 && isDragging) {
      const diffX = e.touches[0].clientX - dragStart.x;
      const diffY = e.touches[0].clientY - dragStart.y;
      if (scale > 1) {
        setPosition((prev) => ({ x: prev.x + diffX, y: prev.y + diffY }));
      }
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const diffX = e.clientX - dragStart.x;
      const diffY = e.clientY - dragStart.y;
      setPosition((prev) => ({ x: prev.x + diffX, y: prev.y + diffY }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale === 1) {
      setScale(2);
    } else if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  if (!isOpen) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/98 backdrop-blur-2xl touch-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} - Fotoğraf görüntüleyici`}
    >
      <div className="flex items-center justify-between p-4 sm:p-6">
        <div className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white truncate max-w-[60%] sm:max-w-none">
          {title}
          <span className="ml-2 text-white/40 hidden sm:inline">
            ({currentIndex + 1} / {images.length})
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="flex size-12 items-center justify-center rounded-full bg-card/10 text-white shadow-sm transition-all hover:bg-card/20"
        >
          <X size={24} />
        </button>
      </div>

      {/* Only render the current image — not all images at once */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden p-2 sm:p-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {currentImage && (
          <div
            ref={imageRef}
            className="relative h-full w-full max-w-7xl"
            style={{
              cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: isDragging ? "none" : "transform 0.2s ease-out",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleImageClick}
          >
            <SafeImage
              key={`${currentImage.url}-${currentIndex}`}
              src={supabaseImageUrl(currentImage.url, 1600, 85)}
              alt={`${title} - ${currentIndex + 1}`}
              fill
              className="object-contain select-none"
              sizes="100vw"
              priority
              placeholder={currentImage.placeholderBlur ? "blur" : "empty"}
              blurDataURL={currentImage.placeholderBlur ?? undefined}
              draggable={false}
            />
          </div>
        )}

        {images.length > 1 && (
          <>
            {/* Desktop arrows */}
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              aria-label="Önceki fotoğraf"
              className="absolute left-4 sm:left-6 size-12 sm:size-16 items-center justify-center rounded-full bg-card/5 text-white transition-all hover:bg-card/20 hidden sm:flex"
            >
              <ChevronLeft size={28} className="sm:size-32" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              aria-label="Sonraki fotoğraf"
              className="absolute right-4 sm:right-6 size-12 sm:size-16 items-center justify-center rounded-full bg-card/5 text-white transition-all hover:bg-card/20 hidden sm:flex"
            >
              <ChevronRight size={28} className="sm:size-32" />
            </button>

            {/* Mobile swipe zones */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1/4 flex items-center justify-start pl-2 sm:hidden"
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
            >
              <div className="size-14 items-center justify-center rounded-full bg-card/20 text-white/60 flex">
                <ChevronLeft size={24} />
              </div>
            </div>
            <div
              className="absolute right-0 top-0 bottom-0 w-1/4 flex items-center justify-end pr-2 sm:hidden"
              onClick={(e) => { e.stopPropagation(); onNext(); }}
            >
              <div className="size-14 items-center justify-center rounded-full bg-card/20 text-white/60 flex">
                <ChevronRight size={24} />
              </div>
            </div>
          </>
        )}

        {/* Zoom indicator */}
        <div className="absolute bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs flex items-center gap-2">
          <GripVertical size={14} />
          <span className="hidden sm:inline">Kaydır / Scroll ile büyüt</span>
          <span className="sm:hidden">Dokun / Kaydır</span>
        </div>
      </div>

      {/* Dot navigation */}
      <div
        className="flex justify-center gap-2 overflow-x-auto p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {images.map((_, index) => (
          <button
            key={index}
            onClick={(e) => { e.stopPropagation(); }}
            className={`h-2 sm:h-1.5 rounded-full transition-all ${
              index === currentIndex ? "w-6 sm:w-8 bg-primary" : "w-2 sm:w-1.5 bg-card/40"
            }`}
          />
        ))}
      </div>

      {/* Mobile counter */}
      <div className="sm:hidden text-center text-white/60 text-xs pb-2">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}

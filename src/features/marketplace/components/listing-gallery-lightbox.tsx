import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, GripVertical, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { SafeImage } from "@/components/shared/safe-image";
import { Button } from "@/components/ui/button";
import { supabaseImageUrl } from "@/lib/utils/image";
import type { ListingImage } from "@/types";

interface ListingGalleryLightboxProps {
  currentIndex: number;
  images: ListingImage[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  title: string;
}

export function ListingGalleryLightbox({
  currentIndex,
  images,
  isOpen,
  onClose,
  onNavigate,
  onNext,
  onPrev,
  title,
}: ListingGalleryLightboxProps) {
  const titleId = useId();
  const descriptionId = useId();
  const imageRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setTouchStart(null);
      return;
    }

    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, [currentIndex, isOpen]);

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const zoomTo = (nextScale: number) => {
    const boundedScale = Math.min(Math.max(1, nextScale), 4);
    setScale(boundedScale);

    if (boundedScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    zoomTo(scale + (event.deltaY > 0 ? -0.25 : 0.25));
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length === 1) {
      setTouchStart({ x: event.touches[0].clientX, y: event.touches[0].clientY });
    } else if (event.touches.length === 2) {
      setIsDragging(true);
      setDragStart({ x: event.touches[0].clientX, y: event.touches[0].clientY });
    }
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (event.touches.length === 1 && touchStart && scale === 1) {
      const diffX = event.touches[0].clientX - touchStart.x;
      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          onPrev();
        } else {
          onNext();
        }
        setTouchStart(null);
      }
    } else if (event.touches.length === 2 && isDragging) {
      const diffX = event.touches[0].clientX - dragStart.x;
      const diffY = event.touches[0].clientY - dragStart.y;
      if (scale > 1) {
        setPosition((prev) => ({ x: prev.x + diffX, y: prev.y + diffY }));
      }
      setDragStart({ x: event.touches[0].clientX, y: event.touches[0].clientY });
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
    setIsDragging(false);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const diffX = event.clientX - dragStart.x;
      const diffY = event.clientY - dragStart.y;
      setPosition((prev) => ({ x: prev.x + diffX, y: prev.y + diffY }));
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleImageClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (scale === 1) {
      zoomTo(2);
    } else {
      resetZoom();
    }
  };

  const handleNavigate = (index: number) => {
    resetZoom();
    onNavigate(index);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onPrev();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      onNext();
    }

    if (event.key === "Home") {
      event.preventDefault();
      handleNavigate(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      handleNavigate(images.length - 1);
    }

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomTo(scale + 0.25);
    }

    if (event.key === "-") {
      event.preventDefault();
      zoomTo(scale - 0.25);
    }

    if (event.key === "0") {
      event.preventDefault();
      resetZoom();
    }
  };

  const currentImage = images[currentIndex];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300" />
        <Dialog.Content
          className="fixed inset-0 z-[101] flex flex-col focus:outline-none"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onKeyDown={handleKeyDown}
        >
          <Dialog.Title id={titleId} className="sr-only">
            {title} fotoğraf görüntüleyici
          </Dialog.Title>
          <Dialog.Description id={descriptionId} className="sr-only">
            Sol ve sağ ok tuşları ile fotoğraflar arasında gezebilir, artı ve eksi tuşları ile
            yakınlaştırabilir, sıfır tuşu ile yakınlaştırmayı sıfırlayabilirsiniz.
          </Dialog.Description>

          <div className="flex flex-shrink-0 items-center justify-between p-4 sm:p-6">
            <div className="max-w-[60%] truncate text-xs font-bold uppercase tracking-widest text-white sm:max-w-none sm:text-sm">
              {title}
              <span className="ml-2 hidden text-white/40 sm:inline">
                ({currentIndex + 1} / {images.length})
              </span>
            </div>
            <Dialog.Close asChild>
              <Button
                type="button"
                aria-label="Kapat"
                className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white shadow-sm transition-all hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <X size={24} />
              </Button>
            </Dialog.Close>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden p-2 sm:p-4"
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
                aria-label={`${title} - ${currentIndex + 1}. fotoğraf. Yakınlaştırma seviyesi ${scale}x.`}
              >
                <SafeImage
                  key={`${currentImage.url}-${currentIndex}`}
                  src={supabaseImageUrl(currentImage.url, 1600, 85)}
                  alt={`${title} - ${currentIndex + 1}`}
                  fill
                  className="select-none object-contain"
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
                <Button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPrev();
                  }}
                  aria-label="Önceki fotoğraf"
                  className="absolute left-4 z-10 flex size-12 items-center justify-center rounded-full bg-white/5 text-white transition-all hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:left-6 sm:size-16"
                >
                  <ChevronLeft className="size-7 sm:size-8" />
                </Button>

                <Button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onNext();
                  }}
                  aria-label="Sonraki fotoğraf"
                  className="absolute right-4 z-10 flex size-12 items-center justify-center rounded-full bg-white/5 text-white transition-all hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:right-6 sm:size-16"
                >
                  <ChevronRight className="size-7 sm:size-8" />
                </Button>
              </>
            )}

            <div className="pointer-events-none absolute bottom-20 left-1/2 flex -translate-x-1/2 items-center gap-2 text-xs text-white/40 sm:bottom-4">
              <GripVertical size={14} />
              <span className="hidden sm:inline">
                Kaydır / Scroll ile büyüt · Ok tuşlarıyla gez
              </span>
              <span className="sm:hidden">Dokun / Kaydır</span>
            </div>
          </div>

          <div className="flex flex-shrink-0 flex-col items-center gap-4 p-4 sm:p-8">
            <div
              className="flex max-w-full justify-center gap-2 overflow-x-auto px-4 no-scrollbar"
              aria-label="Fotoğraf navigasyonu"
            >
              {images.map((image, index) => (
                <Button
                  key={image.id || `${image.url}-${index}`}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleNavigate(index);
                  }}
                  aria-label={`Fotoğraf ${index + 1}'e git${image.type === "360" ? " - 360 derece" : ""}`}
                  aria-current={index === currentIndex ? "true" : undefined}
                  className="group p-2"
                >
                  <div
                    className={`h-2 rounded-full transition-all sm:h-1.5 ${
                      index === currentIndex ? "w-6 bg-primary sm:w-8" : "w-2 bg-white/40 sm:w-1.5"
                    } group-hover:bg-white/60 group-focus-visible:ring-2 group-focus-visible:ring-white`}
                  />
                </Button>
              ))}
            </div>

            <div className="text-center text-xs font-medium text-white/60 sm:hidden">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

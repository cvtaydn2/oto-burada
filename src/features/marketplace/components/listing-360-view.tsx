import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, MousePointerClick, Smartphone, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/features/ui/components/button";

interface Listing360ViewProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

/**
 * Lightweight equirectangular (360°) panorama viewer.
 * Refactored with Radix Dialog for focus trap and accessibility.
 */
export function Listing360View({ isOpen, imageUrl, onClose }: Listing360ViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const loadedRef = useRef(false);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const offsetRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ready">("idle");

  // Draw the current horizontal slice of the equirectangular panorama
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !loadedRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    const safeOffset = ((offsetRef.current % imgW) + imgW) % imgW;
    const srcY = imgH * 0.25;
    const srcH = imgH * 0.5;

    ctx.clearRect(0, 0, W, H);

    const leftW = imgW - safeOffset;
    if (leftW > 0) {
      ctx.drawImage(img, safeOffset, srcY, leftW, srcH, 0, 0, (leftW / imgW) * W, H);
    }
    const rightW = imgW - leftW;
    if (rightW > 0) {
      ctx.drawImage(img, 0, srcY, rightW, srcH, (leftW / imgW) * W, 0, (rightW / imgW) * W, H);
    }
  }, []);

  // Load image
  useEffect(() => {
    if (!isOpen) return;
    if (!imageUrl) {
      Promise.resolve().then(() => {
        if (status !== "error") setStatus("error");
      });
      return;
    }

    if (status !== "loading" && !loadedRef.current) {
      Promise.resolve().then(() => setStatus("loading"));
    }

    loadedRef.current = false;
    imgRef.current = null;
    offsetRef.current = 0;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      imgRef.current = img;
      loadedRef.current = true;
      setStatus("ready");
      requestAnimationFrame(draw);

      // Hide hint after 3s
      setTimeout(() => {
        if (hintRef.current) hintRef.current.style.opacity = "0";
      }, 3000);
    };

    img.onerror = () => {
      Promise.resolve().then(() => {
        if (status !== "error") setStatus("error");
      });
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isOpen, imageUrl, draw, status]);

  // Mouse/Touch Handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
    if (hintRef.current) hintRef.current.style.opacity = "0";
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging.current || !imgRef.current) return;
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      const sensitivity = imgRef.current.naturalWidth / (canvasRef.current?.width ?? 800);
      offsetRef.current -= dx * sensitivity;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(draw);
    },
    [draw]
  );

  const onMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true;
    lastX.current = e.touches[0]?.clientX ?? 0;
    if (hintRef.current) hintRef.current.style.opacity = "0";
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging.current || !imgRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - lastX.current;
      lastX.current = touch.clientX;
      const sensitivity = imgRef.current.naturalWidth / (canvasRef.current?.width ?? 800);
      offsetRef.current -= dx * sensitivity;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(draw);
    },
    [draw]
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm animate-in fade-in duration-300" />
        <Dialog.Content
          className="fixed inset-0 z-[101] flex flex-col focus:outline-none"
          aria-label="360° Panorama Görüntüleyici"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-blue-600 px-3 py-1 rounded-full text-white text-xs font-bold uppercase tracking-widest">
                360° Panorama
              </div>
            </div>
            <Dialog.Close asChild>
              <Button
                aria-label="Kapat"
                className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <X size={22} />
              </Button>
            </Dialog.Close>
          </div>

          {/* Viewer Area */}
          <div className="flex-1 flex items-center justify-center relative select-none px-4 pb-4">
            {status === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="size-10 border-4 border-white/20 border-t-white rounded-full animate-spin"
                  role="status"
                  aria-label="360° görüntü yükleniyor"
                />
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-4 text-white text-center">
                <AlertCircle size={48} className="text-red-500" />
                <div>
                  <p className="font-bold text-lg">Görüntü Yüklenemedi</p>
                  <p className="text-white/60 text-sm">
                    360° panorama dosyası şu anda kullanılamıyor.
                  </p>
                </div>
                <Button
                  onClick={onClose}
                  className="mt-2 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-semibold transition-all"
                >
                  Geri Dön
                </Button>
              </div>
            )}

            {status === "ready" && (
              <>
                <canvas
                  ref={canvasRef}
                  width={1200}
                  height={600}
                  className="w-full max-h-[70vh] rounded-2xl object-contain cursor-grab active:cursor-grabbing touch-none animate-in fade-in duration-500"
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onMouseUp}
                  role="img"
                  aria-label="Etkileşimli 360 derece araç iç görünümü"
                />

                <div
                  ref={hintRef}
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur text-white text-xs font-bold px-4 py-2.5 rounded-full pointer-events-none transition-opacity duration-500"
                >
                  <MousePointerClick size={16} className="hidden sm:block" />
                  <Smartphone size={16} className="sm:hidden" />
                  <span>Sürükleyerek 360° gezdirin</span>
                </div>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

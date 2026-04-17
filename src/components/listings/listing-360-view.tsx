"use client";

import { useRef, useEffect, useCallback } from "react";
import { X, MousePointerClick, Smartphone } from "lucide-react";

interface Listing360ViewProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

/**
 * Lightweight equirectangular (360°) panorama viewer.
 *
 * All image loading and canvas drawing is handled imperatively via refs
 * to avoid ESLint's setState-in-effect restrictions.
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

  // Load image — fully imperative, no setState
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
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
      draw();
      // Show canvas, hide spinner
      if (canvasRef.current) canvasRef.current.style.opacity = "1";
      const spinner = canvasRef.current?.previousElementSibling as HTMLElement | null;
      if (spinner) spinner.style.display = "none";
      // Hide hint after 3s
      if (hintRef.current) {
        hintRef.current.style.opacity = "1";
        setTimeout(() => {
          if (hintRef.current) hintRef.current.style.opacity = "0";
        }, 3000);
      }
    };
  }, [isOpen, imageUrl, draw]);

  // Keyboard escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Mouse events
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
    if (hintRef.current) hintRef.current.style.opacity = "0";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current || !imgRef.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    const sensitivity = (imgRef.current.naturalWidth / (canvasRef.current?.width ?? 800));
    offsetRef.current -= dx * sensitivity;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(draw);
  }, [draw]);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true;
    lastX.current = e.touches[0]?.clientX ?? 0;
    if (hintRef.current) hintRef.current.style.opacity = "0";
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current || !imgRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - lastX.current;
    lastX.current = touch.clientX;
    const sensitivity = (imgRef.current.naturalWidth / (canvasRef.current?.width ?? 800));
    offsetRef.current -= dx * sensitivity;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(draw);
  }, [draw]);

  const onTouchEnd = useCallback(() => { dragging.current = false; }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="360° Panorama Görüntüleyici"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-blue-600 px-3 py-1 rounded-full text-white text-xs font-black uppercase tracking-widest">
            360° Panorama
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="flex size-10 items-center justify-center rounded-full bg-card/10 text-white hover:bg-card/20 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* Canvas container */}
      <div className="flex-1 flex items-center justify-center relative select-none px-4 pb-4">
        {/* Spinner — hidden imperatively after image loads */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="size-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>

        <canvas
          ref={canvasRef}
          width={1200}
          height={600}
          style={{ opacity: 0 }}
          className="w-full max-h-[70vh] rounded-2xl object-contain cursor-grab active:cursor-grabbing touch-none transition-opacity duration-300"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />

        {/* Drag hint — shown imperatively after image loads, fades after 3s */}
        <div
          ref={hintRef}
          style={{ opacity: 0, transition: "opacity 0.5s" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur text-white text-xs font-bold px-4 py-2.5 rounded-full pointer-events-none"
        >
          <MousePointerClick size={16} className="hidden sm:block" />
          <Smartphone size={16} className="sm:hidden" />
          <span>Sürükleyerek 360° gezdirin</span>
        </div>
      </div>
    </div>
  );
}

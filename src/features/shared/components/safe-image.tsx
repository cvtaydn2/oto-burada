"use client";

import Image, { ImageProps } from "next/image";
import { useRef, useState } from "react";

import { cn } from "@/lib";

/**
 * World-Class UX: Safe Image (Issue 10, 6, 7 - "Media Seam")
 * - Handles broken images with a robust SVG fallback.
 * - Prevents 404 recursion by using a data-uri for fallbacks.
 * - Mitigates CLS with stable background placeholders.
 */

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f8fafc'/%3E%3Cpath d='M200 130c-15 0-25 10-25 20s10 20 25 20 25-10 25-20-10-20-25-20zm0 30c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z'/%3E%3C/svg%3E";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
  containerClassName?: string;
}

export function SafeImage({
  src,
  alt,
  fallbackSrc = FALLBACK_IMAGE,
  className,
  containerClassName,
  priority,
  sizes,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const resolvedSizes = sizes ?? (props.fill ? "100vw" : undefined);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/20 h-full w-full",
        loading && "animate-pulse",
        containerClassName
      )}
    >
      {error ? (
        <Image
          src={fallbackSrc}
          alt={alt}
          fill={props.fill}
          sizes={resolvedSizes}
          unoptimized
          className={cn("h-full w-full object-cover opacity-40 grayscale", className)}
        />
      ) : (
        <Image
          ref={imgRef}
          src={src || fallbackSrc}
          alt={alt}
          sizes={resolvedSizes}
          className={cn("transition-opacity duration-500", "opacity-100", className)}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
          decoding="async"
          priority={priority}
          {...props}
        />
      )}
    </div>
  );
}

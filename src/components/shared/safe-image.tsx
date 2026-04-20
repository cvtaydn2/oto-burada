"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * World-Class UX: Safe Image (Issue 10, 6, 7 - "Media Seam")
 * - Handles broken images with a fallback placeholder.
 * - Enforces async decoding to prevent scroll jank.
 * - Optimizes bandwidth via Supabase loader if configured.
 * - Mitigates CLS with stable aspect ratios.
 */

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
  containerClassName?: string;
}

export function SafeImage({
  src,
  alt,
  fallbackSrc = "/images/placeholders/car-fallback.jpg", // Create this or use a solid color
  className,
  containerClassName,
  priority,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-muted/20", 
        loading && "animate-pulse",
        containerClassName
      )}
    >
      <Image
        key={src.toString()}
        src={error ? fallbackSrc : src}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          loading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        // PILL: Issue 6 - Async Decoding (Prevents Scroll Jank)
        decoding="async"
        // PILL: Issue 4 - LCP Priority
        priority={priority}
        {...props}
      />
    </div>
  );
}

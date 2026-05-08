"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/features/ui/components/button";
import { cn } from "@/lib";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Throttle: scroll event'i her 100ms'de bir işle — her pixel'de state update önlenir
    let ticking = false;
    const toggleVisibility = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsVisible(window.scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-36 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-card border-2 border-slate-900 text-foreground shadow-sm transition-all hover:bg-muted/30 active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-300",
        "lg:left-auto lg:right-6 lg:bottom-8"
      )}
      aria-label="Yukarı Çık"
    >
      <ArrowUp size={24} strokeWidth={3} />
    </Button>
  );
}

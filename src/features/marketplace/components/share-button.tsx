"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  title: string;
  price: number;
  className?: string;
}

export function ShareButton({ title, price, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `${title} - ${price.toLocaleString("tr-TR")} TL`,
          url: url,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      onClick={handleShare}
      className={
        className ||
        "h-11 rounded-xl border border-border bg-card shadow-sm px-5 hover:bg-muted/30 font-medium text-sm gap-2 text-foreground/90 flex items-center transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
      }
    >
      <Share2 size={18} aria-hidden="true" />
      <span aria-live="polite">{copied ? "Kopyalandı!" : "Paylaş"}</span>
    </Button>
  );
}

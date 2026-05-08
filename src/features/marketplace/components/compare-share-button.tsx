"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/features/ui/components/button";

interface CompareShareButtonProps {
  ids: string[];
}

export function CompareShareButton({ ids }: CompareShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/compare?ids=${ids.join(",")}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Araç Karşılaştırması — OtoBurada",
          text: `${ids.length} aracı karşılaştırdım, sen de incele!`,
          url,
        });
        return;
      } catch {
        // User cancelled or share failed — fallback to clipboard
      }
    }

    // Clipboard API — HTTPS veya localhost gerektirir
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback: input trick for HTTP environments
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Button
      onClick={() => void handleShare()}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2.5 text-sm font-bold text-muted-foreground shadow-sm transition-all hover:border-border hover:bg-muted/30 sm:w-auto"
    >
      {copied ? (
        <>
          <Check size={15} className="text-emerald-500" />
          <span className="truncate text-emerald-600">Kopyalandı!</span>
        </>
      ) : (
        <>
          <Share2 size={15} />
          <span className="truncate">Karşılaştırmayı Paylaş</span>
        </>
      )}
    </Button>
  );
}

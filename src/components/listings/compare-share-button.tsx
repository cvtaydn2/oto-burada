"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

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
      className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted/30 hover:border-border transition-all shadow-sm"
    >
      {copied ? (
        <>
          <Check size={15} className="text-emerald-500" />
          <span className="text-emerald-600">Kopyalandı!</span>
        </>
      ) : (
        <>
          <Share2 size={15} />
          Karşılaştırmayı Paylaş
        </>
      )}
    </Button>
  );
}

"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
  title: string;
  price: number;
}

export function ShareButton({ title, price }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `${title} - ${price.toLocaleString('tr-TR')} TL`,
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
    <button
      onClick={handleShare}
      className="h-11 rounded-xl border border-slate-200 bg-white shadow-sm px-5 hover:bg-slate-50 font-medium text-sm gap-2 text-slate-700 flex items-center transition-all"
    >
      <Share2 size={18} />
      {copied ? "Kopyalandı!" : "Paylaş"}
    </button>
  );
}
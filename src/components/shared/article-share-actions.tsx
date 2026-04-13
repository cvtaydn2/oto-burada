"use client";

import { Globe, Link as LinkIcon, Share2 } from "lucide-react";
import { useState } from "react";

interface ArticleShareActionsProps {
  title: string;
}

export function ArticleShareActions({ title }: ArticleShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!navigator.share) {
      await handleCopy();
      return;
    }

    try {
      await navigator.share({
        title,
        url: window.location.href,
      });
    } catch {
      // User cancelled native share dialog.
    }
  };

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={handleShare}
        className="size-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
        aria-label="İçeriği paylaş"
      >
        <Globe size={18} />
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="size-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
        aria-label="Paylaş"
      >
        <Share2 size={18} />
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="size-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
        aria-label="Bağlantıyı kopyala"
        title={copied ? "Kopyalandı" : "Bağlantıyı kopyala"}
      >
        <LinkIcon size={18} />
      </button>
    </div>
  );
}

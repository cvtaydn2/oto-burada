"use client";

import { Globe, Link as LinkIcon, Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ArticleShareActionsProps {
  title: string;
}

const BUTTON_CLASSNAME =
  "size-12 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground/70 hover:bg-slate-900 hover:text-white transition-all shadow-sm";

function getCurrentUrl() {
  return window.location.href;
}

export function ArticleShareActions({ title }: ArticleShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getCurrentUrl());
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
        url: getCurrentUrl(),
      });
    } catch {
      // User cancelled native share dialog.
    }
  };

  return (
    <div className="flex gap-3">
      <Button
        type="button"
        onClick={handleShare}
        className={BUTTON_CLASSNAME}
        aria-label="İçeriği paylaş"
      >
        <Globe size={18} />
      </Button>
      <Button type="button" onClick={handleShare} className={BUTTON_CLASSNAME} aria-label="Paylaş">
        <Share2 size={18} />
      </Button>
      <Button
        type="button"
        onClick={handleCopy}
        className={BUTTON_CLASSNAME}
        aria-label="Bağlantıyı kopyala"
        title={copied ? "Kopyalandı" : "Bağlantıyı kopyala"}
      >
        <LinkIcon size={18} />
      </Button>
    </div>
  );
}

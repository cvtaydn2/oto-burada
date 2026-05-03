"use client";

import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";

import { generateExpertDocumentSignedUrl } from "@/app/(public)/(marketplace)/listing/[slug]/actions";

interface ExpertPdfButtonProps {
  slug: string;
}

/**
 * Client component that generates signed URL on-demand when user clicks.
 */
export function ExpertPdfButton({ slug }: ExpertPdfButtonProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    if (signedUrl) return;

    e.preventDefault();
    setIsLoading(true);

    try {
      const url = await generateExpertDocumentSignedUrl(slug);
      if (url) {
        setSignedUrl(url);
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (signedUrl) {
    return (
      <a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-foreground transition hover:opacity-90"
      >
        <FileText size={12} />
        PDF Raporu
      </a>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-foreground transition hover:opacity-90 disabled:opacity-70"
    >
      {isLoading ? (
        <>
          <Loader2 size={12} className="animate-spin" />
          Yükleniyor...
        </>
      ) : (
        <>
          <FileText size={12} />
          PDF Raporu
        </>
      )}
    </button>
  );
}

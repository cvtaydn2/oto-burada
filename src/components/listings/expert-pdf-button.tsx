"use client";

import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";

import { generateExpertDocumentSignedUrl } from "@/app/(public)/(marketplace)/listing/[slug]/actions";

interface ExpertPdfButtonProps {
  documentPath: string;
}

/**
 * Client component that generates signed URL on-demand when user clicks.
 * This defers the expensive signed URL generation until actually needed.
 */
export function ExpertPdfButton({ documentPath }: ExpertPdfButtonProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    // If we already have a signed URL, just use it
    if (signedUrl) return;

    // Prevent navigation while generating URL
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = await generateExpertDocumentSignedUrl(documentPath);
      if (url) {
        setSignedUrl(url);
        // Open in new tab after setting state
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If we have a signed URL, render as direct link
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

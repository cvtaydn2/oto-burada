"use client";

import { AlertCircle, Loader2, MessageSquare } from "lucide-react";
import { useState } from "react";

import { revealListingPhone } from "@/app/dashboard/listings/actions";
import { captureClientEvent } from "@/lib/monitoring/posthog-client";
import { cn } from "@/lib/utils";

interface SafeWhatsAppButtonProps {
  listingId: string;
  listingTitle: string;
  offerPrice?: number;
  className?: string;
  variant?: "primary" | "outline" | "ghost";
  label?: string;
  icon?: React.ReactNode;
}

export function SafeWhatsAppButton({
  listingId,
  listingTitle,
  offerPrice,
  className,
  variant = "primary",
  label,
  icon,
}: SafeWhatsAppButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const { phone } = await revealListingPhone(listingId);

      const phoneDigits = phone.replace(/\D/g, "");
      const message = offerPrice
        ? `${listingTitle} ilanınız için ${new Intl.NumberFormat("tr-TR").format(offerPrice)} TL teklif vermek istiyorum.`
        : `${listingTitle} ilanınız için iletişime geçmek istiyorum.`;

      const whatsappUrl = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;

      captureClientEvent("whatsapp_reveal_click", {
        listingId,
        hasOffer: !!offerPrice,
      });

      // Redirect to WhatsApp
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Numara alınamadı");
    } finally {
      setLoading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "outline":
        return "bg-background border border-border hover:border-primary/30 text-foreground";
      case "ghost":
        return "bg-transparent text-muted-foreground hover:text-primary";
      default:
        return "bg-primary text-primary-foreground hover:opacity-90 shadow-sm";
    }
  };

  return (
    <div className="relative w-full">
      <button
        onClick={handleAction}
        disabled={loading}
        className={cn(
          "w-full flex items-center justify-center gap-2 rounded-xl h-12 transition-all active:scale-95 text-sm font-bold uppercase tracking-widest disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none",
          getVariantStyles(),
          className
        )}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">Yükleniyor...</span>
          </>
        ) : (
          <>
            {icon || <MessageSquare size={16} aria-hidden="true" />}
            <span>
              {label ||
                (offerPrice
                  ? `₺${new Intl.NumberFormat("tr-TR").format(offerPrice)} Teklif Yap`
                  : "WhatsApp ile Ulaş")}
            </span>
          </>
        )}
      </button>

      {error && (
        <div
          role="alert"
          className="absolute -top-10 left-0 right-0 animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="bg-destructive text-destructive-foreground text-[10px] py-1 px-3 rounded-lg flex items-center gap-1.5 shadow-lg">
            <AlertCircle size={12} aria-hidden="true" />
            {error}
          </div>
        </div>
      )}
    </div>
  );
}

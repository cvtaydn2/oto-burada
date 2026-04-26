"use client";

import { ExternalLink, Info, ShieldAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface FraudWarningBannerProps {
  className?: string;
}

export function FraudWarningBanner({ className }: FraudWarningBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("oto-burada-fraud-warning-dismissed");
    if (!dismissed) {
      // setState in callback to avoid cascading renders
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("oto-burada-fraud-warning-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm transition-all animate-in fade-in slide-in-from-top-4 duration-500",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <ShieldAlert size={22} />
        </div>

        <div className="flex-1 pr-6">
          <h3 className="text-sm font-bold text-amber-900">Güvenliğiniz İçin Dikkat Edin</h3>
          <p className="mt-1 text-xs leading-relaxed text-amber-800/80">
            OtoBurada asla bir ödeme aracısı değildir. Size WhatsApp veya SMS üzerinden gönderilen
            &quot;Kapora&quot;, &quot;Güvenli Ödeme&quot; veya &quot;Param Güvende&quot; taklidi
            yapan linklere tıklamayın ve asla araç başında görmeden ödeme yapmayın.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href="/security-tips"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 hover:text-amber-900 transition-colors"
            >
              Güvenlik Rehberi
              <ExternalLink size={10} />
            </a>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600/60">
              <Info size={10} />
              KVKK Korumalı
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-lg p-1 text-amber-400 hover:bg-amber-100 hover:text-amber-600 transition-colors"
          aria-label="Kapat"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

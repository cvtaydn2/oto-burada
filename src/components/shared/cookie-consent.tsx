"use client";

import { Cookie, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { captureClientEvent, getCookieConsent, setCookieConsent } from "@/lib/telemetry-client";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    const isAutomatedTest =
      typeof navigator !== "undefined" && /playwright|headless/i.test(navigator.userAgent);

    if (isAutomatedTest) {
      setCookieConsent(false);
      return;
    }

    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (accepted: boolean) => {
    setCookieConsent(accepted);
    if (accepted) {
      captureClientEvent("cookie_consent_accepted");
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Çerez izni"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+8rem)] left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-500 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm"
    >
      <div className="rounded-3xl border border-border bg-card/95 p-5 shadow-sm backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Cookie size={20} aria-hidden="true" />
          </div>
          <Button
            onClick={() => handleConsent(false)}
            className="rounded-full p-1 text-muted-foreground/70 hover:bg-muted transition-colors"
            aria-label="Çerezleri reddet ve kapat"
          >
            <X size={18} aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-4">
          <h3 id="cookie-consent-title" className="text-sm font-bold text-foreground">
            Çerez Odaklı Deneyim
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Size daha iyi bir deneyim sunmak için çerezleri kullanıyoruz. Sitemizi kullanarak çerez
            politikamızı ve KVKK metinlerimizi kabul etmiş sayılırsınız.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button
            onClick={() => handleConsent(true)}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800"
          >
            Anladım, Devam Et
          </Button>
          <a
            href="/legal/privacy"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Detaylar
          </a>
        </div>
      </div>
    </div>
  );
}

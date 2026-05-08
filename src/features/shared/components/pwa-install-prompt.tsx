"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/features/ui/components/button";
import { FEATURES } from "@/lib/features";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform] = useState<"ios" | "android" | "other">(() => {
    if (typeof window === "undefined") {
      return "other";
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) return "ios";
    if (/android/.test(userAgent)) return "android";
    return "other";
  });

  useEffect(() => {
    // If PWA feature is disabled, don't even start the logic
    if (!FEATURES.PWA) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      const dismissed = localStorage.getItem("pwa_prompt_dismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    // For iOS, there's no beforeinstallprompt, so we use a timer
    if (platform === "ios") {
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem("pwa_prompt_dismissed");
        if (!dismissed) {
          setIsVisible(true);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, [platform]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa_prompt_dismissed", "true");
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsVisible(false);
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  // Only render if PWA feature is enabled AND prompt is visible
  if (!FEATURES.PWA || !isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="bg-card/95 backdrop-blur-xl border border-border shadow-sm rounded-2xl p-4 overflow-hidden">
        <Button
          onClick={handleDismiss}
          aria-label="Kapat"
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:bg-muted rounded-full transition-colors"
        >
          <X size={14} />
        </Button>

        <div className="flex items-center gap-3">
          <div className="size-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Download className="text-white" size={20} />
          </div>
          <div className="flex-1 pr-4">
            <h3 className="font-bold text-foreground text-sm leading-tight">
              OtoBurada&apos;yı Yükle
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              İlanlara ana ekranından anında ulaş.
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50">
          {platform === "ios" ? (
            <div className="flex items-center gap-2 text-[11px] text-foreground/90 font-medium">
              <span>Alttaki</span>
              <div className="p-0.5 bg-muted rounded text-foreground">
                <Share size={12} />
              </div>
              <span>butonuna basıp &quot;Ana Ekrana Ekle&quot;yi seçin.</span>
            </div>
          ) : (
            <Button
              onClick={handleInstallClick}
              disabled={!deferredPrompt}
              className="w-full h-9 bg-primary text-primary-foreground rounded-lg font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Uygulamayı Kur
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

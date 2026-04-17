"use client";

import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

export function PWAInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
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
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    // Delay showing the prompt
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem("pwa_prompt_dismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa_prompt_dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-4 overflow-hidden">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:bg-muted rounded-full transition-colors"
        >
          <X size={14} />
        </button>
 
        <div className="flex items-center gap-3">
          <div className="size-11 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <Download className="text-white" size={20} />
          </div>
          <div className="flex-1 pr-4">
            <h3 className="font-bold text-foreground text-sm leading-tight">OtoBurada&apos;yı Yükle</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">İlanlara ana ekranından anında ulaş.</p>
          </div>
        </div>
 
        <div className="mt-3 pt-3 border-t border-border/50/50">
          {platform === "ios" ? (
            <div className="flex items-center gap-2 text-[11px] text-foreground/90 font-medium">
              <span>Alttaki</span>
              <div className="p-0.5 bg-muted rounded text-foreground">
                <Share size={12} />
              </div>
              <span>butonuna basıp &quot;Ana Ekrana Ekle&quot;yi seçin.</span>
            </div>
          ) : (
            <button
              onClick={() => {
                window.location.reload(); 
              }}
              className="w-full h-9 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Uygulamayı Kur
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

export function PWAInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform("ios");
    } else if (/android/.test(userAgent)) {
      setPlatform("android");
    }

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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white/90 backdrop-blur-xl border border-border shadow-2xl rounded-3xl p-5 overflow-hidden">
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:bg-muted rounded-full transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-4">
          <div className="size-14 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <Download className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 leading-tight">OtoBurada'yı Uygulama Olarak Ekle</h3>
            <p className="text-xs text-slate-500 mt-1">İlanlara daha hızlı ulaşmak için ana ekranına ekle.</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          {platform === "ios" ? (
            <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
              <span>Alttaki</span>
              <div className="p-1 bg-slate-100 rounded text-slate-900">
                <Share size={14} />
              </div>
              <span>butonuna basıp "Ana Ekrana Ekle"yi seçin.</span>
            </div>
          ) : (
            <button
              onClick={() => {
                // For Android, standard A2HS might fire 'beforeinstallprompt'
                // Here we just guide them or let browser handle it
                window.location.reload(); 
              }}
              className="w-full h-11 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors"
            >
              Uygulamayı Kur
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

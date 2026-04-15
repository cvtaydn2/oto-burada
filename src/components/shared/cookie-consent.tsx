"use client";

import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-500 sm:left-auto sm:right-6 sm:max-w-sm">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Cookie size={20} />
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="mt-4">
          <h3 className="text-sm font-bold text-slate-900">Çerez Odaklı Deneyim</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Size daha iyi bir deneyim sunmak için çerezleri kullanıyoruz. Sitemizi kullanarak çerez politikamızı ve KVKK metinlerimizi kabul etmiş sayılırsınız.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleAccept}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800"
          >
            Anladım, Devam Et
          </button>
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

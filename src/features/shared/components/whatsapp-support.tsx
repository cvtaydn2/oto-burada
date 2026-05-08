"use client";

import { MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/features/ui/components/button";
import { cn } from "@/lib";

export function WhatsAppSupport() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show after 3 seconds
    const timer = setTimeout(() => setIsVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const whatsappNumber = "905000000000"; // Placeholder
  const message = "Merhaba OtoBurada ekibi, bir sorum var.";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3 pointer-events-none">
      {/* Tooltip/Bubble */}
      <div
        className={cn(
          "bg-white rounded-2xl shadow-2xl p-4 border border-emerald-100 max-w-[240px] transition-all duration-500 origin-bottom-right pointer-events-auto",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}
      >
        <Button
          onClick={() => setIsOpen(false)}
          className="absolute -top-2 -right-2 bg-gray-100 text-gray-500 rounded-full p-1 hover:bg-gray-200 transition-colors"
          aria-label="Destek balonunu kapat"
        >
          <X size={12} />
        </Button>
        <div className="flex gap-3">
          <div className="size-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <MessageCircle className="text-white size-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">OtoBurada Destek</p>
            <p className="text-[11px] text-gray-500 leading-tight mt-1">
              Size nasıl yardımcı olabiliriz? Sorularınız için bize yazın.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              WhatsApp&apos;tan Yaz
            </a>
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "size-14 rounded-full bg-emerald-500 shadow-lg flex items-center justify-center text-white hover:bg-emerald-600 transition-all hover:scale-110 active:scale-95 pointer-events-auto group relative",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        )}
        aria-label="WhatsApp Destek"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}

        {/* Pulsing effect when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
        )}
      </Button>
    </div>
  );
}

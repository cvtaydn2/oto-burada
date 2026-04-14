"use client";

import { X } from "lucide-react";

interface Listing360ViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Listing360View({ isOpen, onClose }: Listing360ViewProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
      >
        <X size={24} />
      </button>

      <div className="relative w-full max-w-6xl aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-lg font-medium animate-pulse">
              360° Görünüm Yükleniyor...
            </div>
          </div>
        )}

        {/* Placeholder for 360° viewer - Replace with actual 360 viewer component */}
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
          <div className="mb-4 p-6 rounded-full bg-slate-800/50">
            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
              <path d="M12 2v20" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">360° Görünüm</h3>
          <p className="text-center max-w-md text-sm text-slate-400 mb-6">
            Bu araç için 360° görünüm henüz eklenmemiş. Satıcıya 360° görünüm eklemesini isteyin.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold transition shadow-sm"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

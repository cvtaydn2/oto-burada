"use client";

import { TrendingDown, TrendingUp, Minus, Calendar } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";

interface PriceHistoryEntry {
  price: number;
  date: string;
}

interface PriceHistoryInfoProps {
  history: PriceHistoryEntry[];
  currentPrice: number;
}

export function PriceHistoryInfo({ history, currentPrice }: PriceHistoryInfoProps) {
  if (!history || history.length < 2) {
    return (
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 italic text-slate-500 text-xs font-medium">
        Bu ilan için fiyat değişim kaydı bulunmuyor.
      </div>
    );
  }

  // Sort history by date descending for display
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="p-6 rounded-3xl bg-secondary/10 border border-border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          Fiyat Geçmişi
        </h3>
        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Son Değişiklikler</span>
      </div>

      <div className="space-y-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 before:rounded-full">
        {sortedHistory.map((entry, idx) => {
          const nextEntry = sortedHistory[idx + 1];
          const diff = nextEntry ? entry.price - nextEntry.price : 0;
          const isDecrease = diff < 0;
          const isIncrease = diff > 0;

          return (
            <div key={entry.date + entry.price} className="relative pl-8 flex items-center justify-between group">
              {/* Dot */}
              <div className={`absolute left-0 size-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-110 ${
                idx === 0 ? "bg-primary" : "bg-slate-300"
              }`} />
              
              <div>
                <p className={`text-sm font-black italic ${idx === 0 ? "text-foreground" : "text-muted-foreground"}`}>
                  ₺{formatNumber(entry.price)}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                  {formatDate(entry.date)}
                </p>
              </div>

              {diff !== 0 && (
                <div className={`flex items-center gap-1 text-[11px] font-black italic px-2 py-0.5 rounded-lg ${
                  isDecrease ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                }`}>
                  {isDecrease ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                  %{Math.abs(Math.round((diff / (entry.price - diff)) * 100))}
                </div>
              )}
              
              {idx === sortedHistory.length - 1 && (
                <div className="flex items-center gap-1 text-[11px] font-black italic text-slate-400 px-2 py-0.5 rounded-lg bg-slate-100">
                  <Minus size={12} />
                  İlk Yayın
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

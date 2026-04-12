"use client";

import { Info, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export function MarketAnalysisInfo() {
  return (
    <div className="mt-4 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-white text-indigo-600 shadow-sm border border-indigo-100">
           <Sparkles size={18} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900 italic">Piyasa Analizi Nasıl Yapılıyor?</h4>
            <HoverCard openDelay={0} closeDelay={0}>
              <HoverCardTrigger asChild>
                <button className="text-indigo-400 hover:text-indigo-600 transition-colors">
                  <Info size={14} />
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 p-5 rounded-3xl card-shadow border-indigo-100 bg-white" side="top">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                    <ShieldCheck size={16} />
                    Şeffaf Fiyatlandırma
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    OtoBurada'nın gelişmiş algoritmaları, bu ilanı benzer özelliklerdeki (yıl, km, yakıt, vites, lokasyon) binlerce güncel ve geçmiş ilanla karşılaştırır.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-[11px] font-bold text-slate-700 italic">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      Günlük Piyasa Verisi Taraması
                    </li>
                    <li className="flex items-center gap-2 text-[11px] font-bold text-slate-700 italic">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      Hasar ve Ekstra Donanım Filtreleme
                    </li>
                    <li className="flex items-center gap-2 text-[11px] font-bold text-slate-700 italic">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      Aciliyet ve Talep Analizi
                    </li>
                  </ul>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
          <p className="text-[11px] text-indigo-700/70 font-medium leading-relaxed italic">
            Bu değer, ilan edilen fiyatın piyasa ortalamasına oranını gösterir. Yeşil bölge "Fırsat İlanı" anlamına gelir.
          </p>
        </div>
      </div>
    </div>
  );
}

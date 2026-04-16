"use client";

import { Info, TrendingUp, ShieldCheck } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export function MarketAnalysisInfo() {
  return (
    <div className="mt-4 overflow-hidden rounded-[32px] bg-slate-900 border border-white/5 shadow-2xl group transition-all hover:scale-[1.01]">
      <div className="p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
             <div className="p-2.5 rounded-2xl bg-indigo-500 text-white shadow-xl shadow-indigo-500/20">
                <TrendingUp size={18} />
             </div>
             <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 italic">Piyasa Skoru</h4>
                   <HoverCard openDelay={0} closeDelay={0}>
                      <HoverCardTrigger asChild>
                         <button className="text-white/30 hover:text-white transition-colors">
                            <Info size={14} />
                         </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 p-6 rounded-[32px] card-shadow border-white/10 bg-slate-900 text-white" side="top">
                         <div className="space-y-4">
                            <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest italic">
                               <ShieldCheck size={16} />
                               Şeffaf Fiyatlandırma
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-bold italic">
                               OtoBurada&apos;nın algoritmaları, bu ilanı benzer özelliklerdeki güncel ilanlarla karşılaştırır.
                            </p>
                         </div>
                      </HoverCardContent>
                   </HoverCard>
                </div>
                <p className="text-[11px] text-white/50 font-black leading-relaxed italic uppercase tracking-tighter">
                   ARACINIZIN GERÇEK DEĞERİ, ŞİMDİ SİZİNLE.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

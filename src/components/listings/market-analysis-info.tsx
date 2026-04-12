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
      <div className="p-8 pb-4">
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
                               OtoBurada'nın yapay zeka algoritmaları, bu ilanı benzer özelliklerdeki binlerce güncel ilanla anlık olarak karşılaştırır.
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
      
      {/* Visual Chart Placeholder/Image */}
      <div className="relative h-32 px-2 overflow-hidden">
         <img 
           src="/market_analysis_mockup_v1_1776035350916.png" 
           alt="Market Trend" 
           className="w-full h-full object-cover opacity-60 contrast-125 saturate-50 group-hover:scale-105 transition-transform duration-1000"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
      </div>
    </div>
  );
}

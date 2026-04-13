import { Info, Target, TrendingDown, TrendingUp, ShieldAlert } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { type Listing } from "@/types";
import { analyzeListingValue } from "@/services/listings/pricing-engine";

interface MarketValueCardProps {
  listing: Listing;
}

export function MarketValueCard({ listing }: MarketValueCardProps) {
  const analysis = analyzeListingValue(listing);
  const fairMarketValue = analysis.fairValue;
  
  const isOpportunity = analysis.rating === "opportunity";
  const isOverpriced = analysis.rating === "overpriced";

  return (
    <div className={`p-8 rounded-[40px] border transition-all duration-700 ${
      isOpportunity 
        ? "bg-emerald-50 border-emerald-100/50 shadow-xl shadow-emerald-500/5" 
        : isOverpriced
          ? "bg-rose-50 border-rose-100/50 shadow-xl shadow-rose-500/5" 
          : "bg-indigo-50 border-indigo-100/50 shadow-xl shadow-indigo-500/5"
    }`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
           <div className={`size-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${
             isOpportunity ? "bg-emerald-500 shadow-emerald-500/20" : "bg-indigo-500 shadow-indigo-500/20"
           }`}>
              <Target size={20} />
           </div>
           <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 italic">Akıllı Analiz</span>
              <span className="text-lg font-black font-heading leading-tight">Rayiç Değer Analizi</span>
           </div>
        </div>
        <div className="p-2 rounded-xl bg-white/50 border border-white cursor-help group relative">
           <Info size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
           <div className="absolute bottom-full right-0 mb-4 w-72 p-5 bg-slate-900 text-white text-[12px] rounded-[24px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-2xl z-20 font-medium leading-relaxed italic border border-white/10 backdrop-blur-md">
              Bu değer; aracın markası, modeli, yılı, kilometresi ve <strong className="text-blue-300">ekspertiz durumu (boya/değişen)</strong> analiz edilerek OtoBurada AI tarafından hesaplanmaktadır.
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-4xl font-black tabular-nums tracking-tighter font-heading text-slate-900 italic">
          ₺{formatNumber(fairMarketValue)}
        </div>
        <div className="flex items-center gap-2">
          {isOpportunity ? (
            <div className="flex items-center gap-2 text-emerald-600 text-[11px] font-black uppercase tracking-widest italic bg-white/80 py-1.5 px-4 rounded-full border border-emerald-100 shadow-sm">
              <TrendingDown size={14} className="animate-bounce" />
              SÜPER FIRSAT
            </div>
          ) : isOverpriced ? (
            <div className="flex items-center gap-2 text-rose-600 text-[11px] font-black uppercase tracking-widest italic bg-white/80 py-1.5 px-4 rounded-full border border-rose-100 shadow-sm">
              <TrendingUp size={14} />
              Piyasa Üstü
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-600 text-[11px] font-black uppercase tracking-widest italic bg-white/80 py-1.5 px-4 rounded-full border border-slate-100 shadow-sm">
              <Target size={14} />
              Adil Fiyat
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 space-y-3">
        <div className={`p-5 rounded-3xl text-[13px] font-bold italic leading-relaxed border ${
          isOpportunity 
            ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-800" 
            : "bg-white/50 border-slate-200 text-slate-600"
        }`}>
          {analysis.advice}
        </div>

        {analysis.riskScore === "high" && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-[12px] font-bold text-rose-700">
            <ShieldAlert size={16} className="shrink-0" />
            <span>Kritik parçalarda işlem mevcut. Güvenliğiniz için kurumsal ekspertiz raporu almanızı öneririz.</span>
          </div>
        )}
      </div>
    </div>
  );
}

import { Info, Target, TrendingDown, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface MarketValueCardProps {
  price: number;
  marketPriceIndex: number;
}

export function MarketValueCard({ price, marketPriceIndex }: MarketValueCardProps) {
  const fairMarketValue = Math.round(price / marketPriceIndex);
  const diffPercentage = Math.round((marketPriceIndex - 1) * 100);
  
  const isGoodDeal = marketPriceIndex <= 0.96;
  const isHighPrice = marketPriceIndex >= 1.05;

  return (
    <div className={`p-8 rounded-[40px] border transition-all duration-700 ${
      isGoodDeal 
        ? "bg-emerald-50 border-emerald-100/50 shadow-xl shadow-emerald-500/5" 
        : isHighPrice 
          ? "bg-amber-50 border-amber-100/50 shadow-xl shadow-amber-500/5" 
          : "bg-indigo-50 border-indigo-100/50 shadow-xl shadow-indigo-500/5"
    }`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
           <div className={`size-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${
             isGoodDeal ? "bg-emerald-500 shadow-emerald-500/20" : "bg-indigo-500 shadow-indigo-500/20"
           }`}>
              <Target size={20} />
           </div>
           <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 italic">Yapay Zeka</span>
              <span className="text-lg font-black font-heading leading-tight">Rayiç Değer Analizi</span>
           </div>
        </div>
        <div className="p-2 rounded-xl bg-white/50 border border-white cursor-help group relative">
           <Info size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
           <div className="absolute bottom-full right-0 mb-4 w-72 p-5 bg-slate-900 text-white text-[12px] rounded-[24px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-2xl z-20 font-medium leading-relaxed italic border border-white/10 backdrop-blur-md">
              Bu değer, benzer marka, model, yıl ve kilometredeki gerçek piyasa verileri analiz edilerek OtoBurada AI tarafından hesaplanmaktadır.
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-4xl font-black tabular-nums tracking-tighter font-heading text-slate-900 italic">
          ₺{formatNumber(fairMarketValue)}
        </div>
        <div className="flex items-center gap-2">
          {isGoodDeal ? (
            <div className="flex items-center gap-2 text-emerald-600 text-[11px] font-black uppercase tracking-widest italic bg-white/80 py-1.5 px-4 rounded-full border border-emerald-100 shadow-sm">
              <TrendingDown size={14} className="animate-bounce" />
              Piyasa Altı (%{Math.abs(diffPercentage)})
            </div>
          ) : isHighPrice ? (
            <div className="flex items-center gap-2 text-amber-600 text-[11px] font-black uppercase tracking-widest italic bg-white/80 py-1.5 px-4 rounded-full border border-amber-100 shadow-sm">
              <TrendingUp size={14} />
              Piyasa Üstü (+%{diffPercentage})
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-600 text-[11px] font-black uppercase tracking-widest italic bg-white/80 py-1.5 px-4 rounded-full border border-slate-100 shadow-sm">
              <Target size={14} />
              Normal Fiyat
            </div>
          )}
        </div>
      </div>
      
      {isGoodDeal && (
        <div className="mt-6 p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 text-[13px] font-bold text-emerald-800 italic leading-relaxed">
          Bu araç gerçek değerinin <strong className="font-black">₺{formatNumber(fairMarketValue - price)}</strong> altında. Kaçırılmayacak bir fırsat!
        </div>
      )}
    </div>
  );
}

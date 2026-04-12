import { Info, Target, TrendingDown, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface MarketValueCardProps {
  price: number;
  marketPriceIndex: number;
}

export function MarketValueCard({ price, marketPriceIndex }: MarketValueCardProps) {
  // Fair market value = advertised price / index
  // If index is 1.10, it means current price is 110% of market, so market is price/1.10
  const fairMarketValue = Math.round(price / marketPriceIndex);
  const diffPercentage = Math.round((marketPriceIndex - 1) * 100);
  
  const isGoodDeal = marketPriceIndex <= 0.96;
  const isHighPrice = marketPriceIndex >= 1.05;

  return (
    <div className={`p-6 rounded-[32px] border-2 transition-all duration-500 ${
      isGoodDeal 
        ? "bg-emerald-50 border-emerald-100 shadow-xl shadow-emerald-500/5 ring-8 ring-emerald-500/5" 
        : isHighPrice 
          ? "bg-amber-50 border-amber-100" 
          : "bg-indigo-50 border-indigo-100"
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
           <div className={`size-8 rounded-xl flex items-center justify-center ${
             isGoodDeal ? "bg-emerald-500 text-white" : "bg-indigo-500 text-white"
           }`}>
              <Target size={18} />
           </div>
           <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 italic">Piyasa Analizi</span>
              <span className="text-[15px] font-black italic">OtoBurada Rayiç Değeri</span>
           </div>
        </div>
        <div className="p-2 rounded-lg bg-white/50 border border-white cursor-help group relative">
           <Info size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
           <div className="absolute bottom-full right-0 mb-2 w-72 p-4 bg-slate-900 text-white text-[12px] rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-2xl z-20 font-medium leading-relaxed italic">
              Rayiç değer, benzer marka, model, yıl ve kilometredeki diğer ilanlar ile güncel pazar verileri analiz edilerek AI algoritmalarımız tarafından hesaplanmaktadır.
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-3xl font-black tabular-nums italic">
          ₺{formatNumber(fairMarketValue)}
        </div>
        <div className="flex items-center gap-2">
          {isGoodDeal ? (
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-black uppercase tracking-tight italic bg-white/60 py-1 px-3 rounded-full border border-emerald-100 shadow-sm">
              <TrendingDown size={14} />
              Piyasa Altı (%{Math.abs(diffPercentage)})
            </div>
          ) : isHighPrice ? (
            <div className="flex items-center gap-1.5 text-amber-600 text-xs font-black uppercase tracking-tight italic bg-white/60 py-1 px-3 rounded-full border border-amber-100 shadow-sm">
              <TrendingUp size={14} />
              Piyasa Üstü (+%{diffPercentage})
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-600 text-xs font-black uppercase tracking-tight italic bg-white/60 py-1 px-3 rounded-full border border-slate-100 shadow-sm">
              <Target size={14} />
              Normal Fiyat
            </div>
          )}
        </div>
      </div>
      
      {isGoodDeal && (
        <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-800 italic leading-snug">
          Fiyat kaçırılmayacak düzeyde! Benzer araçlara göre ₺{formatNumber(fairMarketValue - price)} daha avantajlı.
        </div>
      )}
    </div>
  );
}

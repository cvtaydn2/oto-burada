import { Info, ShieldAlert, Target, TrendingDown, TrendingUp } from "lucide-react";

import { analyzeListingValue } from "@/features/marketplace/services/pricing-engine";
import { formatNumber } from "@/lib/utils/format";
import { type Listing } from "@/types";

interface MarketValueCardProps {
  listing: Listing;
}

export function MarketValueCard({ listing }: MarketValueCardProps) {
  const analysis = analyzeListingValue(listing);
  const fairMarketValue = analysis.fairValue;

  const isOpportunity = analysis.rating === "opportunity";
  const isOverpriced = analysis.rating === "overpriced";

  return (
    <div
      className={`p-6 rounded-2xl border transition-all duration-300 ${
        isOpportunity
          ? "bg-emerald-50 border-emerald-100 shadow-sm"
          : isOverpriced
            ? "bg-rose-50 border-rose-100 shadow-sm"
            : "bg-blue-50/50 border-blue-100 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`size-10 rounded-xl flex items-center justify-center text-white shadow-md ${
              isOpportunity ? "bg-emerald-500" : "bg-blue-500"
            }`}
          >
            <Target size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Piyasa Analizi
            </span>
            <span className="text-lg font-bold text-gray-800 leading-tight">AI Rayiç Değer</span>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-card border border-gray-100 cursor-help group relative">
          <Info size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
          <div className="absolute bottom-full right-0 mb-3 w-64 p-4 bg-gray-900 text-white text-[11px] rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-sm z-20 font-medium leading-relaxed border border-white/10">
            Bu değer; aracın markası, modeli, yılı, kilometresi ve{" "}
            <strong className="text-blue-300">ekspertiz durumu</strong> analiz edilerek OtoBurada AI
            tarafından hesaplanmaktadır.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {formatNumber(fairMarketValue)} TL
        </div>
        <div className="flex items-center gap-2">
          {isOpportunity ? (
            <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase tracking-widest bg-card py-1.5 px-3 rounded-full border border-emerald-100 shadow-sm">
              <TrendingDown size={14} className="animate-bounce" />
              SÜPER FIRSAT
            </div>
          ) : isOverpriced ? (
            <div className="flex items-center gap-1.5 text-rose-600 text-[10px] font-bold uppercase tracking-widest bg-card py-1.5 px-3 rounded-full border border-rose-100 shadow-sm">
              <TrendingUp size={14} />
              Piyasa Üstü
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-blue-600 text-[10px] font-bold uppercase tracking-widest bg-card py-1.5 px-3 rounded-full border border-blue-100 shadow-sm">
              <Target size={14} />
              Adil Fiyat
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div
          className={`p-4 rounded-xl text-xs font-semibold leading-relaxed border ${
            isOpportunity
              ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-800"
              : "bg-card/50 border-gray-100 text-gray-600"
          }`}
        >
          {analysis.advice}
        </div>

        {analysis.riskScore === "high" && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-100/50 border border-rose-200 text-[11px] font-bold text-rose-700">
            <ShieldAlert size={16} className="shrink-0" />
            <span>Kritik parçalarda işlem mevcut. Detaylı ekspertiz raporunu inceleyin.</span>
          </div>
        )}
      </div>
    </div>
  );
}

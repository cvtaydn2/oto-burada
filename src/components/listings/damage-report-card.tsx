"use client";

import { carPartDamageStatusLabels, carPartLabels, carParts } from "@/lib/constants/domain";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState } from "react";

interface DamageReportCardProps {
  damageStatus?: Record<string, any> | null;
  tramerAmount?: number | null;
}

export function DamageReportCard({ damageStatus, tramerAmount }: DamageReportCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!damageStatus || Object.keys(damageStatus).length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-600 mb-2">
          <CheckCircle2 size={20} />
          <h3 className="font-bold text-slate-900">Boya ve Değişen Yok</h3>
        </div>
        <p className="text-sm text-slate-500">
          Satıcı tarafından belirtilen herhangi bir kaza, boya veya değişen parça bulunmamaktadır.
        </p>
        {tramerAmount != null && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
            <span className="text-slate-500">Tramer Kaydı</span>
            <span className="font-bold text-slate-900">
              {tramerAmount === 0 ? "Kayıt Yok" : `${tramerAmount.toLocaleString("tr-TR")} TL`}
            </span>
          </div>
        )}
      </div>
    );
  }

  const statusCounts = {
    orjinal: 0,
    boyali: 0,
    lokal_boyali: 0,
    degisen: 0,
    bilinmiyor: 0,
  };

  carParts.forEach((part) => {
    const status = (damageStatus[part] as keyof typeof statusCounts) || "orjinal";
    statusCounts[status]++;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "orjinal": return "text-emerald-600 bg-emerald-50";
      case "boyali": return "text-amber-600 bg-amber-50";
      case "lokal_boyali": return "text-orange-600 bg-orange-50";
      case "degisen": return "text-red-600 bg-red-50";
      default: return "text-slate-500 bg-slate-50";
    }
  };

  const hasIssues = statusCounts.boyali > 0 || statusCounts.degisen > 0 || statusCounts.lokal_boyali > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {hasIssues ? (
              <AlertCircle size={20} className="text-amber-500" />
            ) : (
              <CheckCircle2 size={20} className="text-emerald-500" />
            )}
            <h3 className="font-bold text-slate-900 text-base">Ekspertiz Özet Durumu</h3>
          </div>
          {tramerAmount != null && (
            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Tramer</div>
              <div className="text-sm font-bold text-slate-900">
                {tramerAmount === 0 ? "Hasar Kayıtsız" : `${tramerAmount.toLocaleString("tr-TR")} TL`}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
            <div className="text-xl font-black text-emerald-700">{statusCounts.orjinal}</div>
            <div className="text-[10px] font-bold text-emerald-600 uppercase">Orijinal</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
            <div className="text-xl font-black text-amber-700">{statusCounts.boyali + statusCounts.lokal_boyali}</div>
            <div className="text-[10px] font-bold text-amber-600 uppercase">Boyalı</div>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
            <div className="text-xl font-black text-red-700">{statusCounts.degisen}</div>
            <div className="text-[10px] font-bold text-red-600 uppercase">Değişen</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <div className="text-xl font-black text-slate-700">{statusCounts.bilinmiyor}</div>
            <div className="text-[10px] font-bold text-slate-600 uppercase">Bilinmiyor</div>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors"
        >
          {isExpanded ? "Detayları Gizle" : "Tüm Parçaları Gör"}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="bg-slate-50/50 border-t border-slate-100 p-5 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {carParts.map((part) => {
              const status = (damageStatus[part] as keyof typeof carPartDamageStatusLabels) || "orjinal";
              return (
                <div key={part} className="flex items-center justify-between py-1.5 border-b border-white last:border-0 sm:last:border-b">
                  <span className="text-[13px] font-medium text-slate-600">{carPartLabels[part]}</span>
                  <span className={cn(
                    "text-[12px] font-bold px-2 py-0.5 rounded-md border",
                    status === "orjinal" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                    status === "degisen" ? "bg-red-50 text-red-700 border-red-100" : 
                    "bg-amber-50 text-amber-700 border-amber-100"
                  )}>
                    {carPartDamageStatusLabels[status]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs text-slate-400 bg-white p-3 rounded-xl border border-slate-100">
            <Info size={14} className="shrink-0 mt-0.5" />
            Bu bilgiler satıcının beyanıdır. Alırken ekspertiz yaptırılması önerilir.
          </div>
        </div>
      )}
    </div>
  );
}

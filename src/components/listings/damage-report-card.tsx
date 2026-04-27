"use client";

import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState } from "react";

import { carPartDamageStatusLabels, carPartLabels, carParts } from "@/lib/constants/domain";
import { cn } from "@/lib/utils";

import { VisualDamageMap } from "./visual-damage-map";

interface DamageReportCardProps {
  damageStatus?: Record<string, string> | null;
  tramerAmount?: number | null;
}

export function DamageReportCard({ damageStatus, tramerAmount }: DamageReportCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!damageStatus || Object.keys(damageStatus).length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-600 mb-2">
          <CheckCircle2 size={20} />
          <h3 className="font-bold text-foreground">Boya ve Değişen Yok</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Satıcı tarafından belirtilen herhangi bir kaza, boya veya değişen parça bulunmamaktadır.
        </p>
        {tramerAmount != null && (
          <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Tramer Kaydı</span>
            <span className="font-bold text-foreground">
              {tramerAmount === 0 ? "Kayıt Yok" : `${tramerAmount.toLocaleString("tr-TR")} TL`}
            </span>
          </div>
        )}
      </div>
    );
  }

  const statusCounts = {
    orijinal: 0,
    boyali: 0,
    lokal_boyali: 0,
    degisen: 0,
    bilinmiyor: 0,
  };

  carParts.forEach((part) => {
    const status = (damageStatus[part] as keyof typeof statusCounts) || "orijinal";
    statusCounts[status]++;
  });

  const hasIssues =
    statusCounts.boyali > 0 || statusCounts.degisen > 0 || statusCounts.lokal_boyali > 0;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="p-5">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Legend and Overview */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {hasIssues ? (
                  <AlertCircle size={20} className="text-amber-500" />
                ) : (
                  <CheckCircle2 size={20} className="text-emerald-500" />
                )}
                <h3 className="font-bold text-foreground text-base italic">
                  Ekspertiz Özet Durumu
                </h3>
              </div>
              {tramerAmount != null && (
                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">
                    Tramer Kaydı
                  </div>
                  <div className="text-base font-bold text-gray-900 leading-none">
                    {tramerAmount === 0
                      ? "Hasar Kayıtsız"
                      : `${tramerAmount.toLocaleString("tr-TR")} TL`}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-center justify-between">
                <span className="font-bold text-gray-400 uppercase tracking-tighter">Orijinal</span>
                <span className="text-lg font-bold text-emerald-600">{statusCounts.orijinal}</span>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 flex items-center justify-between">
                <span className="font-bold text-gray-400 uppercase tracking-tighter">Boyalı</span>
                <span className="text-lg font-bold text-orange-600">
                  {statusCounts.boyali + statusCounts.lokal_boyali}
                </span>
              </div>
              <div className="bg-red-50 rounded-xl p-3 border border-red-100 flex items-center justify-between">
                <span className="font-bold text-gray-400 uppercase tracking-tighter">Değişen</span>
                <span className="text-lg font-bold text-red-600">{statusCounts.degisen}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-400 uppercase tracking-tighter">
                  Bilinmiyor
                </span>
                <span className="text-lg font-bold text-gray-600">{statusCounts.bilinmiyor}</span>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-blue-100 bg-blue-50/50 text-blue-600 text-xs font-bold uppercase tracking-wider hover:bg-blue-100 transition-all shadow-sm group"
            >
              {isExpanded ? "Detayları Gizle" : "Boya/Değişen Detayları"}
              {isExpanded ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown
                  size={16}
                  className="group-hover:translate-y-0.5 transition-transform"
                />
              )}
            </button>
          </div>

          {/* Graphical Map */}
          <div className="w-full md:w-[200px] flex shrink-0 justify-center">
            <VisualDamageMap damageStatus={damageStatus} className="w-full max-w-[180px]" />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-muted/50 border-t border-border/50 p-5 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {carParts.map((part) => {
              const status =
                (damageStatus[part] as keyof typeof carPartDamageStatusLabels) || "orijinal";
              return (
                <div
                  key={part}
                  className="flex items-center justify-between py-1.5 border-b border-white last:border-0 sm:last:border-b"
                >
                  <span className="text-[13px] font-medium text-muted-foreground">
                    {carPartLabels[part]}
                  </span>
                  <span
                    className={cn(
                      "text-[12px] font-bold px-2 py-0.5 rounded-md border",
                      status === "orijinal"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : status === "degisen"
                          ? "bg-red-50 text-red-700 border-red-100"
                          : "bg-amber-50 text-amber-700 border-amber-100"
                    )}
                  >
                    {carPartDamageStatusLabels[status]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground/70 bg-card p-3 rounded-xl border border-border/50">
            <Info size={14} className="shrink-0 mt-0.5" />
            Bu bilgiler satıcının beyanıdır. Alırken ekspertiz yaptırılması önerilir.
          </div>
        </div>
      )}
    </div>
  );
}

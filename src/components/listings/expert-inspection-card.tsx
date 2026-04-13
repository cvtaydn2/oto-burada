"use client";
import { useMemo } from "react";

import {
  CheckCircle2,
  ClipboardList,
  Gauge,
  Info,
  ShieldCheck,
  Snowflake,
  Sparkles,
  CircleDot,
  Wrench,
  Car,
} from "lucide-react";

import {
  expertInspectionGradeInfo,
} from "@/types";
import type { ExpertInspection } from "@/types";
import { cn, formatDate } from "@/lib/utils";

interface ExpertInspectionCardProps {
  expertInspection?: ExpertInspection;
  className?: string;
}

const statusConfig = {
  var: {
    label: "Değişmemiş",
    color: "text-green-600",
    bg: "bg-green-50",
    icon: CheckCircle2,
  },
  yok: {
    label: "Değişmiş/Onarılmış",
    color: "text-amber-600",
    bg: "bg-amber-50",
    icon: Wrench,
  },
  bilinmiyor: {
    label: "Bilinmiyor",
    color: "text-gray-500",
    bg: "bg-gray-50",
    icon: Info,
  },
};

const inspectionItems = [
  { key: "damageRecord", label: "Hasar Kaydı", icon: ShieldCheck },
  { key: "bodyPaint", label: "Boya Durumu", icon: Sparkles },
  { key: "engine", label: "Motor", icon: Gauge },
  { key: "transmission", label: "Şanzıman", icon: Wrench },
  { key: "suspension", label: "Süspansiyon", icon: Car },
  { key: "brakes", label: "Fren Sistemi", icon: ShieldCheck },
  { key: "electrical", label: "Elektrik", icon: Info },
  { key: "interior", label: "İç Döşeme", icon: ClipboardList },
  { key: "tires", label: "Lastikler", icon: CircleDot },
  { key: "acHeating", label: "Klima/Isıtma", icon: Snowflake },
] as const;

export function ExpertInspectionCard({
  expertInspection,
  className,
}: ExpertInspectionCardProps) {
  const hasData = useMemo(() => {
    if (!expertInspection) return false;
    const items = inspectionItems.map(i => expertInspection[i.key as keyof ExpertInspection]);
    return items.some(v => v === "var" || v === "yok") || expertInspection.hasInspection;
  }, [expertInspection]);

  if (!hasData || !expertInspection) {
    return null;
  }

  const gradeInfo = expertInspection.overallGrade
    ? expertInspectionGradeInfo.find((g) => g.grade === expertInspection.overallGrade)
    : null;

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.bilinmiyor;
  };

  const isVerified = expertInspection.hasInspection;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Grade Header Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between shadow-sm">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl shadow-md mr-4 shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-blue-900 leading-tight">
              {isVerified ? "Onaylı Ekspertiz Raporu" : "Satıcı Teknik Beyanı"}
            </h2>
            {expertInspection.inspectionDate ? (
              <p className="text-sm text-blue-700 mt-1">
                {formatDate(expertInspection.inspectionDate)} tarihinde düzenlenmiştir.
              </p>
            ) : (
              <p className="text-sm text-blue-700 mt-1">Sistem kaydı mevcut.</p>
            )}
          </div>
        </div>
        
        {isVerified && gradeInfo && (
          <div className="mt-4 md:mt-0 text-center bg-white px-6 py-3 rounded-lg shadow-sm border border-blue-50">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Eksper Puanı</div>
            <div className="text-3xl font-extrabold text-blue-500">
               {gradeInfo.grade === "A" ? "9.8" : gradeInfo.grade === "B" ? "8.5" : "7.0"}
               <span className="text-sm text-gray-400 font-medium">/10</span>
            </div>
          </div>
        )}
      </div>

      {/* Checklist Grid */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="grid gap-px bg-gray-100 sm:grid-cols-2">
          {inspectionItems.map((item) => {
            const status = expertInspection[item.key as keyof ExpertInspection] as string;
            const config = getStatusConfig(status);
            const Icon = config.icon;

            return (
              <div
                key={item.key}
                className="flex items-center gap-3 bg-white px-4 py-3"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    config.bg
                  )}
                >
                  <Icon className={cn("size-4", config.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className={cn("truncate text-sm font-bold", config.color)}>
                    {config.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {expertInspection.notes && (
          <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
            <p className="text-xs text-gray-500">
              <span className="font-bold text-gray-700 uppercase mr-2 text-[10px]">Uzman Notu:</span>
              {expertInspection.notes}
            </p>
          </div>
        )}

        {expertInspection.documentUrl && (
          <div className="border-t border-gray-100 bg-blue-50/30 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <ShieldCheck size={16} />
              <span className="text-xs font-bold">Resmi Rapor Mevcut</span>
            </div>
            <a
              href={expertInspection.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
            >
              PDF Olarak İndir
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

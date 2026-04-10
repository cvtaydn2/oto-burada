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
    <div
      className={cn(
        "overflow-hidden rounded-3xl border shadow-sm transition-all hover:shadow-md",
        isVerified 
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-background" 
          : "border-slate-200 bg-white",
        className
      )}
    >
      <div className={cn(
        "flex items-center justify-between border-b px-5 py-4",
        isVerified ? "border-emerald-100 bg-emerald-50/50" : "border-slate-100 bg-slate-50/50"
      )}>
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            isVerified ? "bg-emerald-100" : "bg-slate-200/50"
          )}>
            <ClipboardList className={cn("size-5", isVerified ? "text-emerald-700" : "text-slate-600")} />
          </div>
          <div>
            <h3 className="font-bold text-foreground">
              {isVerified ? "Ekspertiz Raporu (Onaylı)" : "Satıcı Beyanı — Teknik Durum"}
            </h3>
            {expertInspection.inspectionDate && (
              <p className="text-xs text-muted-foreground">
                Tarih: {formatDate(expertInspection.inspectionDate)}
              </p>
            )}
            {!isVerified && (
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                <Info size={12} />
                Satıcının kendi beyanıdır
              </p>
            )}
          </div>
        </div>

        {isVerified && gradeInfo && (
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2"
            style={{ backgroundColor: `${gradeInfo.color}15` }}
          >
            <ShieldCheck className="size-5" style={{ color: gradeInfo.color }} />
            <span className="font-semibold" style={{ color: gradeInfo.color }}>
              {gradeInfo.label}
            </span>
          </div>
        )}

        {expertInspection.totalScore !== undefined && (
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">
              {expertInspection.totalScore}
              <span className="text-sm font-normal text-muted-foreground">/100</span>
            </p>
            <p className="text-xs text-muted-foreground">Puan</p>
          </div>
        )}
      </div>

      <div className="grid gap-px bg-border/40 sm:grid-cols-2 lg:grid-cols-5">
        {inspectionItems.map((item) => {
          const status = expertInspection[item.key as keyof ExpertInspection] as string;
          const config = getStatusConfig(status);
          const Icon = config.icon;

          return (
            <div
              key={item.key}
              className="flex items-center gap-3 bg-background px-4 py-3"
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
                <p className="truncate text-xs font-medium text-muted-foreground">
                  {item.label}
                </p>
                <p className={cn("truncate text-sm font-semibold", config.color)}>
                  {config.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {expertInspection.notes && (
        <div className="border-t border-border/60 bg-muted/20 px-5 py-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Notlar:</span>{" "}
            {expertInspection.notes}
          </p>
        </div>
      )}

      {expertInspection.inspectedBy && (
        <div className="border-t border-border/60 bg-muted/20 px-5 py-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">İncelemeci:</span>{" "}
            {expertInspection.inspectedBy}
          </p>
        </div>
      )}

      {expertInspection.documentUrl && (
        <div className="border-t border-border/60 bg-emerald-50/50 px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                Doğrulanmış Ekspertiz Belgesi
              </p>
              <p className="text-xs text-emerald-600/80 mt-0.5">
                Bu araç için sisteme bağımsız ekspertiz raporu/kanıtı yüklenmiştir.
              </p>
            </div>
            <a
              href={expertInspection.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Raporu Görüntüle
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

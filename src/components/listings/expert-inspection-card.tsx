"use client";

import {
  Car,
  CheckCircle2,
  ClipboardList,
  HelpCircle,
  Info,
  ShieldCheck,
  Sparkles,
  Wrench,
  XCircle,
} from "lucide-react";
import { useMemo } from "react";

import { cn, formatDate } from "@/lib/utils";
import type { ExpertInspection } from "@/types";
import { expertInspectionGradeInfo } from "@/types";

interface ExpertInspectionCardProps {
  expertInspection?: ExpertInspection;
  className?: string;
}

// Tasarıma göre 3 sütun: Motor & Mekanik / Yürüyen & Şanzıman / Elektronik
const INSPECTION_CATEGORIES = [
  {
    title: "Motor & Mekanik",
    icon: Wrench,
    items: [
      { key: "engine", label: "Motor Performansı" },
      { key: "damageRecord", label: "Hasar Kaydı" },
      { key: "bodyPaint", label: "Boya Durumu" },
    ],
  },
  {
    title: "Yürüyen & Şanzıman",
    icon: Car,
    items: [
      { key: "transmission", label: "Şanzıman Geçişleri" },
      { key: "suspension", label: "Amortisörler" },
      { key: "brakes", label: "Fren Disk / Balata" },
    ],
  },
  {
    title: "Elektronik",
    icon: Sparkles,
    items: [
      { key: "electrical", label: "OBD Arıza Taraması" },
      { key: "interior", label: "İç Döşeme / Multimedya" },
      { key: "acHeating", label: "Klima Performansı" },
      { key: "tires", label: "Lastik Durumu" },
    ],
  },
] as const;

function StatusBadge({ status }: { status: string }) {
  if (status === "var") {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600">
        <CheckCircle2 size={14} className="text-green-500" />
        <span>Kusursuz</span>
      </div>
    );
  }
  if (status === "yok") {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600">
        <XCircle size={14} className="text-red-500" />
        <span>Değişmiş/Onarılmış</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
      <HelpCircle size={14} className="text-gray-400" />
      <span>Bilinmiyor</span>
    </div>
  );
}

export function ExpertInspectionCard({ expertInspection, className }: ExpertInspectionCardProps) {
  const hasData = useMemo(() => {
    if (!expertInspection) return false;
    const keys = [
      "engine",
      "transmission",
      "suspension",
      "brakes",
      "electrical",
      "interior",
      "tires",
      "acHeating",
      "damageRecord",
      "bodyPaint",
    ] as const;
    return (
      keys.some((k) => expertInspection[k] === "var" || expertInspection[k] === "yok") ||
      expertInspection.hasInspection
    );
  }, [expertInspection]);

  // Ekspertiz yoksa bilgilendirici kart
  if (!hasData || !expertInspection) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600">
            <Info size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Ekspertiz Bilgisi Paylaşılmamış</h3>
            <p className="text-sm text-muted-foreground">
              Bu ilanda doğrulanmış ekspertiz raporu henüz eklenmemiş.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Durum
            </div>
            <div className="mt-2 text-sm font-bold text-foreground">
              Satıcı beyanı mevcut, bağımsız ekspertiz yok
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Öneri
            </div>
            <div className="mt-2 text-sm font-bold text-foreground">
              Aracı görmeden önce ekspertiz raporu ve servis kontrolü isteyin
            </div>
          </div>
        </div>
      </div>
    );
  }

  const gradeInfo = expertInspection.overallGrade
    ? expertInspectionGradeInfo.find((g) => g.grade === expertInspection.overallGrade)
    : null;

  // Puan hesapla: grade'e göre veya totalScore'dan
  const scoreDisplay = expertInspection.totalScore
    ? `${expertInspection.totalScore}`
    : gradeInfo?.grade === "a"
      ? "9.8"
      : gradeInfo?.grade === "b"
        ? "8.5"
        : gradeInfo?.grade === "c"
          ? "7.2"
          : gradeInfo?.grade === "d"
            ? "5.8"
            : "4.5";

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* 1. Onaylı Ekspertiz Banner - Tasarıma göre mavi */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-md">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-blue-900">
              {expertInspection.hasInspection ? "Onaylı Ekspertiz Raporu" : "Satıcı Teknik Beyanı"}
            </h2>
            <p className="text-sm text-blue-700 mt-0.5">
              {expertInspection.inspectedBy
                ? `${expertInspection.inspectedBy} tarafından`
                : "Satıcı tarafından"}{" "}
              {expertInspection.inspectionDate
                ? `${formatDate(expertInspection.inspectionDate)} tarihinde düzenlenmiştir.`
                : "beyan edilmiştir."}
            </p>
          </div>
        </div>
        <div className="shrink-0 rounded-lg border border-blue-100 bg-card px-6 py-3 text-center shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            Eksper Puanı
          </div>
          <div className="text-3xl font-extrabold text-blue-500">
            {scoreDisplay}
            <span className="text-sm font-medium text-gray-400">/10</span>
          </div>
        </div>
      </div>

      {/* 2. Uzman Görüşü - Tasarıma göre */}
      {expertInspection.notes && (
        <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800">
            <svg
              className="size-4 text-blue-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Uzman Görüşü
          </h3>
          <div className="relative rounded-xl border border-gray-100 bg-gray-50 p-5">
            <svg
              className="absolute top-3 left-3 size-8 text-gray-200"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <p className="relative z-10 pt-2 pl-2 text-sm italic leading-relaxed text-gray-600">
              {expertInspection.notes}
            </p>
          </div>
          {expertInspection.inspectedBy && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                {expertInspection.inspectedBy[0]}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-800">
                  {expertInspection.inspectedBy}
                </div>
                <div className="text-[10px] font-medium text-gray-500">Ekspertiz Uzmanı</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Teknik Checklist - Tasarıma göre 3 sütun */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {INSPECTION_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.title}
              className="rounded-xl border border-gray-200 bg-card p-5 shadow-sm"
            >
              <h3 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3 text-xs font-bold uppercase tracking-wider text-gray-800">
                <Icon size={14} className="text-gray-400" />
                {cat.title}
              </h3>
              <ul className="space-y-3">
                {cat.items.map((item) => {
                  const status =
                    (expertInspection[item.key as keyof ExpertInspection] as string) ??
                    "bilinmiyor";
                  return (
                    <li key={item.key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.label}</span>
                      <StatusBadge status={status} />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* 4. PDF İndir */}
      {expertInspection.documentUrl && (
        <div className="flex justify-center">
          <a
            href={expertInspection.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-card px-6 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600"
          >
            <ClipboardList size={18} />
            Ekspertiz Raporunu İndir (PDF)
          </a>
        </div>
      )}
    </div>
  );
}

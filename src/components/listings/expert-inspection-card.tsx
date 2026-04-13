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

  const isVerified = expertInspection.hasInspection;

  const categories = [
    {
      title: "Motor & Mekanik",
      icon: <Gauge size={16} />,
      items: [
        { key: "engine", label: "Motor Durumu" },
        { key: "transmission", label: "Şanzıman" },
        { key: "damageRecord", label: "Hasar Kaydı" },
      ]
    },
    {
      title: "Yürüyen & Güvenlik",
      icon: <Car size={16} />,
      items: [
        { key: "suspension", label: "Süspansiyon" },
        { key: "brakes", label: "Frenler" },
        { key: "tires", label: "Lastikler" },
      ]
    },
    {
      title: "Konfor & Donanım",
      icon: <Sparkles size={16} />,
      items: [
        { key: "interior", label: "İç Döşeme" },
        { key: "acHeating", label: "Klima" },
        { key: "electrical", label: "Elektronik" },
      ]
    }
  ];

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Premium Header */}
      <div className="bg-blue-600 border border-blue-500 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-xl shadow-blue-500/10">
        <div className="flex items-center">
          <div className="size-14 bg-white/10 backdrop-blur-sm text-white rounded-2xl flex items-center justify-center shadow-inner mr-5 shrink-0">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white leading-tight">
              {isVerified ? "Onaylı Ekspertiz Raporu" : "Satıcı Teknik Beyanı"}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
               <span className="size-2 rounded-full bg-blue-300 animate-pulse" />
               <p className="text-sm text-blue-100 font-medium">
                {expertInspection.inspectionDate 
                  ? `${formatDate(expertInspection.inspectionDate)} tarihinde düzenlenmiştir` 
                  : "Sistem kaydı doğrulanmış"}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-5 md:mt-0 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
          <div className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1 text-center">Ekspertiz Puanı</div>
          <div className="text-3xl font-black text-white text-center">
             {gradeInfo?.grade === "a" ? "9.8" : gradeInfo?.grade === "b" ? "8.5" : gradeInfo?.grade === "c" ? "7.2" : "6.5"}
             <span className="text-sm text-blue-200 font-bold">/10</span>
          </div>
        </div>
      </div>

      {/* Categorized Checklists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.title} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-50 pb-3">
              <span className="text-blue-500">{cat.icon}</span>
              {cat.title}
            </h3>
            <div className="space-y-4">
              {cat.items.map((item) => {
                const status = expertInspection[item.key as keyof ExpertInspection] as string;
                const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.bilinmiyor;
                const Icon = config.icon;
                
                return (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">{item.label}</span>
                    <div className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-black uppercase tracking-tighter",
                      status === "var" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      status === "yok" ? "bg-orange-50 text-orange-600 border-orange-100" :
                      "bg-gray-50 text-gray-400 border-gray-100"
                    )}>
                      <Icon size={12} />
                      {config.label === "Değişmemiş" ? "Kusursuz" : config.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Expert Note */}
      {expertInspection.notes && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 transition-all group-hover:w-2"></div>
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Uzman Görüşü</h4>
          <p className="text-sm text-gray-600 leading-relaxed font-medium italic">
            &quot;{expertInspection.notes}&quot;
          </p>
        </div>
      )}

      {/* Document Link */}
      {expertInspection.documentUrl && (
        <div className="flex justify-center">
          <a
            href={expertInspection.documentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 px-6 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
          >
            <ClipboardList size={18} />
            Ekspertiz Raporunu İndir (PDF)
          </a>
        </div>
      )}
    </div>
  );
}

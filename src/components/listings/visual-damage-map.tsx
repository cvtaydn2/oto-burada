"use client";

import { carParts, carPartLabels, carPartDamageStatusLabels } from "@/lib/constants/domain";
import { cn } from "@/lib/utils";

interface VisualDamageMapProps {
  damageStatus: Record<string, string>;
  className?: string;
}

const statusColors: Record<string, string> = {
  orjinal: "fill-white stroke-slate-300",
  boyali: "fill-amber-400 stroke-amber-600",
  lokal_boyali: "fill-orange-400 stroke-orange-600",
  degisen: "fill-red-400 stroke-red-600",
  bilinmiyor: "fill-slate-200 stroke-slate-400",
};

export function VisualDamageMap({ damageStatus, className }: VisualDamageMapProps) {
  const getStatus = (part: string) => damageStatus[part] || "orjinal";

  return (
    <div className={cn("relative flex items-center justify-center rounded-3xl border border-slate-100 bg-slate-50/30 p-4", className)}>
      <svg viewBox="0 0 240 460" className="h-auto w-full max-w-[180px] drop-shadow-lg">
        {/* Base Car Body Shadow */}
        <path d="M50,40 Q50,20 120,20 Q190,20 190,40 L195,100 L200,300 Q200,440 120,440 Q40,440 40,300 L45,100 Z" fill="rgba(0,0,0,0.05)" />
        
        {/* Part: Kaput */}
        <path 
          d="M60,65 Q60,40 120,40 Q180,40 180,65 L185,130 Q120,135 55,130 Z" 
          className={cn("transition-colors duration-500", statusColors[getStatus("kaput")])}
          strokeWidth="2"
        />
        
        {/* Part: On Tampon */}
        <path 
          d="M60,30 Q120,25 180,30 L185,45 Q120,40 55,45 Z" 
          className={cn("transition-colors duration-500", statusColors[getStatus("on_tampon")])}
          strokeWidth="2"
        />

        {/* Part: Sol On Camurluk */}
        <path 
          d="M45,100 L55,100 L55,180 L45,180 Z" 
          className={cn("transition-colors duration-500", statusColors[getStatus("sol_on_camurluk")])}
          strokeWidth="2"
        />

        {/* Part: Sag On Camurluk */}
        <path 
          d="M185,100 L195,100 L195,180 L185,180 Z" 
          className={cn("transition-colors duration-500", statusColors[getStatus("sag_on_camurluk")])}
          strokeWidth="2"
        />

        {/* Part: Sol On Kapi */}
        <path 
          d="M48,185 L58,185 L58,260 L48,260 Z" 
          className={cn("transition-colors duration-500", statusColors[getStatus("sol_on_kapi")])}
          strokeWidth="2"
        />

        {/* Part: Sag On Kapi */}
        <path 
          d="M182,185 L192,185 L192,260 L182,260 Z" 
          className={cn("transition-colors duration-500", statusColors[getStatus("sag_on_kapi")])}
          strokeWidth="2"
        />

        {/* Part: Sol Arka Kapi */}
        <path 
          d="M48,265 L58,265 L58,340 L48,340 Z" 
          className={cn("transition-colors duration-500", statusColors[getStatus("sol_arka_kapi")])}
          strokeWidth="2"
        />

        {/* Part: Sag Arka Kapi */}
        <path 
          d="M182,265 L192,265 L192,340 L182,340 Z" 
          className={cn("transition-colors duration-500", statusColors[getStatus("sag_arka_kapi")])}
          strokeWidth="2"
        />

        {/* Part: Sol Arka Camurluk */}
        <path 
          d="M46,345 L56,345 L56,410 Q46,410 46,345 Z" 
          className={cn("transition-colors duration-500", statusColors[getStatus("sol_arka_camurluk")])}
          strokeWidth="2"
        />

        {/* Part: Sag Arka Camurluk */}
        <path 
          d="M184,345 L194,345 L194,410 Q184,410 184,345 Z" 
          className={cn("transition-colors duration-500", statusColors[getStatus("sag_arka_camurluk")])}
          strokeWidth="2"
        />

        {/* Part: Tavan */}
        <rect 
          x="65" y="150" width="110" height="180" rx="20"
          className={cn("transition-colors duration-500", statusColors[getStatus("tavan")])}
          strokeWidth="2"
        />

        {/* Part: Bagaj */}
        <path 
          d="M65,340 L175,340 L180,410 Q120,420 60,410 Z" 
          className={cn("transition-colors duration-500", statusColors[getStatus("bagaj")])}
          strokeWidth="2"
        />

        {/* Part: Arka Tampon */}
        <path 
          d="M60,425 Q120,435 180,425 L185,440 Q120,450 55,440 Z" 
          className={cn("transition-colors duration-500", statusColors[getStatus("arka_tampon")])}
          strokeWidth="2"
        />
      </svg>
      
      {/* Legend for Visual Map */}
      <div className="absolute bottom-2 right-4 flex flex-col gap-1 items-end">
        {(["boyali", "degisen"] as const).map(s => (
           <div key={s} className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
              <div className={cn("size-2.5 rounded-full", s === "boyali" ? "bg-amber-400" : "bg-red-400")} />
              <span className="text-[11px] font-bold uppercase tracking-tight text-slate-700">
                {carPartDamageStatusLabels[s]}
              </span>
           </div>
        ))}
      </div>
    </div>
  );
}

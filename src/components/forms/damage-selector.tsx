"use client";

import { Check, ChevronDown, Info, RotateCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";

import {
  carPartDamageStatuses,
  carPartDamageStatusLabels,
  carPartLabels,
  carParts,
} from "@/lib/constants/domain";
import { cn } from "@/lib/utils";

interface DamageSelectorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  className?: string;
  isDisabled?: boolean;
}

const statusColors: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  orjinal: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    fill: "fill-emerald-400",
  },
  boyali: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    fill: "fill-amber-400",
  },
  lokal_boyali: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    fill: "fill-orange-400",
  },
  degisen: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    fill: "fill-red-400",
  },
  bilinmiyor: {
    bg: "bg-muted/30",
    border: "border-border",
    text: "text-muted-foreground",
    fill: "fill-slate-300",
  },
};

export function DamageSelector({ value, onChange, className, isDisabled }: DamageSelectorProps) {
  const [activePart, setActivePart] = useState<string | null>(null);

  const handleStatusChange = (part: string, status: string) => {
    const newValue = { ...value, [part]: status };
    if (status === "orjinal") {
      delete newValue[part]; // Default to original by removing from record
    }
    onChange(newValue);
    setActivePart(null);
  };

  const getStatus = (part: string) => value[part] || "orjinal";

  const clearAll = () => {
    onChange({});
  };

  const affectedPartsCount = Object.keys(value).length;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Info size={16} />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Aracın üzerindeki parçalara tıklayarak durumunu seçebilirsin.
          </p>
        </div>

        {affectedPartsCount > 0 && !isDisabled && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground/70 transition-colors hover:text-red-500"
          >
            <RotateCcw size={12} />
            TÜMÜNÜ SIFIRLA
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Visual Car Diagram */}
        <div className="relative flex items-center justify-center rounded-2xl border border-border/50 bg-muted/50 p-6 sm:p-10">
          <svg viewBox="0 0 240 460" className="h-auto w-full max-w-[220px] drop-shadow-sm">
            {/* Base Car Body Shadow */}
            <path
              d="M50,40 Q50,20 120,20 Q190,20 190,40 L195,100 L200,300 Q200,440 120,440 Q40,440 40,300 L45,100 Z"
              fill="rgba(0,0,0,0.05)"
            />

            {/* Part: Kaput */}
            <path
              d="M60,65 Q60,40 120,40 Q180,40 180,65 L185,130 Q120,135 55,130 Z"
              className={cn(
                "cursor-pointer transition-all duration-300 hover:opacity-80",
                getStatus("kaput") !== "orjinal"
                  ? statusColors[getStatus("kaput")].fill
                  : "fill-white stroke-slate-300"
              )}
              strokeWidth="2"
              onClick={() => !isDisabled && setActivePart("kaput")}
            />

            {/* Part: On Tampon */}
            <path
              d="M60,30 Q120,25 180,30 L185,45 Q120,40 55,45 Z"
              className={cn(
                "cursor-pointer transition-all duration-300 hover:opacity-80",
                getStatus("on_tampon") !== "orjinal"
                  ? statusColors[getStatus("on_tampon")].fill
                  : "fill-white stroke-slate-300"
              )}
              strokeWidth="2"
              onClick={() => !isDisabled && setActivePart("on_tampon")}
            />

            {/* Side Mirrors (Aesthetics) */}
            <path d="M40,140 Q30,140 30,150 L35,165" fill="none" stroke="#cbd5e1" strokeWidth="2" />
            <path
              d="M200,140 Q210,140 210,150 L205,165"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
            />

            {/* Part: Sol On Camurluk */}
            <path
              d="M45,100 L55,100 L55,180 L45,180 Z"
              className={cn(
                "cursor-pointer transition-all duration-300 hover:opacity-80",
                getStatus("sol_on_camurluk") !== "orjinal"
                  ? statusColors[getStatus("sol_on_camurluk")].fill
                  : "fill-white stroke-slate-300"
              )}
              strokeWidth="2"
              onClick={() => !isDisabled && setActivePart("sol_on_camurluk")}
            />

            {/* Part: Sag On Camurluk */}
            <path
              d="M185,100 L195,100 L195,180 L185,180 Z"
              className={cn(
                "cursor-pointer transition-all duration-300 hover:opacity-80",
                getStatus("sag_on_camurluk") !== "orjinal"
                  ? statusColors[getStatus("sag_on_camurluk")].fill
                  : "fill-white stroke-slate-300"
              )}
              strokeWidth="2"
              onClick={() => !isDisabled && setActivePart("sag_on_camurluk")}
            />

            {/* Part: Sol On Kapi */}
            <path
              d="M48,185 L58,185 L58,260 L48,260 Z"
              className={cn(
                "cursor-pointer transition-all duration-300 hover:opacity-80",
                getStatus("sol_on_kapi") !== "orjinal"
                  ? statusColors[getStatus("sol_on_kapi")].fill
                  : "fill-white stroke-slate-300"
              )}
              strokeWidth="2"
              onClick={() => !isDisabled && setActivePart("sol_on_kapi")}
            />

            {/* Part: Sag On Kapi */}
            <path
              d="M182,185 L192,185 L192,260 L182,260 Z"
              className={cn(
                "cursor-pointer transition-all duration-300 hover:opacity-80",
                getStatus("sag_on_kapi") !== "orjinal"
                  ? statusColors[getStatus("sag_on_kapi")].fill
                  : "fill-white stroke-slate-300"
              )}
              strokeWidth="2"
              onClick={() => !isDisabled && setActivePart("sag_on_kapi")}
            />

            {/* Part: Sol Arka Kapi */}
            <path
              d="M48,265 L58,265 L58,340 L48,340 Z"
              className={cn(
                "cursor-pointer transition-all duration-300 hover:opacity-80",
                getStatus("sol_arka_kapi") !== "orjinal"
                  ? statusColors[getStatus("sol_arka_kapi")].fill
                  : "fill-white stroke-slate-300"
              )}
              strokeWidth="2"
              onClick={() => !isDisabled && setActivePart("sol_arka_kapi")}
            />

            {/* Part: Sag Arka Kapi */}
            <path
              d="M182,265 L192,265 L192,340 L182,340 Z"
              className={cn(
                "cursor-pointer transition-all duration-300 hover:opacity-80",
                getStatus("sag_arka_kapi") !== "orjinal"
                  ? statusColors[getStatus("sag_arka_kapi")].fill
                  : "fill-white stroke-slate-300"
              )}
              strokeWidth="2"
              onClick={() => !isDisabled && setActivePart("sag_arka_kapi")}
            />

            {/* Part: Sol Arka Camurluk */}
            <path
              d="M46,345 L56,345 L56,410 Q46,410 46,345 Z"
              className={cn(
                "cursor-pointer transition-all duration-300 hover:opacity-80",
                getStatus("sol_arka_camurluk") !== "orjinal"
                  ? statusColors[getStatus("sol_arka_camurluk")].fill
                  : "fill-white stroke-slate-300"
              )}
              strokeWidth="2"
              onClick={() => !isDisabled && setActivePart("sol_arka_camurluk")}
            />

            {/* Part: Sag Arka Camurluk */}
            <path
              d="M184,345 L194,345 L194,410 Q184,410 184,345 Z"
              className={cn(
                "cursor-pointer transition-all duration-300 hover:opacity-80",
                getStatus("sag_arka_camurluk") !== "orjinal"
                  ? statusColors[getStatus("sag_arka_camurluk")].fill
                  : "fill-white stroke-slate-300"
              )}
              strokeWidth="2"
              onClick={() => !isDisabled && setActivePart("sag_arka_camurluk")}
            />

            {/* Part: Tavan */}
            <rect
              x="65"
              y="150"
              width="110"
              height="180"
              rx="20"
              className={cn(
                "cursor-pointer transition-all duration-300 hover:opacity-80",
                getStatus("tavan") !== "orjinal"
                  ? statusColors[getStatus("tavan")].fill
                  : "fill-white stroke-slate-300"
              )}
              strokeWidth="2"
              onClick={() => !isDisabled && setActivePart("tavan")}
            />

            {/* Interior Details (Aesthetics) */}
            <path d="M75,165 L165,165" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            <path d="M75,315 L165,315" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />

            {/* Part: Bagaj */}
            <path
              d="M65,340 L175,340 L180,410 Q120,420 60,410 Z"
              className={cn(
                "cursor-pointer transition-all duration-300 hover:opacity-80",
                getStatus("bagaj") !== "orjinal"
                  ? statusColors[getStatus("bagaj")].fill
                  : "fill-white stroke-slate-300"
              )}
              strokeWidth="2"
              onClick={() => !isDisabled && setActivePart("bagaj")}
            />

            {/* Part: Arka Tampon */}
            <path
              d="M60,425 Q120,435 180,425 L185,440 Q120,450 55,440 Z"
              className={cn(
                "cursor-pointer transition-all duration-300 hover:opacity-80",
                getStatus("arka_tampon") !== "orjinal"
                  ? statusColors[getStatus("arka_tampon")].fill
                  : "fill-white stroke-slate-300"
              )}
              strokeWidth="2"
              onClick={() => !isDisabled && setActivePart("arka_tampon")}
            />
          </svg>

          {/* Active Overlay Tooltip */}
          {activePart && (
            <div className="absolute inset-x-6 top-1/2 z-30 -translate-y-1/2 animate-in zoom-in-95 duration-200">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-bold uppercase tracking-wide text-foreground">
                    {carPartLabels[activePart as keyof typeof carPartLabels]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActivePart(null)}
                    className="text-xs font-bold text-muted-foreground/70 hover:text-muted-foreground"
                  >
                    KAPAT
                  </button>
                </div>
                <div className="grid gap-2">
                  {carPartDamageStatuses
                    .filter((s) => s !== "bilinmiyor")
                    .map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatusChange(activePart, status)}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                          getStatus(activePart) === status
                            ? cn(
                                statusColors[status].bg,
                                statusColors[status].text,
                                "ring-2 ring-indigo-500/20"
                              )
                            : "bg-muted/30 text-muted-foreground hover:bg-card hover:shadow-md"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              statusColors[status].fill.replace("fill-", "bg-")
                            )}
                          />
                          {carPartDamageStatusLabels[status]}
                        </div>
                        {getStatus(activePart) === status && <Check size={16} />}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* List for Selection and Recap */}
        <div className="flex flex-col gap-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              EKSPERTİZ ÖZETİ ({affectedPartsCount} Parça)
            </h4>

            {affectedPartsCount === 0 ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 text-center">
                <ShieldCheck className="mx-auto mb-2 text-emerald-500" size={24} />
                <p className="text-sm font-bold text-emerald-700">Tüm parçalar orijinal</p>
                <p className="mt-1 text-xs text-emerald-600/70">
                  Değişen veya boyalı parça varsa listeden veya görselden seçebilirsin.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Object.entries(value).map(([part, status]) => (
                  <div
                    key={part}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3 transition-colors",
                      statusColors[status].bg,
                      statusColors[status].border
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {carPartLabels[part as keyof typeof carPartLabels]}
                      </span>
                      <span className={cn("text-xs font-bold", statusColors[status].text)}>
                        {
                          carPartDamageStatusLabels[
                            status as keyof typeof carPartDamageStatusLabels
                          ]
                        }
                      </span>
                    </div>
                    {!isDisabled && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(part, "orjinal")}
                        className="text-muted-foreground/70 hover:text-red-500"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {!isDisabled &&
                carParts
                  .filter((p) => !value[p])
                  .slice(0, 4)
                  .map((part) => (
                    <button
                      key={part}
                      type="button"
                      onClick={() => setActivePart(part)}
                      className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-indigo-300 hover:shadow-sm"
                    >
                      <span className="text-xs font-medium text-muted-foreground truncate">
                        {carPartLabels[part]}
                      </span>
                      <ChevronDown size={14} className="text-muted-foreground/70" />
                    </button>
                  ))}
            </div>

            <div className="rounded-2xl bg-indigo-600 p-4 text-white shadow-sm shadow-indigo-200">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Hızlı İpucu</p>
              <p className="mt-2 text-sm leading-relaxed font-medium">
                Görsel üzerinde her parçayı kolayca işaretleyebilirsin. Şeffaf ekspertiz bilgisi
                alıcıların %40 daha hızlı karar vermesini sağlar.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t pt-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          Lejand:
        </span>
        {carPartDamageStatuses
          .filter((s) => s !== "bilinmiyor" && s !== "orjinal")
          .map((status) => (
            <div
              key={status}
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-tight text-muted-foreground"
            >
              <div
                className={cn(
                  "size-2.5 rounded-full",
                  statusColors[status].fill.replace("fill-", "bg-")
                )}
              />
              {carPartDamageStatusLabels[status]}
            </div>
          ))}
      </div>
    </div>
  );
}

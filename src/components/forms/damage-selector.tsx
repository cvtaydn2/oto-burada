"use client";

import { carPartDamageStatusLabels, carPartDamageStatuses, carPartLabels, carParts } from "@/lib/constants/domain";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

interface DamageSelectorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  className?: string;
}

export function DamageSelector({ value, onChange, className }: DamageSelectorProps) {
  const [openPart, setOpenPart] = useState<string | null>(null);

  const handleStatusChange = (part: string, status: string) => {
    const newValue = { ...value, [part]: status };
    onChange(newValue);
    setOpenPart(null);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "orjinal": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "boyali": return "text-amber-600 bg-amber-50 border-amber-100";
      case "lokal_boyali": return "text-orange-600 bg-orange-50 border-orange-100";
      case "degisen": return "text-red-600 bg-red-50 border-red-100";
      default: return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {carParts.map((part) => {
          const currentStatus = value[part] || "orjinal";
          const isOpen = openPart === part;

          return (
            <div key={part} className="relative">
              <button
                type="button"
                onClick={() => setOpenPart(isOpen ? null : part)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all hover:shadow-sm",
                  isOpen ? "border-indigo-500 ring-4 ring-indigo-500/10 shadow-sm" : "border-slate-200"
                )}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{carPartLabels[part]}</span>
                  <span className={cn(
                    "inline-block rounded-md px-1.5 py-0.5 text-xs font-bold",
                    getStatusColor(currentStatus)
                  )}>
                    {carPartDamageStatusLabels[currentStatus as keyof typeof carPartDamageStatusLabels]}
                  </span>
                </div>
                <ChevronDown size={18} className={cn("text-slate-400 transition-transform", isOpen && "rotate-180")} />
              </button>

              {isOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setOpenPart(null)} 
                  />
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1">
                      {carPartDamageStatuses.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusChange(part, status)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-50",
                            currentStatus === status ? "text-indigo-600 bg-indigo-50/50" : "text-slate-700"
                          )}
                        >
                          {carPartDamageStatusLabels[status]}
                          {currentStatus === status && <Check size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">
          <div className="size-2 rounded-full bg-emerald-500" /> Orijinal
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">
          <div className="size-2 rounded-full bg-amber-500" /> Boyalı
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">
          <div className="size-2 rounded-full bg-orange-500" /> Lokal Boyalı
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">
          <div className="size-2 rounded-full bg-red-500" /> Değişen
        </div>
      </div>
    </div>
  );
}

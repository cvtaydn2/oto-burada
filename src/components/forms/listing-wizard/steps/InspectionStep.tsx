"use client";

import { UseFormReturn, Controller } from "react-hook-form";
import { ShieldCheck } from "lucide-react";
import { ListingCreateFormValues } from "@/types";
import { DamageSelector } from "../../damage-selector";
import { ExpertInspectionEditor } from "../../expert-inspection-editor";

interface InspectionStepProps {
  form: UseFormReturn<ListingCreateFormValues, unknown, ListingCreateFormValues>;
}

export function InspectionStep({ form }: InspectionStepProps) {
  const { control, register } = form;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-2xl shadow-gray-200/40 text-gray-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -z-0 pointer-events-none" />
        
        <div className="relative z-10 flex items-start gap-4 mb-10">
          <div className="size-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20 italic font-black text-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-blue-900">Ekspertiz ve Kondisyon</h3>
            <p className="text-sm text-gray-500 font-medium">Aracın kaporta, mekanik ve hasar dökümünü şeffaf bir şekilde belirtin.</p>
          </div>
        </div>

        <div className="grid gap-12 relative z-10">
          {/* Damage Selector */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-1">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Kaporta Durumu (Boya / Değişen)</h4>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg italic">Görsel Seçim</span>
             </div>
            <Controller
              control={control}
              name="damageStatusJson"
              render={({ field }) => (
                <DamageSelector
                  value={(field.value as Record<string, string>) || {}}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="h-px bg-gray-100 w-full" />

          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 italic ml-1">Tramer Kaydı (TL)</label>
              <div className="relative">
                 <input
                   type="number"
                   {...register("tramerAmount", { valueAsNumber: true })}
                   className="h-16 w-full rounded-2xl border-2 border-gray-100 bg-white px-6 text-2xl font-black text-gray-900 outline-none transition-all focus:border-blue-500 font-mono tracking-tighter"
                   placeholder="0"
                 />
                 <span className="absolute right-6 top-1/2 -translate-y-1/2 text-lg font-black text-gray-200 italic">₺</span>
              </div>
              <p className="text-[11px] text-gray-400 italic font-bold ml-1 uppercase tracking-widest">Hasar kaydı yoksa 0 (Sıfır) giriniz.</p>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-6">
               <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Detaylı Ekspertiz Raporu</h4>
               <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg tracking-widest italic ml-auto">OPSİYONEL</span>
            </div>
            <ExpertInspectionEditor
              form={form}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

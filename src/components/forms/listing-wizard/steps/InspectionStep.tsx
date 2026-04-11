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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm sm:p-6 text-slate-900">
        <div className="flex items-start gap-4 mb-6">
          <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Ekspertiz Bilgileri</h3>
            <p className="text-sm text-muted-foreground">Aracın kaporta ve mekanik durumunu belirtin.</p>
          </div>
        </div>

        <div className="grid gap-8">
          {/* Damage Selector */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Kaporta Durumu (Boya / Değişen)</h4>
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

          <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Tramer Kaydı (TL)</label>
              <input
                type="number"
                {...register("tramerAmount", { valueAsNumber: true })}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
                placeholder="0"
              />
              <p className="text-[11px] text-muted-foreground ml-1 font-medium">Hasar kaydı yoksa 0 giriniz.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-tight mb-4">Detaylı Ekspertiz Raporu (Opsiyonel)</h4>
            <ExpertInspectionEditor
              form={form}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

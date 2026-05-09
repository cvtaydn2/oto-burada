"use client";

import { Info } from "lucide-react";
import { Controller, UseFormReturn } from "react-hook-form";

import { DesignInput } from "@/components/shared/design-system/DesignInput";
import { FormSection } from "@/components/shared/design-system/FormSection";
import { ListingCreateFormValues } from "@/types";

import { DamageSelector } from "../../damage-selector";
import { ExpertInspectionEditor } from "../../expert-inspection-editor";

interface InspectionStepProps {
  form: UseFormReturn<ListingCreateFormValues, unknown, ListingCreateFormValues>;
  isDisabled?: boolean;
}

export function InspectionStep({ form, isDisabled = false }: InspectionStepProps) {
  const {
    control,
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-10">
      {/* OPTIONAL STEP INDICATOR */}
      <div className="rounded-3xl bg-blue-50/50 border border-blue-100 p-6 sm:p-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-sm shadow-blue-500/30 flex-shrink-0">
            <Info size={24} strokeWidth={3} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-900 tracking-tight">Bu Adım İsteğe Bağlı</h3>
            <p className="text-sm text-blue-700/80 font-medium leading-relaxed mt-1">
              Ekspertiz ve hasar bilgilerini eklemek ilanınızın güvenilirliğini artırır, ancak
              zorunlu değildir. Temel bilgilerle de ilan verebilirsiniz.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: DAMAGE STATUS */}
      <FormSection number={1} title="Kaporta ve Hasar Durumu (İsteğe Bağlı)">
        <p className="text-sm text-gray-500 mb-8">
          Aracın kaporta durumunu (boya/değişen) görsel üzerinden işaretleyin ve varsa Tramer
          kaydını belirtin.
        </p>

        <div className="mb-10">
          <Controller
            control={control}
            name="damageStatusJson"
            render={({ field }) => (
              <DamageSelector
                value={(field.value as Record<string, string>) || {}}
                onChange={field.onChange}
                isDisabled={isDisabled}
              />
            )}
          />
        </div>

        <div className="max-w-xs">
          <DesignInput
            label="Tramer Kaydı (TL) - İsteğe Bağlı"
            type="number"
            {...register("tramerAmount", { valueAsNumber: true })}
            disabled={isDisabled}
            placeholder="0"
            error={errors.tramerAmount?.message as string}
            helperText="Hasar kaydı yoksa 0 (Sıfır) giriniz veya boş bırakınız."
          />
        </div>
      </FormSection>

      {/* SECTION 2: EXPERT INSPECTION */}
      <FormSection number={2} title="Detaylı Ekspertiz Raporu (İsteğe Bağlı)">
        <p className="text-sm text-gray-500 mb-8">
          Aracınızın mekanik ve teknik kondisyonu hakkında detaylı bilgi vererek alıcılara daha
          fazla güven aşılayın.
        </p>

        <ExpertInspectionEditor form={form} isDisabled={isDisabled} />
      </FormSection>
    </div>
  );
}

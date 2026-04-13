"use client";

import { UseFormReturn, Controller } from "react-hook-form";
import { ListingCreateFormValues } from "@/types";
import { DamageSelector } from "../../damage-selector";
import { ExpertInspectionEditor } from "../../expert-inspection-editor";
import { FormSection } from "@/components/shared/design-system/FormSection";
import { DesignInput } from "@/components/shared/design-system/DesignInput";

interface InspectionStepProps {
  form: UseFormReturn<ListingCreateFormValues, unknown, ListingCreateFormValues>;
}

export function InspectionStep({ form }: InspectionStepProps) {
  const { control, register, formState: { errors } } = form;

  return (
    <div className="space-y-10">
      {/* SECTION 1: DAMAGE STATUS */}
      <FormSection number={1} title="Kaporta ve Hasar Durumu">
        <p className="text-sm text-gray-500 mb-8">
          Aracın kaporta durumunu (boya/değişen) görsel üzerinden işaretleyin ve varsa Tramer kaydını belirtin.
        </p>
        
        <div className="mb-10">
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

        <div className="max-w-xs">
          <DesignInput
            label="Tramer Kaydı (TL)"
            type="number"
            {...register("tramerAmount", { valueAsNumber: true })}
            placeholder="0"
            error={errors.tramerAmount?.message as string}
            helperText="Hasar kaydı yoksa 0 (Sıfır) giriniz."
          />
        </div>
      </FormSection>

      {/* SECTION 2: EXPERT INSPECTION */}
      <FormSection number={2} title="Detaylı Ekspertiz Raporu">
        <p className="text-sm text-gray-500 mb-8">
          Aracınızın mekanik ve teknik kondisyonu hakkında detaylı bilgi vererek alıcılara daha fazla güven aşılayın.
        </p>
        
        <ExpertInspectionEditor
          form={form}
        />
      </FormSection>
    </div>
  );
}

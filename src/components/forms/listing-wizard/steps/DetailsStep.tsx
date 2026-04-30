"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { DesignInput } from "@/components/shared/design-system/DesignInput";
import { FormSection } from "@/components/shared/design-system/FormSection";
import { Button } from "@/components/ui/button";
import { generateDescriptionAction } from "@/services/ai/ai-actions";
import { CityOption, ListingCreateFormValues } from "@/types";

interface DetailsStepProps {
  form: UseFormReturn<ListingCreateFormValues, unknown, ListingCreateFormValues>;
  cities: CityOption[];
  isPartialDisabled?: boolean;
}

export function DetailsStep({ form, cities, isPartialDisabled = false }: DetailsStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const selectedCity = watch("city");
  const districtOptions = cities.find((c) => c.city === selectedCity)?.districts || [];

  const handleGenerateDescription = async () => {
    const values = watch();

    // Basic validation
    if (!values.brand || !values.model || !values.year) {
      toast.error(
        "Açıklama oluşturmak için önce araç bilgilerini (Marka, Model, Yıl) doldurmalısınız."
      );
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateDescriptionAction({
        brand: values.brand,
        model: values.model,
        year: values.year,
        mileage: values.mileage,
        fuelType: values.fuelType,
        transmission: values.transmission,
      });

      if (result.success && result.data) {
        setValue("description", result.data, { shouldValidate: true });
        toast.success("Yapay zeka açıklamayı oluşturdu!");
      } else {
        toast.error(result.error || "Açıklama oluşturulamadı.");
      }
    } catch {
      toast.error("Beklenmedik bir hata oluştu.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* SECTION 1: LOCATION */}
      <FormSection number={1} title="Konum Bilgileri">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DesignInput
            label="Şehir"
            required
            as="select"
            {...register("city")}
            disabled={isPartialDisabled}
            error={errors.city?.message as string}
          >
            <option value="">Seçiniz</option>
            {cities.map((c) => (
              <option key={c.city} value={c.city}>
                {c.city}
              </option>
            ))}
          </DesignInput>

          <DesignInput
            label="İlçe"
            required
            as="select"
            {...register("district")}
            disabled={!selectedCity || isPartialDisabled}
            error={errors.district?.message as string}
          >
            <option value="">Seçiniz</option>
            {districtOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </DesignInput>
        </div>
      </FormSection>

      {/* SECTION 2: AD DETAILS */}
      <FormSection number={2} title="İlan Detayları">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <DesignInput
            label="İlan Başlığı"
            required
            {...register("title")}
            disabled={isPartialDisabled}
            maxLength={200}
            showCounter
            currentLength={watch("title")?.length ?? 0}
            placeholder="Örn: Hatasız, Boyasız 2021 BMW 320i M Sport"
            error={errors.title?.message as string}
            helperText="Etkileyici bir başlık, alıcıların dikkatini daha hızlı çeker."
          />
          <DesignInput
            label="Fiyat (TL)"
            required
            type="number"
            {...register("price", { valueAsNumber: true })}
            placeholder="0.00"
            error={errors.price?.message as string}
          />
        </div>

        <DesignInput
          label="Açıklama"
          required
          as="textarea"
          rows={8}
          {...register("description")}
          maxLength={5000}
          showCounter
          currentLength={watch("description")?.length ?? 0}
          placeholder="Aracınızın durumu, bakımları ve öne çıkan özelliklerini burada detaylandırın..."
          error={errors.description?.message as string}
          className="resize-none"
          labelExtra={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateDescription}
              disabled={isGenerating}
              className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Sparkles className="size-3 text-amber-500" />
                  AI ile Yaz
                </>
              )}
            </Button>
          }
        />
        <p className="mt-2 text-[11px] text-slate-500 italic">
          💡 <b>İpucu:</b> AI butonunu kullanarak aracınızın özelliklerine göre profesyonel bir
          açıklama taslağı oluşturabilirsiniz.
        </p>

        <DesignInput
          label="WhatsApp İletişim Numarası"
          required
          {...register("whatsappPhone")}
          placeholder="5XX XXX XX XX"
          error={errors.whatsappPhone?.message as string}
          helperText="Alıcılar sizinle WhatsApp üzerinden iletişime geçecektir."
        />
      </FormSection>
    </div>
  );
}

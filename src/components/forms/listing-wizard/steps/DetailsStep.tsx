"use client";

import { UseFormReturn } from "react-hook-form";
import { CityOption, ListingCreateFormValues } from "@/types";
import { FormSection } from "@/components/shared/design-system/FormSection";
import { DesignInput } from "@/components/shared/design-system/DesignInput";

interface DetailsStepProps {
  form: UseFormReturn<ListingCreateFormValues, unknown, ListingCreateFormValues>;
  cities: CityOption[];
}

export function DetailsStep({ form, cities }: DetailsStepProps) {
  const { register, watch, formState: { errors } } = form;
  const selectedCity = watch("city");
  const districtOptions = cities.find(c => c.city === selectedCity)?.districts || [];

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
            error={errors.city?.message as string}
          >
            <option value="">Seçiniz</option>
            {cities.map((c) => (
              <option key={c.city} value={c.city}>{c.city}</option>
            ))}
          </DesignInput>

          <DesignInput
            label="İlçe"
            required
            as="select"
            {...register("district")}
            disabled={!selectedCity}
            error={errors.district?.message as string}
          >
            <option value="">Seçiniz</option>
            {districtOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
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

        <div className="mb-6">
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
          />
        </div>

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

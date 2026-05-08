"use client";

import { LoaderCircle, Search } from "lucide-react";
import { Controller, UseFormReturn } from "react-hook-form";

import { ChoiceGroup } from "@/features/shared/components/design-system/ChoiceGroup";
import { DesignInput } from "@/features/shared/components/design-system/DesignInput";
import { FormSection } from "@/features/shared/components/design-system/FormSection";
import { Button } from "@/features/ui/components/button";
import { maximumCarYear, minimumCarYear } from "@/lib/domain";
import { vehicleCategories, vehicleCategoryLabels } from "@/lib/vehicle-categories";
import { BrandCatalogItem, ListingCreateFormValues } from "@/types";

interface VehicleInfoStepProps {
  form: UseFormReturn<ListingCreateFormValues, unknown, ListingCreateFormValues>;
  brands: BrandCatalogItem[];
  isPlateLoading: boolean;
  onPlateLookup: () => void;
  isDisabled?: boolean;
}

export function VehicleInfoStep({
  form,
  brands,
  isPlateLoading,
  onPlateLookup,
  isDisabled = false,
}: VehicleInfoStepProps) {
  const {
    register,
    formState: { errors },
    watch,
    control,
  } = form;
  const selectedBrand = watch("brand");
  const selectedModel = watch("model");
  const selectedCategory = watch("category");
  const selectedTransmission = watch("transmission");
  const selectedFuelType = watch("fuelType");

  return (
    <div className="space-y-10">
      {/* SECTION 1: AUTO LOOKUP */}
      <FormSection number={1} title="Hızlı Araç Tanımlama">
        <p className="text-sm text-gray-500 mb-6">
          Plakadan sadece tahmini araç bilgisi önerisi alabilirsiniz. Bu alan resmi kayıt
          doğrulaması yapmaz; son kontrolü siz yapmalısınız.
        </p>

        <div className="grid gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <DesignInput
                  label="Plakadan Öneri Al"
                  leftAddon={<span className="text-[10px] font-bold text-primary">TR</span>}
                  {...register("licensePlate")}
                  placeholder="34 ABC 123"
                  disabled={isDisabled}
                  error={errors.licensePlate?.message as string}
                  className="uppercase tracking-wide font-bold"
                />
              </div>
              <Button
                type="button"
                onClick={onPlateLookup}
                disabled={isPlateLoading || isDisabled}
                className="inline-flex h-[46px] mb-[1.5px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-50"
              >
                {isPlateLoading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Search size={16} strokeWidth={3} />
                )}
                Öneri Getir
              </Button>
            </div>
          </div>

          <DesignInput
            label="Şasi Numarası (VIN)"
            {...register("vin")}
            placeholder="17 haneli şasi numarasını giriniz..."
            disabled={isDisabled}
            error={errors.vin?.message as string}
            helperText="Güvenlik doğrulaması için zorunludur."
            className="uppercase tracking-wide font-mono"
          />
        </div>
      </FormSection>

      {/* SECTION 2: BASIC INFO */}
      <FormSection number={2} title="Araç Temel Bilgileri">
        <div className="mb-8">
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <ChoiceGroup
                label="Vasıta Türü"
                required
                options={[...vehicleCategories]}
                value={field.value ?? selectedCategory}
                labels={vehicleCategoryLabels}
                onChange={field.onChange}
                disabled={isDisabled}
                error={errors.category?.message as string}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <DesignInput
            label="Marka"
            required
            as="select"
            {...register("brand")}
            disabled={isDisabled}
            error={errors.brand?.message as string}
          >
            <option value="">Seçiniz</option>
            {brands.map((b) => (
              <option key={b.brand} value={b.brand}>
                {b.brand}
              </option>
            ))}
          </DesignInput>

          <DesignInput
            label="Model"
            required
            as="select"
            {...register("model")}
            disabled={!selectedBrand || isDisabled}
            error={errors.model?.message as string}
          >
            <option value="">Seçiniz</option>
            {(brands.find((b) => b.brand === selectedBrand)?.models || []).map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </DesignInput>
        </div>

        {/* Paket / Trim — sadece seçili modelin trim'leri varsa göster */}
        {selectedBrand &&
          selectedModel &&
          (brands
            .find((b) => b.brand === selectedBrand)
            ?.models.find((m) => m.name === selectedModel)?.trims?.length ?? 0) > 0 && (
            <div className="mb-6">
              <DesignInput
                label="Paket / Donanım"
                as="select"
                {...register("carTrim")}
                disabled={isDisabled}
                error={errors.carTrim?.message as string}
              >
                <option value="">Seçiniz (Opsiyonel)</option>
                {(
                  brands
                    .find((b) => b.brand === selectedBrand)
                    ?.models.find((m) => m.name === selectedModel)?.trims || []
                ).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </DesignInput>
            </div>
          )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <DesignInput
            label="Model Yılı"
            required
            type="number"
            {...register("year", { valueAsNumber: true })}
            disabled={isDisabled}
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              if (target.value.length > 4) {
                target.value = target.value.slice(0, 4);
              }
            }}
            min={minimumCarYear}
            max={maximumCarYear}
            error={errors.year?.message as string}
          />
          <DesignInput
            label="Kilometre"
            required
            type="number"
            {...register("mileage", { valueAsNumber: true })}
            disabled={isDisabled}
            error={errors.mileage?.message as string}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Controller
            control={control}
            name="fuelType"
            render={({ field }) => (
              <ChoiceGroup
                label="Yakıt Tipi"
                required
                options={["benzin", "dizel", "lpg", "hibrit", "elektrik"]}
                value={field.value ?? selectedFuelType}
                onChange={field.onChange}
                disabled={isDisabled}
                error={errors.fuelType?.message as string}
              />
            )}
          />

          <Controller
            control={control}
            name="transmission"
            render={({ field }) => (
              <ChoiceGroup
                label="Vites Tipi"
                required
                options={["manuel", "yari_otomatik", "otomatik"]}
                value={field.value ?? selectedTransmission}
                labels={{
                  manuel: "Manuel",
                  otomatik: "Otomatik",
                  yari_otomatik: "Yarı Otomatik",
                }}
                onChange={field.onChange}
                disabled={isDisabled}
                error={errors.transmission?.message as string}
              />
            )}
          />
        </div>
      </FormSection>
    </div>
  );
}

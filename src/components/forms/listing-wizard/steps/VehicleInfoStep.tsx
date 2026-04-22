"use client";

import { AlertCircle, LoaderCircle, Search } from "lucide-react";
import { Controller, UseFormReturn } from "react-hook-form";

import { ChoiceGroup } from "@/components/shared/design-system/ChoiceGroup";
import { DesignInput } from "@/components/shared/design-system/DesignInput";
import { FormSection } from "@/components/shared/design-system/FormSection";
import { maximumCarYear, minimumCarYear } from "@/lib/constants/domain";
import { BrandCatalogItem, ListingCreateFormValues } from "@/types";

interface VehicleInfoStepProps {
  form: UseFormReturn<ListingCreateFormValues, unknown, ListingCreateFormValues>;
  brands: BrandCatalogItem[];
  isPlateLoading: boolean;
  onPlateLookup: () => void;
}

export function VehicleInfoStep({
  form,
  brands,
  isPlateLoading,
  onPlateLookup,
}: VehicleInfoStepProps) {
  const {
    register,
    formState: { errors },
    watch,
    control,
  } = form;
  const selectedBrand = watch("brand");
  const selectedModel = watch("model");
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
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700">Plakadan Öneri Al</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 w-10 flex items-center justify-center border-r border-border bg-muted/30 rounded-l-lg">
                  <span className="text-[10px] font-bold text-primary">TR</span>
                </div>
                <input
                  {...register("licensePlate")}
                  placeholder="34 ABC 123"
                  className="h-12 w-full border border-border rounded-lg pl-14 pr-4 text-sm font-semibold placeholder-muted-foreground/30 outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                />
              </div>
              <button
                type="button"
                onClick={onPlateLookup}
                disabled={isPlateLoading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
              >
                {isPlateLoading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Search size={18} />
                )}
                Öneri Getir
              </button>
            </div>
            {errors.licensePlate && (
              <p className="text-xs font-bold text-red-500 flex items-center gap-2">
                <AlertCircle size={14} /> {errors.licensePlate?.message as string}
              </p>
            )}
          </div>

          <DesignInput
            label="Şasi Numarası (VIN)"
            {...register("vin")}
            placeholder="17 haneli şasi numarasını giriniz..."
            error={errors.vin?.message as string}
            helperText="Güvenlik doğrulaması için zorunludur."
            className="uppercase tracking-wide font-mono"
          />
        </div>
      </FormSection>

      {/* SECTION 2: BASIC INFO */}
      <FormSection number={2} title="Araç Temel Bilgileri">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <DesignInput
            label="Marka"
            required
            as="select"
            {...register("brand")}
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
            disabled={!selectedBrand}
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
            error={errors.mileage?.message as string}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Yakıt Tipi <span className="text-destructive">*</span>
            </label>
            <Controller
              control={control}
              name="fuelType"
              render={({ field }) => (
                <ChoiceGroup
                  options={["benzin", "dizel", "lpg", "hibrit", "elektrik"]}
                  value={field.value ?? selectedFuelType}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Vites Tipi <span className="text-destructive">*</span>
            </label>
            <Controller
              control={control}
              name="transmission"
              render={({ field }) => (
                <ChoiceGroup
                  options={["manuel", "yari_otomatik", "otomatik"]}
                  value={field.value ?? selectedTransmission}
                  labels={{
                    manuel: "Manuel",
                    otomatik: "Otomatik",
                    yari_otomatik: "Yarı Otomatik",
                  }}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      </FormSection>
    </div>
  );
}

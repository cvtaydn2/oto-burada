"use client";

import { UseFormReturn, Controller } from "react-hook-form";
import { Search, LoaderCircle, AlertCircle } from "lucide-react";
import { ListingCreateFormValues, BrandCatalogItem } from "@/types";
import { maximumCarYear, minimumCarYear } from "@/lib/constants/domain";
import { FormSection } from "@/components/shared/design-system/FormSection";
import { DesignInput } from "@/components/shared/design-system/DesignInput";
import { ChoiceGroup } from "@/components/shared/design-system/ChoiceGroup";

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
  onPlateLookup 
}: VehicleInfoStepProps) {
  const { register, formState: { errors }, watch, control } = form;
  const selectedBrand = watch("brand");
  const selectedModel = watch("model");
  const selectedTransmission = watch("transmission");
  const selectedFuelType = watch("fuelType");

  return (
    <div className="space-y-10">
      {/* SECTION 1: AUTO LOOKUP */}
      <FormSection number={1} title="Hızlı Araç Tanımlama">
        <p className="text-sm text-gray-500 mb-6">
          Aracınızı plakadan ön doldurabilir, şasi numarasını ise format kontrolü için ekleyebilirsiniz.
        </p>
        
        <div className="grid gap-8">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700">Plaka ile Sorgula</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 w-10 flex items-center justify-center border-r border-gray-100 bg-gray-50 rounded-l-lg">
                   <span className="text-[10px] font-black text-blue-800">TR</span>
                </div>
                <input
                  {...register("licensePlate")}
                  placeholder="34 ABC 123"
                  className="h-12 w-full border border-gray-200 rounded-lg pl-14 pr-4 text-sm font-bold placeholder-gray-300 outline-none focus:border-blue-500 transition-all uppercase"
                />
              </div>
              <button
                type="button"
                onClick={onPlateLookup}
                disabled={isPlateLoading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 text-sm font-bold text-white transition-all hover:bg-blue-600 disabled:opacity-50"
              >
                {isPlateLoading ? <LoaderCircle className="size-4 animate-spin" /> : <Search size={18} />}
                Sorgula
              </button>
            </div>
            {errors.licensePlate && (
              <p className="text-xs font-bold text-red-500 flex items-center gap-2">
                <AlertCircle size={14} /> {(errors.licensePlate?.message as string)}
              </p>
            )}
          </div>

          <DesignInput
            label="Şasi Numarası (VIN)"
            {...register("vin")}
            placeholder="17 haneli şasi numarasını giriniz..."
            error={errors.vin?.message as string}
            helperText="Güvenlik doğrulaması için zorunludur."
            className="uppercase tracking-widest font-mono"
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
              <option key={b.brand} value={b.brand}>{b.brand}</option>
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
            {(brands.find(b => b.brand === selectedBrand)?.models || []).map(m => (
              <option key={m.name} value={m.name}>{m.name}</option>
            ))}
          </DesignInput>
        </div>

        {/* Paket / Trim — sadece seçili modelin trim'leri varsa göster */}
        {selectedBrand && selectedModel && (brands.find(b => b.brand === selectedBrand)?.models.find(m => m.name === selectedModel)?.trims?.length ?? 0) > 0 && (
          <div className="mb-6">
            <DesignInput
              label="Paket / Donanım"
              as="select"
              {...register("carTrim")}
              error={errors.carTrim?.message as string}
            >
              <option value="">Seçiniz (Opsiyonel)</option>
              {(brands.find(b => b.brand === selectedBrand)?.models.find(m => m.name === selectedModel)?.trims || []).map(t => (
                <option key={t} value={t}>{t}</option>
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
            min={minimumCarYear}
            max={maximumCarYear + 1}
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
            <label className="block text-sm font-bold text-gray-700">Yakıt Tipi <span className="text-red-500">*</span></label>
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
            <label className="block text-sm font-bold text-gray-700">Vites Tipi <span className="text-red-500">*</span></label>
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

"use client";

import { UseFormReturn } from "react-hook-form";
import { CarFront, Search, LoaderCircle, AlertCircle } from "lucide-react";
import { ListingCreateFormValues, BrandCatalogItem } from "@/types";
import { maximumCarYear, minimumCarYear } from "@/lib/constants/domain";

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
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm sm:p-6 text-slate-900">
        <div className="flex items-start gap-4 mb-6">
          <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <CarFront size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Araç Bilgileri</h3>
            <p className="text-sm text-muted-foreground">Plakadan sorgulayabilir veya manuel doldurabilirsiniz.</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Plate Lookup */}
          <div className="space-y-2">
            <label htmlFor="licensePlate" className="text-sm font-semibold ml-1">Plaka</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  {...register("licensePlate")}
                  id="licensePlate"
                  placeholder="34 ABC 123"
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary uppercase"
                />
              </div>
              <button
                type="button"
                onClick={onPlateLookup}
                disabled={isPlateLoading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
              >
                {isPlateLoading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Search size={18} />
                )}
                <span className="hidden sm:inline">Sorgula</span>
              </button>
            </div>
            {errors.licensePlate && (
              <p className="text-xs font-medium text-red-500 flex items-center gap-1.5 ml-1">
                <AlertCircle size={12} /> {(errors.licensePlate?.message as string)}
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="brand" className="text-sm font-semibold ml-1">Marka</label>
              <select
                {...register("brand")}
                id="brand"
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Seçiniz</option>
                {brands.map((b) => (
                  <option key={b.brand} value={b.brand}>{b.brand}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="model" className="text-sm font-semibold ml-1">Model</label>
              <select
                {...register("model")}
                id="model"
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Seçiniz</option>
                {(brands.find(b => b.brand === form.watch("brand"))?.models || []).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="year" className="text-sm font-semibold ml-1">Yıl</label>
              <input
                type="number"
                {...register("year", { valueAsNumber: true })}
                id="year"
                min={minimumCarYear}
                max={maximumCarYear + 1}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="mileage" className="text-sm font-semibold ml-1">Kilometre</label>
              <input
                type="number"
                {...register("mileage", { valueAsNumber: true })}
                id="mileage"
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

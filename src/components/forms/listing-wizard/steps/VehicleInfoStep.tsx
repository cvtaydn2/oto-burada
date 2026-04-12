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
  const { register, formState: { errors }, watch } = form;
  const selectedBrand = watch("brand");
  const selectedModel = watch("model");
  const vinValue = watch("vin") || "";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40 text-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -z-0 pointer-events-none" />
        
        <div className="relative z-10 flex items-start gap-4 mb-10">
          <div className="size-14 rounded-2xl bg-slate-950 flex items-center justify-center text-white shrink-0 shadow-lg shadow-slate-900/20 italic font-black text-xl">
            <CarFront size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Araç Tanımlama</h3>
            <p className="text-sm text-slate-500 font-medium">Aracınızı plakadan otomatik tanıyabilir veya teknik verileri manuel girebilirsiniz.</p>
          </div>
        </div>

        <div className="grid gap-10 relative z-10">
          {/* Plate Lookup - Magical UI */}
          <div className="space-y-3">
            <label htmlFor="licensePlate" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Plaka ile Başla</label>
            <div className="flex gap-3">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center border-r border-slate-100 bg-slate-50 rounded-l-2xl">
                   <span className="text-[10px] font-black text-blue-800">TR</span>
                </div>
                <input
                  {...register("licensePlate")}
                  id="licensePlate"
                  placeholder="34 ABC 123"
                  className="h-16 w-full rounded-2xl border-2 border-slate-100 bg-white pl-16 pr-4 text-xl font-black text-slate-900 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 uppercase tracking-tighter placeholder:text-slate-200"
                />
              </div>
              <button
                type="button"
                onClick={onPlateLookup}
                disabled={isPlateLoading}
                className="inline-flex h-16 items-center justify-center gap-3 rounded-2xl bg-slate-950 px-10 text-sm font-black text-white transition-all hover:bg-black disabled:opacity-50 shadow-xl shadow-slate-900/20 group uppercase tracking-widest italic"
              >
                {isPlateLoading ? (
                  <LoaderCircle className="size-5 animate-spin" />
                ) : (
                  <Search size={20} className="group-hover:scale-110 transition-transform" />
                )}
                Sorgula
              </button>
            </div>
            {errors.licensePlate && (
              <p className="text-xs font-bold text-rose-500 flex items-center gap-2 ml-1 animate-in shake duration-300">
                <AlertCircle size={14} /> {(errors.licensePlate?.message as string)}
              </p>
            )}
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* VIN (Chassis Number) - Precise UI */}
          <div className="space-y-3">
            <label htmlFor="vin" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Şasi Numarası (VIN)</label>
            <div className="relative">
               <input
                 {...register("vin")}
                 id="vin"
                 autoComplete="off"
                 placeholder="SC7G..."
                 className={cn(
                    "h-16 w-full rounded-2xl border-2 px-6 text-lg font-black outline-none transition-all uppercase tracking-[0.2em] font-mono",
                    errors.vin ? "border-rose-200 bg-rose-50 text-rose-900" : "border-slate-100 bg-white text-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/5"
                 )}
               />
               <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {vinValue.length > 0 && (
                    <span className={cn(
                      "text-[10px] font-black px-2 py-1 rounded-lg italic tracking-widest",
                      vinValue.length === 17 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                      {vinValue.length}/17
                    </span>
                  )}
               </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium italic px-1">
              Güvenlik standardı gereği 17 haneli şasi numarası doğrulaması zorunludur.
            </p>
            {errors.vin && (
              <p className="text-xs font-bold text-rose-500 flex items-center gap-2 ml-1 animate-in slide-in-from-left-2">
                <AlertCircle size={14} /> {(errors.vin?.message as string)}
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label htmlFor="brand" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Marka</label>
              <select
                {...register("brand")}
                id="brand"
                className="h-14 w-full rounded-xl border-2 border-slate-100 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary italic"
              >
                <option value="">Seçiniz</option>
                {brands.map((b) => (
                  <option key={b.brand} value={b.brand}>{b.brand}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="model" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Model</label>
              <select
                {...register("model")}
                id="model"
                disabled={!selectedBrand}
                className="h-14 w-full rounded-xl border-2 border-slate-100 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary italic disabled:opacity-50"
              >
                <option value="">Seçiniz</option>
                {(brands.find(b => b.brand === selectedBrand)?.models || []).map(m => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="carTrim" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Donanım Paketi</label>
              <select
                {...register("carTrim")}
                id="carTrim"
                disabled={!selectedModel}
                className="h-14 w-full rounded-xl border-2 border-slate-100 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary italic disabled:opacity-50"
              >
                <option value="">Seçiniz (Opsiyonel)</option>
                {(brands.find(b => b.brand === selectedBrand)?.models?.find(m => m.name === selectedModel)?.trims || []).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 pb-4">
            <div className="space-y-2">
              <label htmlFor="year" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Model Yılı</label>
              <input
                type="number"
                {...register("year", { valueAsNumber: true })}
                id="year"
                min={minimumCarYear}
                max={maximumCarYear + 1}
                className="h-14 w-full rounded-xl border-2 border-slate-100 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary font-mono"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="mileage" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Kilometre</label>
              <div className="relative">
                 <input
                   type="number"
                   {...register("mileage", { valueAsNumber: true })}
                   id="mileage"
                   className="h-14 w-full rounded-xl border-2 border-slate-100 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary font-mono"
                 />
                 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 italic">KM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

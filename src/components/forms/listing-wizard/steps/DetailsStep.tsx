"use client";

import { UseFormReturn } from "react-hook-form";
import { MapPin, FileText } from "lucide-react";
import { CityOption, ListingCreateFormValues } from "@/types";
import { fuelTypes, transmissionTypes } from "@/lib/constants/domain";

interface DetailsStepProps {
  form: UseFormReturn<ListingCreateFormValues, unknown, ListingCreateFormValues>;
  cities: CityOption[];
}

export function DetailsStep({ form, cities }: DetailsStepProps) {
  const { register, watch } = form;
  const selectedCity = watch("city");
  const districtOptions = cities.find(c => c.city === selectedCity)?.districts || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Location & Specs Case */}
      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40 text-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-0 pointer-events-none" />
        
        <div className="relative z-10 flex items-start gap-4 mb-10">
          <div className="size-14 rounded-2xl bg-slate-950 flex items-center justify-center text-white shrink-0 shadow-lg shadow-slate-900/20 italic font-black text-xl">
            <MapPin size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Konum ve Teknik</h3>
            <p className="text-sm text-slate-500 font-medium">Aracın bulunduğu yeri ve temel sürüş özelliklerini belirtin.</p>
          </div>
        </div>

        <div className="grid gap-8 relative z-10">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="city" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Şehir</label>
              <select
                {...register("city")}
                id="city"
                className="h-14 w-full rounded-xl border-2 border-slate-100 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary italic"
              >
                <option value="">Seçiniz</option>
                {cities.map((c) => (
                  <option key={c.city} value={c.city}>{c.city}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="district" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">İlçe</label>
              <select
                {...register("district")}
                id="district"
                disabled={!selectedCity}
                className="h-14 w-full rounded-xl border-2 border-slate-100 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary italic disabled:opacity-50"
              >
                <option value="">Seçiniz</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="fuelType" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Yakıt Tipi</label>
              <select
                {...register("fuelType")}
                id="fuelType"
                className="h-14 w-full rounded-xl border-2 border-slate-100 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary italic"
              >
                {fuelTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="transmission" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Vites Tipi</label>
              <select
                {...register("transmission")}
                id="transmission"
                className="h-14 w-full rounded-xl border-2 border-slate-100 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary italic"
              >
                {transmissionTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Price Case */}
      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40 text-slate-900 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -z-0 pointer-events-none" />
        
        <div className="relative z-10 flex items-start gap-4 mb-10">
          <div className="size-14 rounded-2xl bg-slate-950 flex items-center justify-center text-white shrink-0 shadow-lg shadow-slate-900/20 italic font-black text-xl">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">İçerik ve Fiyat</h3>
            <p className="text-sm text-slate-500 font-medium">Alıcıların ilgisini çekecek net bir başlık ve dürüst bir açıklama girin.</p>
          </div>
        </div>

        <div className="grid gap-8 relative z-10">
          <div className="space-y-3">
            <label htmlFor="title" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">İlan Başlığı</label>
            <input
              {...register("title")}
              id="title"
              placeholder="Örn: 2020 Volkswagen Golf Hatasız Boyasız"
              className="h-16 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-lg font-bold text-slate-900 outline-none transition-all focus:border-primary placeholder:text-slate-200 italic"
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="description" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Ayrıntılı Açıklama</label>
            <textarea
              {...register("description")}
              id="description"
              rows={6}
              placeholder="Aracınız hakkında samimi ve detaylı bir yazı yazın..."
              className="w-full rounded-2xl border-2 border-slate-100 bg-white p-6 text-base font-medium text-slate-700 outline-none transition-all focus:border-primary italic antialiased"
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="price" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-1">Satış Fiyatı (TL)</label>
            <div className="relative">
               <input
                 type="number"
                 {...register("price", { valueAsNumber: true })}
                 id="price"
                 className="h-20 w-full rounded-2xl border-2 border-slate-100 bg-white px-8 text-4xl font-black text-slate-900 outline-none transition-all focus:border-primary font-heading tracking-tighter"
               />
               <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-200 italic">₺</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic ml-1">
              * Piyasa analizine göre rekabetçi bir fiyat girmeniz önerilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

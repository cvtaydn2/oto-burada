"use client";

import { UseFormReturn } from "react-hook-form";
import { MapPin, FileText, Info } from "lucide-react";
import { CityOption, ListingCreateFormValues } from "@/types";
import { fuelTypes, transmissionTypes } from "@/lib/constants/domain";

interface DetailsStepProps {
  form: UseFormReturn<ListingCreateFormValues>;
  cities: CityOption[];
}

export function DetailsStep({ form, cities }: DetailsStepProps) {
  const { register, watch, formState: { errors } } = form;
  const selectedCity = watch("city");
  const districtOptions = cities.find(c => c.city === selectedCity)?.districts || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Location & Specs Case */}
      <div className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm sm:p-6 text-slate-900">
        <div className="flex items-start gap-4 mb-6">
          <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <MapPin size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Konum ve Teknik Detaylar</h3>
            <p className="text-sm text-muted-foreground">Aracın bulunduğu yeri ve temel özelliklerini belirtin.</p>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-semibold ml-1">Şehir</label>
              <select
                {...register("city")}
                id="city"
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Seçiniz</option>
                {cities.map((c) => (
                  <option key={c.city} value={c.city}>{c.city}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="district" className="text-sm font-semibold ml-1">İlçe</label>
              <select
                {...register("district")}
                id="district"
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Seçiniz</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="fuelType" className="text-sm font-semibold ml-1">Yakıt Tipi</label>
              <select
                {...register("fuelType")}
                id="fuelType"
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                {fuelTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="transmission" className="text-sm font-semibold ml-1">Vites Tipi</label>
              <select
                {...register("transmission")}
                id="transmission"
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
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
      <div className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm sm:p-6 text-slate-900">
        <div className="flex items-start gap-4 mb-6">
          <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <FileText size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold">İlan Detayları</h3>
            <p className="text-sm text-muted-foreground">Alıcıların ilgisini çekecek net bir başlık ve açıklama girin.</p>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-semibold ml-1">İlan Başlığı</label>
            <input
              {...register("title")}
              id="title"
              placeholder="Örn: 2020 Volkswagen Golf Hatasız Boyasız"
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-semibold ml-1">İçerik / Açıklama</label>
            <textarea
              {...register("description")}
              id="description"
              rows={5}
              placeholder="Aracınız hakkında detaylı bilgi verin..."
              className="w-full rounded-xl border border-input bg-background p-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-semibold ml-1">Fiyat (TL)</label>
            <input
              type="number"
              {...register("price", { valueAsNumber: true })}
              id="price"
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Loader2, TrendingDown, Target, AlertCircle, Sparkles } from "lucide-react";
import { BrandCatalogItem, CityOption } from "@/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { PriceEstimationResult } from "@/services/market/price-estimation";

const valuationSchema = z.object({
  brand: z.string().min(1, "Marka seçiniz"),
  model: z.string().min(1, "Model seçiniz"),
  year: z.number().min(1950).max(new Date().getFullYear()),
  mileage: z.number().min(0),
});

type ValuationValues = z.infer<typeof valuationSchema>;

interface ValuationFormProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
}

export function ValuationForm({ brands }: ValuationFormProps) {
  const [result, setResult] = useState<PriceEstimationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isValid },
  } = useForm<ValuationValues>({
    resolver: zodResolver(valuationSchema),
    defaultValues: {
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      mileage: 0,
    },
  });

  const selectedBrand = useWatch({ control, name: "brand" });
  const selectedModel = useWatch({ control, name: "model" });
  const modelOptions = brands.find(b => b.brand === selectedBrand)?.models || [];

  const onSubmit = async (data: ValuationValues) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({
        brand: data.brand,
        model: data.model,
        year: data.year.toString(),
        mileage: data.mileage.toString(),
      });

      const response = await fetch(`/api/market/estimate?${params}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message || "Bilgi getirilemedi.");
      }

      setResult(json.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
           <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} /> Hesaplama Tamamlandı
           </div>
           <h3 className="text-xl font-black italic uppercase tracking-tighter">
              Tahmini Piyasa Degeri
           </h3>
        </div>

        <div className="p-8 rounded-[2rem] bg-slate-900 text-white shadow-2xl space-y-6 relative overflow-hidden">
           {/* Glow Effect */}
           <div className="absolute top-0 right-0 size-64 bg-primary/20 blur-[100px] pointer-events-none" />
           
           <div className="grid md:grid-cols-3 gap-8 items-center relative z-10">
              <div className="text-center md:text-left">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Minimum</p>
                 <p className="text-2xl font-bold opacity-80">{formatCurrency(result.min)}</p>
              </div>
              <div className="text-center p-6 rounded-3xl bg-white/5 border border-white/10 shadow-inner">
                 <p className="text-sm font-black text-primary uppercase tracking-[0.2em] mb-2 italic">Ortalama</p>
                 <p className="text-4xl md:text-5xl font-black text-glow">{formatCurrency(result.avg)}</p>
              </div>
              <div className="text-center md:text-right">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Maximum</p>
                 <p className="text-2xl font-bold opacity-80">{formatCurrency(result.max)}</p>
              </div>
           </div>

           <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2">
                 <div className={`size-3 rounded-full ${result.confidence === 'high' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                 <span className="text-xs font-bold text-slate-300">Guven Araligi: {result.confidence === 'high' ? 'Yuksek' : 'Orta'}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase italic">
                 {result.listingCount} benzer ilan verisi kullanildi
              </p>
           </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
           <Button 
              variant="outline" 
              className="h-14 rounded-2xl border-2 font-bold italic"
              onClick={() => setResult(null)}
           >
              Tekrar Hesapla
           </Button>
           <Button 
              className="h-14 rounded-2xl font-bold italic shadow-lg shadow-primary/20"
              onClick={() => window.location.href = `/listings?brand=${encodeURIComponent(selectedBrand)}&model=${encodeURIComponent(selectedModel)}`}
           >
              Piyasayi Gor
           </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground italic ml-1">Marka</Label>
          <Select 
            onValueChange={(v) => {
              setValue("brand", v);
              setValue("model", "");
            }}
          >
            <SelectTrigger className="h-14 rounded-2xl border-border bg-slate-50/50 font-bold">
              <SelectValue placeholder="Marka Seç" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {brands.map((b) => (
                <SelectItem key={b.brand} value={b.brand} className="font-bold underline-offset-4">
                  {b.brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.brand && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.brand.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground italic ml-1">Model</Label>
          <Select 
            disabled={!selectedBrand}
            onValueChange={(v) => setValue("model", v)}
          >
            <SelectTrigger className="h-14 rounded-2xl border-border bg-slate-50/50 font-bold">
              <SelectValue placeholder={selectedBrand ? "Model Seç" : "Önce Marka Seç"} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {modelOptions.map((m) => (
                <SelectItem key={m} value={m} className="font-bold">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.model && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.model.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground italic ml-1">Model Yılı</Label>
          <Input 
            type="number" 
            placeholder="Örn: 2022" 
            className="h-14 rounded-2xl border-border bg-slate-50/50 font-bold"
            {...register("year")}
          />
          {errors.year && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.year.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground italic ml-1">Kilometre</Label>
          <Input 
            placeholder="Örn: 45.000" 
            className="h-14 rounded-2xl border-border bg-slate-50/50 font-bold"
            {...register("mileage")}
          />
          {errors.mileage && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.mileage.message}</p>}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-800 text-sm font-bold">
           <AlertCircle size={18} />
           {error}
        </div>
      )}

      <Button 
        type="submit" 
        disabled={loading}
        className="w-full h-16 rounded-[1.25rem] text-lg font-black italic uppercase tracking-tighter shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Piyasa Analiz Ediliyor...
          </>
        ) : (
          <>
            <Target className="mr-2 h-5 w-5" />
            Fiyatı Tahmin Et
          </>
        )}
      </Button>

      <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest mt-4">
         Hesaplama sonucu bağlayıcı değildir. Gerçek pazar verilerine dayalı bir tahmindir.
      </p>
    </form>
  );
}

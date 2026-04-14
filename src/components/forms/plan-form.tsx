"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PricingPlan, createPricingPlan, updatePricingPlan } from "@/services/admin/plans";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const planSchema = z.object({
  name: z.string().min(2, "Paket adı en az 2 karakter olmalıdır"),
  price: z.coerce.number().min(0, "Fiyat 0'dan küçük olamaz"),
  credits: z.coerce.number().min(1, "En az 1 kredi olmalıdır"),
  is_active: z.boolean(),
  features: z.object({
    featured_listings: z.boolean(),
    express_support: z.boolean(),
    advanced_analytics: z.boolean(),
    no_ads: z.boolean(),
    custom_badge: z.boolean(),
  }),
});

type PlanFormValues = z.infer<typeof planSchema>;

interface PlanFormProps {
  initialData?: PricingPlan | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PlanForm({ initialData, onSuccess, onCancel }: PlanFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(planSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      price: initialData.price,
      credits: initialData.credits,
      is_active: initialData.is_active,
      features: {
        featured_listings: !!initialData.features?.featured_listings,
        express_support: !!initialData.features?.express_support,
        advanced_analytics: !!initialData.features?.advanced_analytics,
        no_ads: !!initialData.features?.no_ads,
        custom_badge: !!initialData.features?.custom_badge,
      }
    } : {
      name: "",
      price: 0,
      credits: 5,
      is_active: true,
      features: {
        featured_listings: false,
        express_support: false,
        advanced_analytics: false,
        no_ads: false,
        custom_badge: false,
      }
    },
  });

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (initialData) {
        await updatePricingPlan(initialData.id, values);
        toast.success("Paket başarıyla güncellendi");
      } else {
        await createPricingPlan(values);
        toast.success("Yeni paket oluşturuldu");
      }
      onSuccess();
    } catch {
      toast.error("İşlem sırasında bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Paket Adı</Label>
            <Input {...form.register("name")} placeholder="Örn: Premium Plus" className="rounded-xl" />
            {form.formState.errors.name && <p className="text-[10px] font-bold text-rose-500">{form.formState.errors.name.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Fiyat (TL)</Label>
              <Input {...form.register("price")} type="number" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500">İlan Kredisi</Label>
              <Input {...form.register("credits")} type="number" className="rounded-xl" />
            </div>
          </div>

          <div className="pt-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 block">Paket Özellikleri</Label>
            <div className="grid grid-cols-2 gap-4">
               {[
                 { id: "featured_listings", label: "Öne Çıkan İlanlar" },
                 { id: "express_support", label: "Hızlı Destek" },
                 { id: "advanced_analytics", label: "Gelişmiş Analiz" },
                 { id: "no_ads", label: "Reklamsız Deneyim" },
                 { id: "custom_badge", label: "Özel Rozet" }
               ].map((feature) => {
                  type FeatureKey = keyof PlanFormValues["features"];
                  const fieldName = `features.${feature.id as FeatureKey}` as const;
                  return (
                    <div key={feature.id} className="flex items-center space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                       <Checkbox 
                         id={feature.id}
                         checked={form.watch(fieldName)}
                         onCheckedChange={(checked) => form.setValue(fieldName, !!checked)}
                       />
                       <label htmlFor={feature.id} className="text-xs font-bold text-slate-700 cursor-pointer">{feature.label}</label>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="flex items-center space-x-2 py-2">
            <Checkbox 
              id="is_active" 
              checked={form.watch("is_active")}
              onCheckedChange={(checked) => form.setValue("is_active", !!checked)}
            />
            <Label htmlFor="is_active" className="text-xs font-black uppercase tracking-widest text-slate-500">Bu paketi hemen yayına al</Label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-xl h-11 font-black text-[10px] tracking-widest uppercase border-slate-200"
          onClick={onCancel}
        >
          İptal
        </Button>
        <Button
          type="submit"
          className="flex-1 rounded-xl h-11 font-black text-[10px] tracking-widest uppercase bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin size-4" /> : initialData ? "GÜNCELLE" : "OLUŞTUR"}
        </Button>
      </div>
    </form>
  );
}

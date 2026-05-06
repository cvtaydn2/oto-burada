"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPricingPlan, PricingPlan, updatePricingPlan } from "@/services/admin/plans";

const planSchema = z.object({
  name: z.string().min(2, "Paket adı en az 2 karakter olmalıdır"),
  price: z.coerce.number().min(0, "Fiyat 0'dan küçük olamaz"),
  credits: z.coerce.number().min(1, "En az 1 kredi olmalıdır"),
  listing_quota: z.coerce.number().min(1, "En az 1 ilan hakkı olmalıdır"),
  is_active: z.boolean(),
  features: z.array(z.string()).default([]),
});

type PlanFormValues = z.infer<typeof planSchema>;
type PlanFormInput = z.input<typeof planSchema>;

const PLAN_FEATURE_OPTIONS = [
  { id: "featured_listings", label: "Öne Çıkan İlanlar" },
  { id: "express_support", label: "Hızlı Destek" },
  { id: "advanced_analytics", label: "Gelişmiş Analiz" },
  { id: "no_ads", label: "Reklamsız Deneyim" },
  { id: "custom_badge", label: "Özel Rozet" },
] as const;

const defaultPlanValues: PlanFormValues = {
  name: "",
  price: 0,
  credits: 5,
  listing_quota: 3,
  is_active: true,
  features: [],
};

function getPlanFormDefaults(initialData?: PricingPlan | null): PlanFormValues {
  if (!initialData) {
    return defaultPlanValues;
  }

  const enabledFeatures: string[] = [];
  const featureFlags = initialData.features as unknown as
    | Record<string, boolean | string>
    | string[];

  if (Array.isArray(featureFlags)) {
    enabledFeatures.push(...featureFlags.filter((f): f is string => typeof f === "string"));
  } else if (featureFlags && typeof featureFlags === "object") {
    for (const [key, val] of Object.entries(featureFlags)) {
      if (val === true || val === "true") {
        enabledFeatures.push(key);
      }
    }
  }

  return {
    name: initialData.name,
    price: initialData.price,
    credits: initialData.credits,
    listing_quota: initialData.listing_quota,
    is_active: initialData.is_active,
    features: enabledFeatures,
  };
}

interface PlanFormProps {
  initialData?: PricingPlan | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PlanForm({ initialData, onSuccess, onCancel }: PlanFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<PlanFormInput, undefined, PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: getPlanFormDefaults(initialData),
  });

  const onSubmit = async (values: PlanFormValues) => {
    setLoading(true);
    try {
      const submitData = {
        name: values.name,
        price: values.price,
        credits: values.credits,
        listing_quota: values.listing_quota,
        is_active: values.is_active,
        features: values.features as unknown as Record<string, boolean | number | string | null>,
      };

      if (initialData) {
        await updatePricingPlan(initialData.id, submitData);
        toast.success("Paket başarıyla güncellendi");
      } else {
        await createPricingPlan(submitData);
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
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Paket Adı
            </Label>
            <Input
              {...form.register("name")}
              placeholder="Örn: Premium Plus"
              className="rounded-xl"
            />
            {form.formState.errors.name && (
              <p className="text-[10px] font-bold text-rose-500">
                {form.formState.errors.name.message as string}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Fiyat (TL)
              </Label>
              <Input {...form.register("price")} type="number" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                İlan Kredisi
              </Label>
              <Input {...form.register("credits")} type="number" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                İlan Limiti
              </Label>
              <Input {...form.register("listing_quota")} type="number" className="rounded-xl" />
            </div>
          </div>

          <div className="pt-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 block">
              Paket Özellikleri
            </Label>
            <div className="grid grid-cols-2 gap-4">
              {PLAN_FEATURE_OPTIONS.map((feature) => {
                const fieldName = `features` as const;
                // eslint-disable-next-line react-hooks/incompatible-library
                const features = form.watch(fieldName) || [];
                const isChecked = features.includes(feature.id);

                return (
                  <div
                    key={feature.id}
                    className="flex items-center space-x-2 bg-muted/30 p-3 rounded-xl border border-border/50"
                  >
                    <Checkbox
                      id={feature.id}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const current = form.getValues(fieldName) || [];
                        if (checked) {
                          form.setValue(fieldName, [...current, feature.id] as unknown as string[]);
                        } else {
                          form.setValue(
                            fieldName,
                            current.filter((f) => f !== feature.id) as unknown as string[]
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={feature.id}
                      className="text-xs font-bold text-foreground/90 cursor-pointer"
                    >
                      {feature.label}
                    </Label>
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
            <Label
              htmlFor="is_active"
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
            >
              Bu paketi hemen yayına al
            </Label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-xl h-11 font-bold text-[10px] tracking-widest uppercase border-border"
          onClick={onCancel}
        >
          İptal
        </Button>
        <Button
          type="submit"
          className="flex-1 rounded-xl h-11 font-bold text-[10px] tracking-widest uppercase bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-100"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="animate-spin size-4" />
          ) : initialData ? (
            "GÜNCELLE"
          ) : (
            "OLUŞTUR"
          )}
        </Button>
      </div>
    </form>
  );
}

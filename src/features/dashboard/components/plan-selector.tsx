"use client";

import { Check, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { PricingPlan } from "@/features/admin-moderation/services/plans";
import { Button } from "@/features/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/features/ui/components/card";
import { cn } from "@/lib";

interface PlanSelectorProps {
  plans: PricingPlan[];
}

export function PlanSelector({ plans }: PlanSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (plan.price === 0) {
      toast.info("Bu plan zaten tüm kullanıcılar için varsayılan olarak tanımlıdır.");
      return;
    }

    try {
      setLoading(plan.id);
      toast.info(
        `${plan.name} planı için ödeme akışı henüz aktif değil. Paket detaylarını inceleyebilirsiniz.`
      );
    } catch {
      toast.error("Bir hata oluştu.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {plans.map((plan) => {
        const isFreePlan = plan.price === 0;

        return (
          <Card
            key={plan.id}
            className={cn(
              "relative flex flex-col overflow-hidden border-2 transition-all",
              plan.type === "professional"
                ? "border-primary shadow-lg"
                : "border-border hover:border-muted-foreground/30"
            )}
          >
            {plan.type === "professional" && (
              <div className="absolute right-0 top-0 z-10 rounded-bl-lg bg-primary px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                En Popüler
              </div>
            )}

            <CardHeader className="pb-6">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {plan.type === "individual"
                  ? "Bireysel"
                  : plan.type === "corporate"
                    ? "Kurumsal"
                    : "Profesyonel"}
              </div>
              <CardTitle className="text-2xl font-black tracking-tight">{plan.name}</CardTitle>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tighter">
                  {isFreePlan ? "Ücretsiz" : `₺${plan.price.toLocaleString("tr-TR")}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-sm font-bold text-muted-foreground">/ay</span>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {isFreePlan
                  ? "Tüm bireysel kullanıcılar bu planla ücretsiz ilan yayınlamaya başlayabilir."
                  : "Ödeme akışı açıldığında bu paket için başvuru ve ödeme burada başlayacak."}
              </p>
            </CardHeader>

            <CardContent className="flex-grow space-y-6">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="mb-1 flex items-center gap-3">
                  <ShieldCheck size={18} className="text-primary" />
                  <span className="text-sm font-bold">{plan.listing_quota} Aktif İlan</span>
                </div>
                <p className="pl-7 text-xs font-medium text-muted-foreground">
                  Aynı anda yayında olabilecek maksimum ilan sayısı.
                </p>
              </div>

              <ul className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm font-semibold text-foreground/80"
                  >
                    <div className="mt-1 rounded-full bg-emerald-100 p-0.5">
                      <Check size={12} className="text-emerald-600" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="flex flex-col items-stretch gap-3 pt-6">
              <Button
                className={cn(
                  "h-12 w-full rounded-xl text-xs font-bold uppercase tracking-widest",
                  isFreePlan ? "bg-muted text-muted-foreground hover:bg-muted" : ""
                )}
                variant={plan.type === "professional" ? "default" : "outline"}
                onClick={() => handleSelectPlan(plan)}
                disabled={!!loading || isFreePlan}
              >
                {isFreePlan
                  ? "Varsayılan Plan"
                  : loading === plan.id
                    ? "Bilgilendiriliyor..."
                    : "Detayları İncele"}
              </Button>
              {!isFreePlan && (
                <p className="text-center text-xs leading-5 text-muted-foreground">
                  Yanıltıcı yönlendirme olmaması için ödeme CTA&apos;sı şimdilik bilgi amaçlı
                  tutuldu.
                </p>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

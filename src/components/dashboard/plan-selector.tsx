"use client";

import { Check, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from "@/lib/constants/plans";
import { cn } from "@/lib/utils";

export function PlanSelector() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (plan.price === 0) {
      toast.info("Bu plan zaten tüm kullanıcılar için varsayılan olarak tanımlıdır.");
      return;
    }

    try {
      setLoading(plan.id);
      // Plan selection logic will be implemented in the next step
      toast.success(`${plan.name} seçildi. Ödeme sistemine yönlendiriliyorsunuz...`);
    } catch {
      toast.error("Bir hata oluştu.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {SUBSCRIPTION_PLANS.map((plan) => (
        <Card
          key={plan.id}
          className={cn(
            "relative overflow-hidden flex flex-col transition-all border-2",
            plan.type === "professional"
              ? "border-primary shadow-lg"
              : "border-border hover:border-muted-foreground/30"
          )}
        >
          {plan.type === "professional" && (
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-4 py-1.5 rounded-bl-lg uppercase tracking-widest z-10">
              En Popüler
            </div>
          )}

          <CardHeader className="pb-8">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
              {plan.type === "individual" ? "Bireysel" : "Kurumsal"}
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">{plan.name}</CardTitle>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-black tracking-tighter">
                {plan.price === 0 ? "Ücretsiz" : `₺${plan.price.toLocaleString("tr-TR")}`}
              </span>
              {plan.price > 0 && (
                <span className="text-sm font-bold text-muted-foreground">/ay</span>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-grow space-y-6">
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-3 mb-1">
                <ShieldCheck size={18} className="text-primary" />
                <span className="text-sm font-bold">{plan.listingQuota} Aktif İlan</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium pl-7">
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

          <CardFooter className="pt-8">
            <Button
              className={cn(
                "w-full h-14 rounded-xl font-bold uppercase tracking-widest text-xs",
                plan.price === 0 ? "bg-muted text-muted-foreground hover:bg-muted" : ""
              )}
              variant={plan.type === "professional" ? "default" : "outline"}
              onClick={() => handleSelectPlan(plan)}
              disabled={!!loading || plan.price === 0}
            >
              {plan.price === 0 ? "Mevcut Plan" : "Hemen Başla"}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

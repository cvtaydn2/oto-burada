"use client";

import { useState } from "react";
import { Check, Zap, Crown, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { PricingPlan } from "@/services/admin/plans";

interface PricingPlansProps {
  initialPlans: PricingPlan[];
}

export function PricingPlans({ initialPlans }: PricingPlansProps) {
  const [plans] = useState(initialPlans);
  const [loading, setLoading] = useState<string | null>(null);

  const getPlanIcon = (name: string) => {
    if (name.includes("Bireysel")) return User;
    if (name.includes("Paket 2")) return Crown;
    return Zap;
  };

  const handleSubscribe = (planId: string) => {
    setLoading(planId);
    // Redirect to payment page
    setTimeout(() => {
      window.location.href = `/dashboard/pricing/checkout?plan=${planId}`;
      setLoading(null);
    }, 800);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Üyelik Paketleri</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          İhtiyacınıza uygun paketi seçin, satışlarınızı profesyonel bir seviyeye taşıyın.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.name);
          const isFeatured = plan.name.includes("Paket 1");
          
          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col transition-all duration-300 hover:shadow-xl ${
                isFeatured
                  ? "border-primary shadow-lg scale-105 z-10"
                  : "border-border"
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    En Popüler
                  </Badge>
                </div>
              )}
  
              <CardHeader>
                <div className="p-3 w-fit rounded-xl bg-primary/10 mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription>
                  {plan.credits === 0 ? "Sınırsız İlan" : `${plan.credits} İlan Hakkı`}
                </CardDescription>
              </CardHeader>
  
              <CardContent className="flex-1 space-y-6">
                <div className="space-y-1">
                  <span className="text-4xl font-bold">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(plan.price)}</span>
                  <span className="text-muted-foreground ml-1">/ ay</span>
                </div>
  
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-medium text-primary">
                    <div className="h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-full" />
                    </div>
                    <span className="whitespace-nowrap">{plan.credits} İlan</span>
                  </div>
  
                  <ul className="space-y-3">
                    {Object.entries(plan.features).map(([key, val]) => (
                      <li key={key} className="flex items-start gap-3 text-sm">
                        <div className="mt-1 h-4 w-4 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="capitalize">{key.replace('_', ' ')}: {val === true ? "Dahil" : val}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
  
              <CardFooter>
                <Button
                  className="w-full"
                  variant={isFeatured ? "default" : "outline"}
                  disabled={plan.price === 0 || loading !== null}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {loading === plan.id ? "İşleniyor..." : "Hemen Başla"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="bg-muted/50 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 border">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Building2 className="h-5 w-5" />
            <span>Kurumsal Çözümler</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Büyük filolar veya zincir galeriler için özel fiyat teklifi alın.
          </p>
        </div>
        <Button variant="outline">Bizimle İletişime Geçin</Button>
      </div>
    </div>
  );
}

"use client";

import { AlertCircle, Building2, Check, Crown, User, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isPaymentEnabled } from "@/lib/payment/config";
import { PricingPlan } from "@/services/admin/plans";

interface PricingPlansProps {
  initialPlans: PricingPlan[];
}

export function PricingPlans({ initialPlans }: PricingPlansProps) {
  const [plans] = useState(initialPlans);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const paymentAvailable = isPaymentEnabled();

  const getPlanIcon = (name: string) => {
    if (name.includes("Bireysel")) return User;
    if (name.includes("Paket 2")) return Crown;
    return Zap;
  };

  const handleSubscribe = (planId: string) => {
    setLoading(planId);
    router.push(`/dashboard/pricing/checkout?plan=${planId}`);
    setLoading(null);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Üyelik Paketleri</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          İhtiyacınıza uygun paketi seçin. Tüm paketlerde ilan vermmek ücretsizdir.
        </p>

        {!paymentAvailable && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
            <AlertCircle size={16} />
            Ödeme sistemi şu an bakımda. Paket satın almak için bizimle iletişime geçin.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.name);
          const isFeatured = plan.name.includes("Paket 1");

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col transition-all duration-300 ${
                isFeatured ? "border-primary shadow-sm z-10" : "border-border"
              }`}
            >
              {isFeatured && plan.price > 0 && !isFeatured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">Önerilen</Badge>
                </div>
              )}

              <CardHeader>
                <div className="p-3 w-fit rounded-xl bg-muted mb-4">
                  <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription>
                  {plan.credits === 0 ? "Sınırsız İlan" : `${plan.credits} İlan Hakkı`}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6">
                <div className="space-y-1">
                  <span className="text-4xl font-bold">
                    {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
                      plan.price
                    )}
                  </span>
                  {plan.price > 0 && <span className="text-muted-foreground ml-1">/ ay</span>}
                  {plan.price === 0 && (
                    <span className="text-muted-foreground ml-1 text-sm font-medium">Ücretsiz</span>
                  )}
                </div>

                <div className="space-y-4">
                  {plan.price > 0 ? (
                    <div className="flex items-center gap-2 font-medium text-primary">
                      <div className="h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-full" />
                      </div>
                      <span className="whitespace-nowrap">{plan.credits} İlan</span>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Ücretsiz ilan verin, istediğiniz kadar araç yayınlayın.
                    </div>
                  )}

                  <ul className="space-y-3">
                    {Object.keys(plan.features).map((key) => (
                      <li key={key} className="flex items-start gap-3 text-sm">
                        <div className="mt-1 h-4 w-4 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-foreground/90 leading-tight">
                          {key === "listing_xml" && "Sahibinden/Arabam Entegrasyonu (XML)"}
                          {key === "unlimited_listing" && "Sınırsız İlan Yayınlama"}
                          {key === "gallery_page" && "Kurumsal Showroom Sayfası"}
                          {key === "dedicated_support" && "Özel Müşteri Temsilcisi"}
                          {key === "analytics" && "Gelişmiş Satış Analitiği"}
                          {![
                            "listing_xml",
                            "unlimited_listing",
                            "gallery_page",
                            "dedicated_support",
                            "analytics",
                          ].includes(key) && key.replace("_", " ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full h-12 font-bold"
                  variant={isFeatured && plan.price > 0 ? "default" : "outline"}
                  disabled={loading !== null || (!paymentAvailable && plan.price > 0)}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {loading === plan.id
                    ? "Hazırlanıyor..."
                    : plan.price === 0
                      ? "Ücretsiz Başla"
                      : paymentAvailable
                        ? "Paketi Seç"
                        : "İletişime Geç"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="bg-muted/50 rounded-2xl p-6 flex items-center gap-4 border max-w-sm">
            <Building2 className="h-6 w-6 text-muted-foreground shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold">Kurumsal Çözümler</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Büyük filolar için özel teklif ve entegrasyon desteği alın.
              </p>
            </div>
            <Button variant="link" size="sm" className="px-0 font-bold" asChild>
              <a href="/contact">İLETİŞİM</a>
            </Button>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground/60">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold border rounded px-1">BETA</span>
              </div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-center">
                Otomatik ve Manuel Aktivasyon
              </span>
            </div>
          </div>
        </div>

        <div className="text-right space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Destek & Yardım
          </p>
          <p className="text-xs font-medium text-foreground/60">+90 (212) ... .. ..</p>
        </div>
      </div>
    </div>
  );
}

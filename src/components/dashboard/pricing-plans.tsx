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

const PLANS = [
  {
    id: "individual-free",
    name: "Bireysel Başlangıç",
    price: "0₺",
    credits: "3 İlan",
    description: "Kişisel satışlarınız için ideal.",
    icon: User,
    features: ["3 Aktif İlan Hakkı", "Temel İstatistikler", "WhatsApp Desteği"],
    buttonText: "Mevcut Plan",
    featured: false,
  },
  {
    id: "pro-gallery-1",
    name: "Galeri Paket 1",
    price: "999₺",
    credits: "50 İlan",
    description: "Küçük galeriler için profesyonel çözüm.",
    icon: Zap,
    features: [
      "50 Aktif İlan Hakkı",
      "Profesyonel Mağaza Rozeti",
      "Doping Hizmetlerine Erişim",
      "Gelişmiş İstatistikler",
      "Marka Bilinirliği",
    ],
    buttonText: "Hemen Başla",
    featured: true,
  },
  {
    id: "pro-gallery-2",
    name: "Galeri Paket 2",
    price: "2,499₺",
    credits: "200 İlan",
    description: "Büyük ölçekli işletmeler için sınırsız güç.",
    icon: Crown,
    features: [
      "200 Aktif İlan Hakkı",
      "VIP Destek Hattı",
      "Yıllık Ödemede İndirim",
      "Sınırsız Fotoğraf Yükleme",
      "Tüm Dopinglerde %10 İndirim",
    ],
    buttonText: "Hemen Başla",
    featured: false,
  },
];

export function PricingPlans() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = (planId: string) => {
    setLoading(planId);
    // Simulate payment process
    setTimeout(() => {
      alert("Ödeme sistemine yönlendiriliyorsunuz...");
      setLoading(null);
    }, 1000);
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
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`relative flex flex-col transition-all duration-300 hover:shadow-xl ${
              plan.featured
                ? "border-primary shadow-lg scale-105 z-10"
                : "border-border"
            }`}
          >
            {plan.featured && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">
                  En Popüler
                </Badge>
              </div>
            )}

            <CardHeader>
              <div className="p-3 w-fit rounded-xl bg-primary/10 mb-4">
                <plan.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 space-y-6">
              <div className="space-y-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground ml-1">/ ay</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 font-medium text-primary">
                  <div className="h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-full" />
                  </div>
                  <span className="whitespace-nowrap">{plan.credits}</span>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <div className="mt-1 h-4 w-4 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={plan.featured ? "default" : "outline"}
                disabled={plan.id === "individual-free" || loading !== null}
                onClick={() => handleSubscribe(plan.id)}
              >
                {loading === plan.id ? "İşleniyor..." : plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
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

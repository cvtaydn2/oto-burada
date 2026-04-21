"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Rocket, 
  Star, 
  Zap, 
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { trust } from "@/lib/constants/ui-strings";
import { DOPING_PRICES } from "@/lib/payment/constants";
import { Button } from "@/components/ui/button";
import { getSellerTrustUI } from "@/lib/utils/trust-ui";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

const DOPING_OPTIONS = [
  {
    ...DOPING_PRICES.featured,
    description: "İlanınız ana sayfada en üst bölümde döner.",
    icon: Star,
    color: "bg-amber-500",
  },
  {
    ...DOPING_PRICES.urgent,
    description: "Sarı 'ACİL' etiketi ve arama sonuçlarında öncelik.",
    icon: Zap,
    color: "bg-red-500",
  },
  {
    ...DOPING_PRICES.highlighted,
    description: "Arama listesinde ilanınız fark edilir şekilde görünür.",
    icon: TrendingUp,
    color: "bg-blue-500",
  },
];

interface ListingDopingPanelProps {
  listingId: string;
  listingTitle: string;
  trustUI: ReturnType<typeof getSellerTrustUI>;
}

export function ListingDopingPanel({ listingId, listingTitle, trustUI }: ListingDopingPanelProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"error" | "idle" | "success">("idle");

  const isRestricted = !trustUI.isPremiumVisible;
  const blockTitle = trustUI.restrictionState === "banned" 
    ? "Hesap Yasaklandı" 
    : trustUI.restrictionState === "restricted_review"
      ? trust.accountUnderReview
      : "Yetersiz Güven Skoru";

  const blockDesc = trustUI.restrictionState === "banned"
    ? "Hesabınızdaki kısıtlama nedeniyle yeni doping alımı yapılamaz."
    : trustUI.restrictionState === "restricted_review"
      ? trust.dopingRestriction
      : "Premium özellikleri kullanabilmek için profil doğrulamanızı tamamlamanız ve %40 güven barajını aşmanız gerekmektedir.";

  const totalPrice = DOPING_OPTIONS
    .filter(opt => selected.includes(opt.id))
    .reduce((sum, opt) => sum + opt.price, 0);

  const toggleOption = (id: string) => {
    if (isRestricted) return;
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleApply = async () => {
    if (isRestricted) return;
    if (selected.length === 0) {
      setStatus("error");
      setMessage("Lütfen en az bir doping seçin.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setMessage(null);

    try {
      const response = await fetch(`/api/listings/${listingId}/doping`, {
        method: "POST",
        body: JSON.stringify({ dopingTypes: selected }),
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json().catch(() => null) as {
        success?: boolean;
        message?: string;
        data?: {
          paymentUrl?: string;
          message?: string;
        };
        error?: { message?: string };
      } | null;
      
      if (response.ok && result?.success) {
        const paymentUrl = result.data?.paymentUrl;
        const successMessage = result.data?.message ?? result.message;

        if (paymentUrl) {
          setStatus("success");
          setMessage("Ödeme sayfasına yönlendiriliyorsunuz...");
          window.location.href = paymentUrl;
        } else {
          setStatus("success");
          setMessage(successMessage ?? "Dopingler başarıyla uygulandı.");
          router.refresh();
        }
      } else {
        setStatus("error");
        setMessage(result?.error?.message ?? result?.message ?? "İşlem başarısız oldu.");
      }
    } catch {
      setStatus("error");
      setMessage("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Hızlı Satış Dopingleri
        </h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{listingTitle}</span> ilanınızı milyonlarca alıcıya ulaştırın.
        </p>
      </div>

      <div className={cn("grid gap-4", isRestricted && "opacity-50 pointer-events-none")}>
        {DOPING_OPTIONS.map((option) => (
          <div
            key={option.id}
            className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
              selected.includes(option.id)
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => toggleOption(option.id)}
          >
            <div className={`mt-1 p-3 rounded-xl ${option.color} text-white`}>
              <option.icon className="h-5 w-5" />
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold">{option.name}</span>
                <span className="font-bold text-primary">{option.price}₺</span>
              </div>
              <p className="text-sm text-muted-foreground mr-8">
                {option.description}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Clock className="h-3 w-3" />
                <span>{option.days} Gün Sürer</span>
              </div>
            </div>

            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              selected.includes(option.id)
                ? "border-primary bg-primary"
                : "border-muted group-hover:border-primary/50"
            }`}>
              {selected.includes(option.id) && (
                <CheckCircle2 className="h-4 w-4 text-white" />
              )}
            </div>
          </div>
        ))}
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Seçilen Hizmetler:</span>
            <span className="font-bold text-lg">{totalPrice}₺</span>
          </div>

          {isRestricted ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 mb-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-rose-900">{blockTitle}</p>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    {blockDesc}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Button 
              className="w-full h-12 text-lg font-bold"
              disabled={selected.length === 0 || loading}
              onClick={handleApply}
            >
              {loading ? "İşleniyor..." : "Dopingleri Uygula"}
            </Button>
          )}
          
          {!isRestricted && (message ? (
            <div
              className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                status === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {status === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
              <span>{message}</span>
            </div>
          ) : (
            <p className="text-[10px] text-center text-muted-foreground mt-3">
              Ödeme ve görünürlük artışı onayı işlem sonucunda burada gösterilir.
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

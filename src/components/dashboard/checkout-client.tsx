"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ShieldCheck, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePostHog } from "posthog-js/react";
import type { PricingPlan } from "@/services/admin/plans";

interface CheckoutClientProps {
  plan: PricingPlan;
  isPaymentEnabled: boolean;
}

export function CheckoutClient({ plan, isPaymentEnabled }: CheckoutClientProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handlePayment = async () => {
    setIsProcessing(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/payments/purchase-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });

      const data = await res.json();

      if (data.success) {
        posthog?.capture("payment_success", { planId: plan.id, planName: plan.name, amount: plan.price });
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        // API'den dönen hata — kullanıcıya göster ve PostHog'a bildir
        posthog?.capture("payment_failed", {
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          error: data.error,
          status: res.status,
        });
        setStatus("error");
        setErrorMessage(data.error ?? "Ödeme işlemi başarısız oldu.");
      }
    } catch (err) {
      // Network/unexpected error — PostHog'a exception olarak gönder
      posthog?.captureException(
        err instanceof Error ? err : new Error(String(err)),
        { planId: plan.id, context: "checkout_payment" }
      );
      setStatus("error");
      setErrorMessage("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="rounded-full bg-emerald-100 p-6">
          <CheckCircle2 className="size-12 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Ödeme Başarılı!</h2>
          <p className="mt-2 text-slate-500">
            <span className="font-semibold">{plan.name}</span> paketiniz aktif edildi. Panele yönlendiriliyorsunuz...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
          <ArrowLeft size={16} />
          Geri
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Ödeme</h1>
      </div>

      {/* Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-700">Seçilen Paket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">{plan.name}</p>
              <p className="text-sm text-slate-500">
                {plan.credits === 0 ? "Sınırsız ilan" : `${plan.credits} ilan hakkı`}
              </p>
            </div>
            <Badge className="text-lg font-black px-4 py-2 bg-blue-50 text-blue-700 border-blue-200">
              {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(plan.price)}
            </Badge>
          </div>

          <div className="border-t pt-4 space-y-2">
            {Object.entries(plan.features).map(([key, val]) => (
              val && (
                <div key={key} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span className="capitalize">{key.replace(/_/g, " ")}</span>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-bold mb-1">Ödeme Sistemi Geliştirme Aşamasında</p>
              <p>
                Ödeme altyapısı (Iyzico) entegrasyonu tamamlanmaktadır. 
                Şu an satın alma işlemi gerçekleştirilememektedir. 
                Kurumsal paket için <a href="/contact" className="underline font-semibold">bizimle iletişime geçin</a>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
          {errorMessage}
        </div>
      )}

      {/* CTA */}
      <div className="space-y-3">
        {isPaymentEnabled ? (
          <Button
            className="w-full h-14 text-base font-bold gap-2"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            <CreditCard size={20} />
            {isProcessing ? "İşleniyor..." : `${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(plan.price)} Öde`}
          </Button>
        ) : (
          <Button asChild className="w-full h-14 text-base font-bold gap-2">
            <a href="/contact">
              <CreditCard size={20} />
              Bizimle İletişime Geç
            </a>
          </Button>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>{isPaymentEnabled ? "SSL korumalı güvenli ödeme" : "Paket aktivasyonu şu an manuel ilerliyor"}</span>
        </div>
      </div>
    </div>
  );
}

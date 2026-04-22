"use client";

import { AlertTriangle, ArrowLeft, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { captureClientEvent, captureClientException } from "@/lib/monitoring/posthog-client";
import type { PricingPlan } from "@/services/admin/plans";

interface CheckoutClientProps {
  plan: PricingPlan;
  isPaymentEnabled: boolean;
}

export function CheckoutClient({ plan, isPaymentEnabled }: CheckoutClientProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");

  const handlePayment = async () => {
    if (plan.price > 0 && (!identityNumber || identityNumber.length !== 11)) {
      setStatus("error");
      setErrorMessage("Lütfen geçerli bir 11 haneli TC Kimlik Numarası giriniz.");
      return;
    }

    setIsProcessing(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/payments/purchase-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          identityNumber: plan.price > 0 ? identityNumber : undefined,
        }),
      });

      const data = await res
        .json()
        .catch(() => ({ success: false, error: "Sunucu yanıtı okunamadı." }));
      const payload = data?.data;
      const errorMessage =
        typeof data?.error === "string"
          ? data.error
          : typeof data?.error?.message === "string"
            ? data.error.message
            : "Ödeme işlemi başarısız oldu.";

      if (res.ok && data.success) {
        captureClientEvent("payment_success", {
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
        });

        // If Iyzico returned a payment URL (checkout form), redirect the user to it
        if (payload?.paymentUrl) {
          window.location.href = payload.paymentUrl;
          return;
        }

        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        captureClientEvent("payment_failed", {
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          error: errorMessage,
          status: res.status,
        });
        setStatus("error");
        setErrorMessage(errorMessage);
      }
    } catch (err) {
      captureClientException(err, "checkout_payment", { planId: plan.id });
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
          <h2 className="text-2xl font-bold text-slate-900">İşlem Başarılı!</h2>
          <p className="mt-2 text-slate-500">
            <span className="font-semibold">{plan.name}</span> paketiniz onaylandı. Panelinize
            yönlendiriliyorsunuz...
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
            <Badge className="text-lg font-bold px-4 py-2 bg-blue-50 text-blue-700 border-blue-200">
              {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
                plan.price
              )}
            </Badge>
          </div>

          <div className="border-t pt-4 space-y-2">
            {Object.entries(plan.features).map(
              ([key, val]) =>
                val && (
                  <div key={key} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span className="capitalize">{key.replace(/_/g, " ")}</span>
                  </div>
                )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Notice */}
      {!isPaymentEnabled && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-bold mb-1">Ödeme Sistemi Aktif Değil</p>
                <p>
                  Otomatik ödeme sistemimiz geçici olarak bakımdadır. Paketinizi hemen aktif etmek
                  için{" "}
                  <a href="/contact" className="underline font-semibold">
                    bizimle iletişime geçin
                  </a>{" "}
                  veya ücretsiz paketi kullanın.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
          {errorMessage}
        </div>
      )}

      {/* Identity Number for Paid Plans */}
      {plan.price > 0 && isPaymentEnabled && (
        <div className="space-y-2">
          <label htmlFor="tc-no" className="text-sm font-bold text-slate-700">
            TC Kimlik Numarası <span className="text-red-500">*</span>
          </label>
          <input
            id="tc-no"
            type="text"
            maxLength={11}
            placeholder="11 haneli TC kimlik numaranız"
            className="w-full h-12 px-4 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:outline-none text-sm"
            value={identityNumber}
            onChange={(e) => setIdentityNumber(e.target.value.replace(/\D/g, ""))}
          />
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            * Iyzico ödeme sisteminde faturalandırma için yasal olarak zorunludur.
          </p>
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
            {isProcessing
              ? "İşleniyor..."
              : `${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(plan.price)} Öde`}
          </Button>
        ) : (
          <Button asChild className="w-full h-14 text-base font-bold gap-2">
            <a href="/contact">
              <CreditCard size={20} />
              Bizimle İletişime Geç
            </a>
          </Button>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
          <ShieldCheck
            size={14}
            className={isPaymentEnabled ? "text-emerald-500" : "text-slate-300"}
          />
          <span>
            {isPaymentEnabled
              ? "Ödemeniz SSL ile korunmaktadır."
              : "Paket aktivasyonu için müşteri temsilcimiz sizinle iletişime geçecektir."}
          </span>
        </div>
      </div>
    </div>
  );
}

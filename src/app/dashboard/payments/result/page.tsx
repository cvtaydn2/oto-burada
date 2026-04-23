"use client";

import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Home,
  Loader2,
  MessageSquare,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { captureClientException } from "@/lib/monitoring/posthog-client";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { logger } from "@/lib/utils/logger";

type PaymentResultStatus =
  | "failure"
  | "invalid"
  | "pending"
  | "success"
  | "unverified"
  | "verification_error";

function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PaymentResultStatus>("pending");
  const [paymentData, setPaymentData] = useState<{
    id: string;
    amount: number;
    status: string;
    plan_name?: string;
  } | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const requestInFlightRef = useRef(false);

  const token = searchParams.get("token");

  useEffect(() => {
    let cancelled = false;
    let pollTimeout: ReturnType<typeof setTimeout> | null = null;

    async function verifyPayment() {
      if (!token) {
        if (!cancelled) {
          setStatus("invalid");
          setLoading(false);
        }
        return;
      }

      const supabase = createSupabaseBrowserClient();
      let attempts = 0;
      const maxAttempts = 5;

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        if (!cancelled) {
          setStatus("invalid");
          setLoading(false);
        }
        return;
      }

      const checkStatus = async () => {
        if (requestInFlightRef.current) {
          return false;
        }

        requestInFlightRef.current = true;
        const startCheck = Date.now();
        try {
          const { data, error } = await supabase
            .from("payments")
            .select("id, amount, status, plan_name")
            .eq("iyzico_token", token)
            .eq("user_id", currentUser.id)
            .maybeSingle();

          if (cancelled) {
            return true;
          }

          if (error) {
            captureClientException(error, "payment_result_verification_query", { token });
            setStatus("verification_error");
            setLoading(false);
            return true;
          }

          logger.perf.debug("Payment checkStatus direct DB execution", {
            duration: Date.now() - startCheck,
            status: data?.status,
          });

          if (data) {
            setPaymentData(data);

            // Fix 3: Deterministic state mapping
            // If DB status is success but not fulfilled yet, it's 'processing' or 'partially_completed'
            if (data.status === "success") {
              if (data.fulfilled_at) {
                setStatus("success");
                setLoading(false);
                router.refresh();
                return true;
              } else {
                // Payment received but doping logic not yet finished (async worker or delay)
                setStatus("pending");
                // Continue polling
                return false;
              }
            } else if (data.status === "failure" || data.status === "cancelled") {
              setStatus("failure");
              setLoading(false);
              return true;
            }
          }

          return false;
        } finally {
          requestInFlightRef.current = false;
        }
      };

      const poll = async () => {
        if (cancelled) return;
        const found = await checkStatus();
        if (cancelled || found) {
          return;
        }

        if (attempts < maxAttempts) {
          attempts++;
          // Fix 1: Exponential backoff (1.5s, 2.25s, 3.375s, 5s, 7.5s)
          const delay = Math.min(1500 * Math.pow(1.5, attempts - 1), 10000);
          pollTimeout = setTimeout(() => {
            void poll();
          }, delay);
          return;
        }

        if (!found) {
          setStatus("unverified");
        }
        setLoading(false);
      };

      void poll();
    }

    // Fix 2: Duplicate polling guard - ensure verifyPayment only runs once per effect cycle
    let verifyStarted = false;
    if (!verifyStarted) {
      verifyStarted = true;
      void verifyPayment();
    }

    return () => {
      cancelled = true;
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
    };
  }, [token, router, retryNonce]);

  const retryVerification = () => {
    if (requestInFlightRef.current) {
      return;
    }
    setPaymentData(null);
    setStatus("pending");
    setLoading(true);
    setRetryNonce((current) => current + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
          <Loader2 className="h-16 w-16 text-blue-600 animate-spin relative z-10" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">İşleminiz Kontrol Ediliyor</h2>
          <p className="text-slate-400 font-bold mt-1">Lütfen sayfayı kapatmayın...</p>
        </div>
      </div>
    );
  }

  const isFailure = status === "failure";
  const isInvalid = status === "invalid";
  const isPending = status === "pending";
  const isSuccess = status === "success";
  const isUnverified = status === "unverified";
  const isVerificationError = status === "verification_error";
  const isWarningState = isPending || isUnverified || isVerificationError;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 anime-in fade-in slide-in-from-bottom-8 duration-700">
      <Card className="overflow-hidden border-none shadow-sm bg-white/80 backdrop-blur-xl rounded-2xl">
        <div
          className={`h-3 w-full ${
            isSuccess ? "bg-emerald-500" : isWarningState ? "bg-amber-500" : "bg-rose-500"
          }`}
        />

        <CardContent className="pt-12 pb-10 px-8 text-center">
          <div className="mb-8 flex justify-center">
            <div
              className={`relative h-24 w-24 flex items-center justify-center rounded-full animate-in zoom-in duration-500 ${
                isSuccess
                  ? "bg-emerald-50 text-emerald-600"
                  : isWarningState
                    ? "bg-amber-50 text-amber-600"
                    : "bg-rose-50 text-rose-600"
              }`}
            >
              <div
                className={`absolute inset-0 rounded-full blur-xl opacity-40 ${
                  isSuccess ? "bg-emerald-500" : isWarningState ? "bg-amber-500" : "bg-rose-500"
                }`}
              />
              {isSuccess ? (
                <CheckCircle2 className="h-12 w-12 stroke-[2.5]" />
              ) : (
                <XCircle className="h-12 w-12 stroke-[2.5]" />
              )}
            </div>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            {isSuccess
              ? "Ödeme Başarılı!"
              : isInvalid
                ? "Geçersiz Bağlantı"
                : isPending
                  ? "Ödeme Doğrulanıyor"
                  : isUnverified
                    ? "Ödeme Henüz Doğrulanamadı"
                    : isVerificationError
                      ? "Doğrulama Hatası"
                      : "Ödeme Başarısız"}
          </h1>

          <p className="mt-4 text-lg font-bold text-slate-500 leading-relaxed max-w-md mx-auto">
            {isSuccess
              ? `${paymentData?.plan_name ? `${paymentData.plan_name} paketiniz` : "Hizmetiniz"} başarıyla tanımlandı. OtoBurada'yı tercih ettiğiniz için teşekkür ederiz.`
              : isInvalid
                ? "Bu ödeme bağlantısı geçersiz veya eksik. Lütfen ödeme akışını yeniden başlatın."
                : isPending
                  ? "Ödemeniz alındıysa doğrulama hâlâ sürüyor olabilir. Lütfen kısa süre sonra tekrar kontrol edin."
                  : isUnverified
                    ? "Ödeme sonucu şu an doğrulanamadı. Birkaç dakika sonra tekrar kontrol edin veya panelden durumunu inceleyin."
                    : isVerificationError
                      ? "Ödeme doğrulaması sırasında geçici bir hata oluştu. Lütfen tekrar deneyin."
                      : "Ödeme işlemi sırasında bir hata oluştu veya bankanız tarafından reddedildi."}
          </p>

          {paymentData && (
            <div className="mt-10 p-6 rounded-3xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  İşlem Tutarı
                </span>
                <span className="text-lg font-bold text-slate-900">{paymentData.amount} ₺</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Referans No
                </span>
                <span className="text-xs font-bold text-slate-600 truncate block">
                  {paymentData.id.split("-")[0]}
                </span>
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3">
            {isSuccess ? (
              <>
                <Button
                  asChild
                  className="h-14 rounded-2xl bg-blue-600 text-white font-bold uppercase tracking-widest shadow-sm shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Link href="/dashboard/listings">
                    İlanlarıma Git
                    <ClipboardList className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <Link href="/dashboard">
                    Panel Özetine Dön
                    <Home className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </>
            ) : isPending ? (
              <>
                <Button
                  className="h-14 rounded-2xl bg-blue-600 text-white font-bold uppercase tracking-widest shadow-sm shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  onClick={retryVerification}
                  disabled={loading}
                >
                  Kontrolü Yenile
                  <Loader2 className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <Link href="/dashboard/pricing">
                    Paketlere Dön
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <Link href="/dashboard">
                    Panele Dön
                    <Home className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </>
            ) : isUnverified || isVerificationError ? (
              <>
                <Button
                  className="h-14 rounded-2xl bg-blue-600 text-white font-bold uppercase tracking-widest shadow-sm shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  onClick={retryVerification}
                  disabled={loading}
                >
                  Tekrar Kontrol Et
                  <Loader2 className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <Link href="/contact">
                    Destek Al
                    <MessageSquare className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <Link href="/dashboard/pricing">
                    Paketlere Dön
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </>
            ) : isInvalid ? (
              <>
                <Button
                  asChild
                  className="h-14 rounded-2xl bg-slate-900 text-white font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  <Link href="/dashboard/pricing">
                    Paketlere Dön
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <Link href="/contact">
                    Destek Al
                    <MessageSquare className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </>
            ) : isFailure ? (
              <>
                <Button
                  asChild
                  className="h-14 rounded-2xl bg-rose-600 text-white font-bold uppercase tracking-widest shadow-sm shadow-rose-500/20 hover:bg-rose-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  onClick={() => window.history.back()}
                >
                  <span className="inline-flex items-center">
                    Tekrar Dene
                    <Zap className="ml-2 h-5 w-5" />
                  </span>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <Link href="/dashboard/pricing">
                    Paketlere Göz At
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <Link href="/contact">
                    Destek Al
                    <MessageSquare className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <MessageSquare size={18} />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-900">Yardıma mı ihtiyacınız var?</div>
            <div className="text-[10px] font-bold text-slate-400">
              Canlı destek ekibimize ulaşın.
            </div>
          </div>
        </div>
        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
          Güvenli Ödeme Altyapısı © Iyzico
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}

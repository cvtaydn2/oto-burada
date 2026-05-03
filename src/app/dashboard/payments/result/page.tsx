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
import { logger } from "@/lib/logging/logger";
import { captureClientException } from "@/lib/monitoring/telemetry-client";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type PaymentResultStatus =
  | "failure"
  | "invalid"
  | "partial_success"
  | "pending"
  | "success"
  | "unverified"
  | "verification_error";

interface PaymentStatusInfo {
  title: string;
  description: string;
  icon: typeof CheckCircle2;
  colorClass: string;
  bgClass: string;
}

const PAYMENT_STATUS_MAP: Record<PaymentResultStatus, PaymentStatusInfo> = {
  success: {
    title: "Ödeme Başarılı!",
    description:
      "Hizmetiniz başarıyla tanımlandı. OtoBurada'yı tercih ettiğiniz için teşekkür ederiz.",
    icon: CheckCircle2,
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-500",
  },
  failure: {
    title: "Ödeme Başarısız",
    description: "Ödeme işlemi sırasında bir hata oluştu veya bankanız tarafından reddedildi.",
    icon: XCircle,
    colorClass: "text-rose-600",
    bgClass: "bg-rose-500",
  },
  pending: {
    title: "Ödeme Doğrulanıyor",
    description:
      "Ödemeniz alındıysa doğrulama hâlâ sürüyor olabilir. Lütfen kısa süre sonra tekrar kontrol edin.",
    icon: Loader2,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-500",
  },
  invalid: {
    title: "Geçersiz Bağlantı",
    description: "Bu ödeme bağlantısı geçersiz veya eksik. Lütfen ödeme akışını yeniden başlatın.",
    icon: XCircle,
    colorClass: "text-rose-600",
    bgClass: "bg-rose-500",
  },
  unverified: {
    title: "Ödeme Henüz Doğrulanamadı",
    description: "Ödeme sonucu şu an doğrulanamadı. Birkaç dakika sonra tekrar kontrol edin.",
    icon: Loader2,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-500",
  },
  verification_error: {
    title: "Doğrulama Hatası",
    description: "Ödeme doğrulaması sırasında geçici bir hata oluştu. Lütfen tekrar deneyin.",
    icon: XCircle,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-500",
  },
  partial_success: {
    title: "Ödeme Alındı",
    description:
      "Ödemeniz başarıldı ancak ek hizmetlerin aktivasyonu zaman alabilir. En kısa sürede aktive edilecektir.",
    icon: Loader2,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-500",
  },
};

function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");
  const isPartialSuccess = initialStatus === "partial_success";
  const messageParam = searchParams.get("message") || "";

  const [loading, setLoading] = useState(!isPartialSuccess);
  const [status, setStatus] = useState<PaymentResultStatus>(
    () => (isPartialSuccess ? "partial_success" : "pending") as PaymentResultStatus
  );
  const [paymentData, setPaymentData] = useState<{
    id: string;
    amount: number;
    status: string;
    plan_name: string | null;
    fulfilled_at: string | null;
  } | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const requestInFlightRef = useRef(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (status === "partial_success") {
      return;
    }

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
            .select("id, amount, status, plan_name, fulfilled_at")
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

            if (data.status === "success") {
              if (data.fulfilled_at) {
                setStatus("success");
                setLoading(false);
                router.refresh();
                return true;
              } else {
                setStatus("pending");
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
  }, [token, router, retryNonce, status]);

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

  const info = PAYMENT_STATUS_MAP[status];
  const Icon = info.icon;
  const isSuccess = status === "success";
  const isPending = status === "pending";
  const isInvalid = status === "invalid";
  const isFailure = status === "failure";
  const isUnverified = status === "unverified";
  const isVerificationError = status === "verification_error";

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 anime-in fade-in slide-in-from-bottom-8 duration-700">
      <Card className="overflow-hidden border-none shadow-sm bg-white/80 backdrop-blur-xl rounded-2xl">
        <div className={`h-3 w-full ${info.bgClass}`} />

        <CardContent className="pt-12 pb-10 px-8 text-center">
          <div className="mb-8 flex justify-center">
            <div
              className={`relative h-24 w-24 flex items-center justify-center rounded-full animate-in zoom-in duration-500 ${info.colorClass} bg-opacity-10`}
              style={{ backgroundColor: "rgba(var(--primary), 0.1)" }}
            >
              <div className={`absolute inset-0 rounded-full blur-xl opacity-40 ${info.bgClass}`} />
              <Icon className="h-12 w-12 stroke-[2.5]" />
            </div>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            {info.title}
          </h1>

          <p className="mt-4 text-lg font-bold text-slate-500 leading-relaxed max-w-md mx-auto">
            {isSuccess && paymentData?.plan_name
              ? `${paymentData.plan_name} paketiniz başarıyla tanımlandı. OtoBurada'yı tercih ettiğiniz için teşekkür ederiz.`
              : messageParam && status === "partial_success"
                ? messageParam
                : info.description}
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
                  className="h-14 rounded-2xl bg-rose-600 text-white font-bold uppercase tracking-widest shadow-sm shadow-rose-500/20 hover:bg-rose-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  onClick={retryVerification}
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

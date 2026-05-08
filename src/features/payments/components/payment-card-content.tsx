import { ArrowRight, ClipboardList, Home, Loader2, MessageSquare, Zap } from "lucide-react";
import Link from "next/link";

import { Button } from "@/features/ui/components/button";
import { Card, CardContent } from "@/features/ui/components/card";

import { PAYMENT_STATUS_MAP, type PaymentResultStatus } from "../lib/payment-constants";

interface PaymentCardContentProps {
  status: PaymentResultStatus;
  messageParam?: string;
  paymentData: {
    id: string;
    amount: number;
    status: string;
    plan_name: string | null;
    fulfilled_at: string | null;
  } | null;
  retryVerification: () => void;
  loading: boolean;
}

export function PaymentCardContent({
  status,
  messageParam = "",
  paymentData,
  retryVerification,
  loading,
}: PaymentCardContentProps) {
  const info = PAYMENT_STATUS_MAP[status];
  const Icon = info.icon;
  const isSuccess = status === "success";
  const isPending = status === "pending";
  const isInvalid = status === "invalid";
  const isFailure = status === "failure";
  const isUnverified = status === "unverified";
  const isVerificationError = status === "verification_error";

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
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
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
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
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
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

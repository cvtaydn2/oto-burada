"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRight, 
  ClipboardList, 
  Zap,
  Home,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "failure" | "pending">("pending");
  const [paymentData, setPaymentData] = useState<{
    id: string;
    amount: number;
    status: string;
    plan_name?: string;
  } | null>(null);

  const token = searchParams.get("token");
  const statusParam = searchParams.get("status");

  useEffect(() => {
    async function verifyPayment() {
      if (!token) {
        setLoading(false);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      
      // Poll the payments table to see if the webhook has finished processing
      // We do this because the redirect might happen before the webhook DB update completes (race condition)
      let attempts = 0;
      const maxAttempts = 5;
      
      const checkStatus = async () => {
        const { data } = await supabase
          .from("payments")
          .select("*, plan_name")
          .eq("iyzico_token", token)
          .maybeSingle();

        if (data && data.status !== "pending") {
          setPaymentData(data);
          setStatus(data.status === "success" ? "success" : "failure");
          setLoading(false);
          return true;
        }
        return false;
      };

      const poll = async () => {
        const found = await checkStatus();
        if (!found && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1500); // Wait 1.5s then check again
        } else {
          setLoading(false);
          if (!found) {
             // If still not found, trust the URL param as fallback or show error
             setStatus(statusParam === "success" ? "success" : "failure");
          }
        }
      };

      poll();
    }

    verifyPayment();
  }, [token, statusParam]);

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

  const isSuccess = status === "success";

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 anime-in fade-in slide-in-from-bottom-8 duration-700">
      <Card className="overflow-hidden border-none shadow-sm bg-white/80 backdrop-blur-xl rounded-2xl">
        <div className={`h-3 w-full ${isSuccess ? "bg-emerald-500" : "bg-rose-500"}`} />
        
        <CardContent className="pt-12 pb-10 px-8 text-center">
          <div className="mb-8 flex justify-center">
            <div className={`relative h-24 w-24 flex items-center justify-center rounded-full animate-in zoom-in duration-500 ${
              isSuccess ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            }`}>
              <div className={`absolute inset-0 rounded-full blur-xl opacity-40 ${
                isSuccess ? "bg-emerald-500" : "bg-rose-500"
              }`} />
              {isSuccess ? (
                <CheckCircle2 className="h-12 w-12 stroke-[2.5]" />
              ) : (
                <XCircle className="h-12 w-12 stroke-[2.5]" />
              )}
            </div>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            {isSuccess ? "Ödeme Başarılı!" : "Ödeme Başarısız"}
          </h1>
          
          <p className="mt-4 text-lg font-bold text-slate-500 leading-relaxed max-w-md mx-auto">
            {isSuccess 
              ? `${paymentData?.plan_name ? `${paymentData.plan_name} paketiniz` : "Hizmetiniz"} başarıyla tanımlandı. OtoBurada'yı tercih ettiğiniz için teşekkür ederiz.`
              : "Ödeme işlemi sırasında bir hata oluştu veya bankanız tarafından reddedildi."}
          </p>

          {paymentData && (
            <div className="mt-10 p-6 rounded-3xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">İşlem Tutarı</span>
                <span className="text-lg font-bold text-slate-900">{paymentData.amount} ₺</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Referans No</span>
                <span className="text-xs font-bold text-slate-600 truncate block">{paymentData.id.split('-')[0]}</span>
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3">
            {isSuccess ? (
              <>
                <Button asChild className="h-14 rounded-2xl bg-blue-600 text-white font-bold uppercase tracking-widest shadow-sm shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <Link href="/dashboard/listings">
                    İlanlarıma Git
                    <ClipboardList className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
                  <Link href="/dashboard">
                    Panel Özetine Dön
                    <Home className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="h-14 rounded-2xl bg-rose-600 text-white font-bold uppercase tracking-widest shadow-sm shadow-rose-500/20 hover:bg-rose-700 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <button onClick={() => window.history.back()}>
                    Tekrar Dene
                    <Zap className="ml-2 h-5 w-5" />
                  </button>
                </Button>
                <Button asChild variant="ghost" className="h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
                  <Link href="/dashboard/pricing">
                    Paketlere Göz At
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </>
            )}
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
             <div className="text-[10px] font-bold text-slate-400">Canlı destek ekibimize ulaşın.</div>
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
    <Suspense fallback={
       <div className="flex items-center justify-center min-h-[60vh]">
         <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
       </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}

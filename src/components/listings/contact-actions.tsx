"use client";

import { useState } from "react";
import { Phone, MessageCircle, ShieldAlert, AlertTriangle, Eye, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { revealListingPhone } from "@/services/listings/listing-actions";

interface ContactActionsProps {
  listingId: string;
}

export function ContactActions({ listingId }: ContactActionsProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhone = (p: string) => {
    return p.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4");
  };

  const handleReveal = async () => {
    if (isRevealed || isLogging) return;
    
    setIsLogging(true);
    setError(null);
    try {
      const result = await revealListingPhone(listingId);
      setRevealedPhone(result.phone);
      setIsRevealed(true);
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu");
    } finally {
      setIsLogging(false);
    }
  };

  const whatsappLink = revealedPhone 
    ? `https://wa.me/${revealedPhone.replace(/\D/g, "")}?text=${encodeURIComponent("Merhaba, OtoBurada üzerinden ilanınızla ilgileniyorum.")}`
    : "#";

  return (
    <div className="space-y-3">
      {/* Phone Number Reveal */}
      <div className="relative group">
        {!isRevealed ? (
          <button
            onClick={handleReveal}
            disabled={isLogging}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 h-12 px-4 text-[15px] font-semibold text-white shadow-lg transition-all hover:bg-slate-800 disabled:opacity-70"
          >
            {isLogging ? (
              <Loader2 className="animate-spin size-5" />
            ) : (
              <>
                <Phone className="size-5" />
                Numarayı Göster
              </>
            )}
          </button>
        ) : (
          <a
            href={`tel:${revealedPhone}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 h-12 px-4 text-[15px] font-bold text-slate-900 border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
          >
            <Phone className="size-5 text-indigo-600" />
            {revealedPhone ? formatPhone(revealedPhone) : "N/A"}
          </a>
        )}
      </div>

      {/* WhatsApp Button with Safety Dialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 h-12 px-4 text-[15px] text-white font-semibold shadow-lg shadow-green-500/25 transition-all hover:from-green-600 hover:to-emerald-700 active:scale-95"
          >
            <MessageCircle className="size-5" />
            WhatsApp ile Mesaj Gönder
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-md bg-white border border-slate-200 rounded-3xl">
          <AlertDialogHeader className="text-left space-y-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <ShieldAlert className="size-7" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">
              Dolandırıcılık Uyarısı
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 space-y-4" asChild>
              <div className="space-y-4">
                <p>Güvenliğiniz için lütfen aşağıdaki kurallara uyun:</p>
                <div className="space-y-3 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex gap-3">
                    <AlertTriangle className="size-5 shrink-0 text-amber-500" />
                    <span><strong>Kapora Göndermeyin:</strong> Aracı görmeden, ekspertiz yaptırmadan kesinlikle ön ödeme yapmayın.</span>
                  </div>
                  <div className="flex gap-3">
                    <AlertTriangle className="size-5 shrink-0 text-amber-500" />
                    <span><strong>Resmi Satıcı:</strong> Ödemenizi sadece noter huzurunda, araç sahibi adına kayıtlı hesaba yapın.</span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="w-full sm:flex-1 h-12 rounded-xl border border-slate-200 text-slate-600 font-semibold">
              Vazgeç
            </AlertDialogCancel>
            <AlertDialogAction 
               asChild 
               className="w-full sm:flex-1 h-12 p-0 bg-transparent hover:bg-transparent"
               onClick={(e) => {
                 if (!isRevealed) {
                   e.preventDefault();
                   handleReveal();
                 }
               }}
             >
               <a
                 href={isRevealed ? whatsappLink : "#"}
                 target={isRevealed ? "_blank" : undefined}
                 rel="noreferrer"
                 className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 w-full h-12 px-6 text-[15px] text-white font-bold shadow-sm"
               >
                 {isLogging ? <Loader2 className="animate-spin size-4" /> : isRevealed ? "Mesaj Gönder" : "Numarayı Gör ve İlerle"}
                 <MessageCircle className="size-4" />
               </a>
             </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-[13px] font-medium bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
          <AlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

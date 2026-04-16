"use client";

import { useState } from "react";
import { Phone, MessageCircle, ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";
import { usePostHog } from "posthog-js/react";
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
import { getOrCreateChat } from "@/services/messages/chat-service";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface ContactActionsProps {
  listingId: string;
  listingSlug?: string;
  sellerId: string;
  /** Pass the current user's ID to hide contact actions on own listing */
  currentUserId?: string | null;
}

export function ContactActions({ listingId, listingSlug, sellerId, currentUserId }: ContactActionsProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const posthog = usePostHog();
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seller should not see contact actions on their own listing
  const isOwnListing = Boolean(currentUserId && currentUserId === sellerId);
  if (isOwnListing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs font-medium text-slate-500">
        Bu sizin ilanınız.
      </div>
    );
  }

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
      posthog?.capture("contact_phone_revealed", { listingId, sellerId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bir hata oluştu";
      setError(message);
    } finally {
      setIsLogging(false);
    }
  };

  const handleStartChat = async () => {
    setIsChatting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const returnPath = listingSlug ? `/listing/${listingSlug}` : "/listings";
        router.push(`/login?next=${encodeURIComponent(returnPath)}`);
        return;
      }

      if (user.id === sellerId) {
        setError("Kendi ilanınıza mesaj gönderemezsiniz.");
        return;
      }

      const chat = await getOrCreateChat(listingId, user.id, sellerId);
      if (chat) {
        posthog?.capture("chat_started", {
          chatId: chat.id,
          listingId,
          sellerId,
        });
        router.push(`/dashboard/messages?chatId=${chat.id}`);
      } else {
        setError("Sohbet başlatılırken bir sorun oluştu.");
      }
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setIsChatting(false);
    }
  };

  const whatsappLink = revealedPhone 
    ? `https://wa.me/${revealedPhone.replace(/\D/g, "")}?text=${encodeURIComponent("Merhaba, OtoBurada üzerinden ilanınızla ilgileniyorum.")}`
    : null;

  return (
    <div className="space-y-3">
      {/* Phone Number Reveal */}
      <div className="relative">
        {!isRevealed ? (
          <button
            onClick={handleReveal}
            disabled={isLogging}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-gray-300 h-12 px-4 text-[15px] font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-70"
          >
            {isLogging ? (
              <Loader2 className="animate-spin size-5" />
            ) : (
              <>
                <Phone className="size-5 text-blue-500" />
                Numarayı Göster
              </>
            )}
          </button>
        ) : (
          <a
            href={`tel:${revealedPhone}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-50 border border-gray-200 h-12 px-4 text-[15px] font-bold text-gray-900 animate-in fade-in zoom-in-95 duration-200"
          >
            <Phone className="size-5 text-blue-500" />
            {revealedPhone ? formatPhone(revealedPhone) : "N/A"}
          </a>
        )}
      </div>

      {/* WhatsApp Button with Safety Dialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-white h-12 px-4 text-[15px] font-bold border border-emerald-500 transition-all hover:bg-emerald-600 active:scale-95 shadow-md"
          >
            <MessageCircle className="size-5" />
            WhatsApp ile İletişime Geç
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
             >
               {isRevealed && whatsappLink ? (
                 <a
                   href={whatsappLink}
                   target="_blank"
                   rel="noreferrer"
                   onClick={() => posthog?.capture("contact_whatsapp_clicked", { listingId, sellerId })}
                   className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 w-full h-12 px-6 text-[15px] text-white font-bold shadow-sm"
                 >
                   Mesaj Gönder
                   <MessageCircle className="size-4" />
                 </a>
               ) : (
                 <button
                   type="button"
                   disabled={isLogging}
                   onClick={handleReveal}
                   className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 w-full h-12 px-6 text-[15px] text-white font-bold shadow-sm disabled:opacity-70"
                 >
                   {isLogging ? <Loader2 className="animate-spin size-4" /> : "Numarayı Gör ve İlerle"}
                   {!isLogging && <MessageCircle className="size-4" />}
                 </button>
               )}
             </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <button
        onClick={handleStartChat}
        disabled={isChatting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 h-12 px-4 text-[15px] font-bold text-blue-700 border border-blue-100 transition-all hover:bg-blue-100 active:scale-95 disabled:opacity-70"
      >
        {isChatting ? (
          <Loader2 className="animate-spin size-5" />
        ) : (
          <>
            <MessageCircle className="size-5" />
            Uygulama İçi Mesaj
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-[13px] font-medium bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
          <AlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

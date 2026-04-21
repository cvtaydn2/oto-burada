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
import { getSellerTrustUI } from "@/lib/utils/trust-ui";
import { trust } from "@/lib/constants/ui-strings";
import type { Profile } from "@/types";

interface ContactActionsProps {
  listingId: string;
  listingSlug?: string;
  sellerId: string;
  seller?: Partial<Profile> | null;
  /** Pass the current user's ID to hide contact actions on own listing */
  currentUserId?: string | null;
}

export function ContactActions({ listingId, listingSlug, sellerId, seller, currentUserId }: ContactActionsProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const posthog = usePostHog();
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isContactable } = getSellerTrustUI(seller);

  // Seller should not see contact actions on their own listing
  const isOwnListing = Boolean(currentUserId && currentUserId === sellerId);
  if (isOwnListing) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-3 text-center text-xs font-medium text-muted-foreground">
        Bu sizin ilanınız.
      </div>
    );
  }

  if (!isContactable) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
        <p className="text-xs font-bold text-amber-900 mb-1 leading-tight">{trust.contactBlocked}</p>
        <p className="text-[10px] text-amber-700 leading-relaxed font-semibold uppercase tracking-wide">
          {trust.contactBlockedDesc}
        </p>
      </div>
    );
  }

  // Guest kullanıcı — telefon numarası için giriş yönlendirmesi
  const isGuest = !currentUserId;
  const returnPath = listingSlug ? `/listing/${listingSlug}` : "/listings";

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
          isGuest ? (
            // Guest: giriş yap butonu göster
            <button
              onClick={() => router.push(`/login?next=${encodeURIComponent(returnPath)}`)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-card border border-border h-12 px-4 text-sm font-bold text-foreground hover:bg-muted transition-all active:scale-95"
            >
              <Phone className="size-5 text-primary" />
              Numarayı Görmek İçin Giriş Yap
            </button>
          ) : (
            <button
              onClick={handleReveal}
              disabled={isLogging}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-card border border-border h-12 px-4 text-sm font-bold text-foreground hover:bg-muted transition-all active:scale-95 disabled:opacity-70"
            >
              {isLogging ? (
                <Loader2 className="animate-spin size-5" />
              ) : (
                <>
                  <Phone className="size-5 text-primary" />
                  Numarayı Göster
                </>
              )}
            </button>
          )
        ) : (
          <a
            href={`tel:${revealedPhone}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted border border-border h-12 px-4 text-sm font-bold text-foreground"
          >
            <Phone className="size-5 text-primary" />
            {revealedPhone ? formatPhone(revealedPhone) : "N/A"}
          </a>
        )}
      </div>

      {/* WhatsApp Button with Safety Dialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white h-12 px-4 text-sm font-bold border border-[#25D366] transition-all hover:bg-[#1fb355] active:scale-95 shadow-sm"
          >
            <MessageCircle className="size-5" />
            WhatsApp ile İletişime Geç
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-md bg-card border border-border rounded-3xl">
          <AlertDialogHeader className="text-left space-y-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <ShieldAlert className="size-7" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              Dolandırıcılık Uyarısı
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground space-y-4" asChild>
              <div className="space-y-4">
                <p>Güvenliğiniz için lütfen aşağıdaki kurallara uyun:</p>
                <div className="space-y-3 text-sm text-foreground/90 bg-muted/30 p-4 rounded-xl border border-border">
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
            <AlertDialogCancel className="w-full sm:flex-1 h-12 rounded-xl border border-border text-muted-foreground font-semibold">
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
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted h-12 px-4 text-sm font-bold text-foreground border border-border transition-all hover:bg-muted/80 active:scale-95 disabled:opacity-70"
      >
        {isChatting ? (
          <Loader2 className="animate-spin size-5" />
        ) : (
          <>
            <MessageCircle className="size-5 text-primary" />
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

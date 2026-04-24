"use client";

import { AlertTriangle, Loader2, MessageCircle, Phone, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trust } from "@/lib/constants/ui-strings";
import { captureClientEvent } from "@/lib/monitoring/posthog-client";
import { cn } from "@/lib/utils";
import { getSellerTrustUI } from "@/lib/utils/trust-ui";
import { revealListingPhone } from "@/services/listings/listing-actions";
import type { Profile } from "@/types";

interface ContactActionsProps {
  listingId: string;
  listingSlug?: string;
  sellerId: string;
  seller?: Partial<Profile> | null;
  /** Pass the current user's ID to hide contact actions on own listing */
  currentUserId?: string | null;
}

export function ContactActions({
  listingId,
  listingSlug,
  sellerId,
  seller,
  currentUserId,
}: ContactActionsProps) {
  const router = useRouter();
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  const { isContactable, isTrusted } = getSellerTrustUI(seller);

  // Seller should not see contact actions on their own listing
  const isOwnListing = Boolean(currentUserId && currentUserId === sellerId);
  if (isOwnListing) {
    const { label, subMessage, tone } = getSellerTrustUI(seller);
    const hasIssues = !isContactable;

    return (
      <div
        className={cn(
          "rounded-xl border p-3 text-center transition-all",
          hasIssues
            ? tone === "amber"
              ? "bg-amber-50 border-amber-100 text-amber-700"
              : "bg-rose-50 border-rose-100 text-rose-700"
            : "bg-muted/30 border-border text-muted-foreground"
        )}
      >
        <p className="text-xs font-bold uppercase tracking-tight mb-1">Bu Sizin İlanınız</p>
        {hasIssues && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</p>
            <p className="text-[10px] leading-relaxed font-medium">{subMessage}</p>
          </div>
        )}
      </div>
    );
  }

  if (!isContactable) {
    const { label, subMessage } = getSellerTrustUI(seller);
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
        <p className="text-xs font-bold text-amber-900 mb-1 leading-tight">{label}</p>
        <p className="text-[10px] text-amber-700 leading-relaxed font-semibold uppercase tracking-wide">
          {subMessage || trust.contactBlockedDesc}
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
    try {
      const result = await revealListingPhone(listingId);
      setRevealedPhone(result.phone);
      setIsRevealed(true);
      captureClientEvent("contact_phone_revealed", { listingId, sellerId });
    } catch {
      // Silently fail or log to monitoring
    } finally {
      setIsLogging(false);
    }
  };

  const whatsappLink = revealedPhone
    ? `https://wa.me/${revealedPhone.replace(/\D/g, "")}?text=${encodeURIComponent("Merhaba, OtoBurada üzerinden ilanınızla ilgileniyorum.")}`
    : null;

  return (
    <div className="space-y-3">
      {/* Trust Signal Reassurance */}
      {isTrusted && !isRevealed && (
        <div className="flex items-center gap-2 mb-2 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
          <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
            Güvenilir Satıcı Bağlantısı Aktif
          </p>
        </div>
      )}

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
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white h-12 px-4 text-sm font-bold border border-[#25D366] transition-all hover:bg-[#1fb355] active:scale-95 shadow-sm">
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
                    <span>
                      <strong>Kapora Göndermeyin:</strong> Aracı görmeden, ekspertiz yaptırmadan
                      kesinlikle ön ödeme yapmayın.
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <AlertTriangle className="size-5 shrink-0 text-amber-500" />
                    <span>
                      <strong>Resmi Satıcı:</strong> Ödemenizi sadece noter huzurunda, araç sahibi
                      adına kayıtlı hesaba yapın.
                    </span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="w-full sm:flex-1 h-12 rounded-xl border border-border text-muted-foreground font-semibold">
              Vazgeç
            </AlertDialogCancel>
            {isRevealed && whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  captureClientEvent("contact_whatsapp_clicked", { listingId, sellerId })
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 w-full sm:flex-1 h-12 px-6 text-[15px] text-white font-bold shadow-sm"
              >
                Mesaj Gönder
                <MessageCircle className="size-4" />
              </a>
            ) : (
              <button
                type="button"
                disabled={isLogging}
                onClick={handleReveal}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 w-full sm:flex-1 h-12 px-6 text-[15px] text-white font-bold shadow-sm disabled:opacity-70"
              >
                {isLogging ? <Loader2 className="animate-spin size-4" /> : "Numarayı Gör ve İlerle"}
                {!isLogging && <MessageCircle className="size-4" />}
              </button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

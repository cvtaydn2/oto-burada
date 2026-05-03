"use client";

import {
  AlertTriangle,
  Loader2,
  MessageCircle,
  MessageSquare,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { revealListingPhone } from "@/app/dashboard/listings/actions";
import { OfferPanel } from "@/components/offers/offer-panel";
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
import { getSellerTrustUI } from "@/lib/listings/trust-ui";
import { captureClientEvent } from "@/lib/monitoring/telemetry-client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

interface ContactActionsProps {
  listingId: string;
  listingSlug?: string;
  sellerId: string;
  seller?: Partial<Profile> | null;
  listingTitle?: string;
  listingPrice?: number;
  currentUserId?: string | null;
}

export function ContactActions({
  listingId,
  listingSlug,
  sellerId,
  seller,
  listingTitle,
  listingPrice,
  currentUserId,
}: ContactActionsProps) {
  const router = useRouter();
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  const { isContactable, isTrusted } = getSellerTrustUI(seller);

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
              ? "border-amber-100 bg-amber-50 text-amber-700"
              : "border-rose-100 bg-rose-50 text-rose-700"
            : "border-border bg-muted/30 text-muted-foreground"
        )}
      >
        <p className="mb-1 text-xs font-bold uppercase tracking-tight">Bu Sizin İlanınız</p>
        {hasIssues && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</p>
            <p className="text-[10px] font-medium leading-relaxed">{subMessage}</p>
          </div>
        )}
      </div>
    );
  }

  if (!isContactable) {
    const { label, subMessage } = getSellerTrustUI(seller);
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
        <p className="mb-1 text-xs font-bold leading-tight text-amber-900">{label}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 leading-relaxed">
          {subMessage || trust.contactBlockedDesc}
        </p>
      </div>
    );
  }

  const formatPhone = (p: string) => {
    const clean = p.replace(/\D/g, "");
    if (clean.length === 12 && clean.startsWith("90")) {
      return `+90 ${clean.slice(2, 5)} ${clean.slice(5, 8)} ${clean.slice(8, 10)} ${clean.slice(10, 12)}`;
    }
    if (clean.length === 10) {
      return `0${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 10)}`;
    }
    return p;
  };

  const handleReveal = async () => {
    if (isRevealed || isLogging) return;

    setIsLogging(true);
    try {
      const result = await revealListingPhone(listingId);
      setRevealedPhone(result.phone);
      setIsRevealed(true);
      captureClientEvent("contact_phone_revealed", { listingId, sellerId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Numara gösterilirken bir hata oluştu.";
      toast.error(message);
    } finally {
      setIsLogging(false);
    }
  };

  const whatsappLink = revealedPhone
    ? `https://wa.me/${revealedPhone.replace(/\D/g, "")}?text=${encodeURIComponent("Merhaba, OtoBurada üzerinden ilanınızla ilgileniyorum.")}`
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 rounded-2xl border border-indigo-100/50 bg-indigo-50/50 p-3 group">
        <div className="flex size-8 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm transition-transform group-hover:scale-110">
          <ShieldAlert className="size-4" />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest leading-none text-indigo-700">
            Güvenli İletişim
          </p>
          <p className="text-[11px] font-medium leading-none text-indigo-600/70">
            WhatsApp öncelikli. Numara spam korumalı gösterilir.
          </p>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            disabled={isLogging && !isRevealed}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#25D366] bg-[#25D366] px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1fb355] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <MessageCircle className="size-5" />
            {isRevealed ? "WhatsApp ile İletişime Geç" : "WhatsApp ile Yaz"}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-md rounded-3xl border border-border bg-card">
          <AlertDialogHeader className="space-y-3 text-left">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600">
              <ShieldAlert className="size-7" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              Dolandırıcılık Uyarısı
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-muted-foreground" asChild>
              <div className="space-y-4">
                <p>Güvenliğiniz için lütfen aşağıdaki kurallara uyun:</p>
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground/90">
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
          <AlertDialogFooter className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AlertDialogCancel className="h-12 w-full border border-border font-semibold text-muted-foreground sm:flex-1">
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
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 text-[15px] font-bold text-white shadow-sm sm:flex-1"
              >
                WhatsApp&apos;tan Yaz
                <MessageCircle className="size-4" />
              </a>
            ) : (
              <button
                type="button"
                disabled={isLogging}
                onClick={() => {
                  if (!isRevealed) {
                    void handleReveal();
                  }
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 text-[15px] font-bold text-white shadow-sm disabled:opacity-70 sm:flex-1"
              >
                {isLogging ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isRevealed ? (
                  "WhatsApp'tan Yaz"
                ) : (
                  "Numarayı Gör"
                )}
                {!isLogging && <MessageCircle className="size-4" />}
              </button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!isOwnListing && currentUserId && (
        <button
          onClick={() => {
            router.push(`/dashboard/messages?new=${listingId}&seller=${sellerId}`);
            captureClientEvent("contact_chat_clicked", { listingId, sellerId });
          }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-600 bg-blue-600 px-4 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95"
        >
          <MessageSquare className="size-5" />
          Mesaj Gönder
        </button>
      )}

      {isTrusted && !isRevealed && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-emerald-100/50 bg-emerald-50/50 p-3">
          <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
            Güvenilir Satıcı Bağlantısı Aktif
          </p>
        </div>
      )}

      <div className="relative">
        {!isRevealed ? (
          <button
            onClick={handleReveal}
            disabled={isLogging}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-70"
          >
            {isLogging ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <Phone className="size-5 text-primary" />
                Numarayı Göster
              </>
            )}
          </button>
        ) : (
          <a
            href={`tel:${revealedPhone}`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 text-sm font-bold text-foreground"
          >
            <Phone className="size-5 text-primary" />
            {revealedPhone ? formatPhone(revealedPhone) : "N/A"}
          </a>
        )}
      </div>

      {listingTitle && listingPrice && listingSlug && (
        <OfferPanel
          listingId={listingId}
          listingTitle={listingTitle}
          listingSlug={listingSlug}
          currentPrice={listingPrice}
          currentUserId={currentUserId}
          sellerId={sellerId}
        />
      )}
    </div>
  );
}

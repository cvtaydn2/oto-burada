"use client";

import {
  AlertTriangle,
  Copy,
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
import { Button } from "@/components/ui/button";
import { getSellerTrustUI } from "@/features/marketplace/lib/trust-ui";
import { OfferPanel } from "@/features/offers/components/offer-panel";
import { captureClientEvent } from "@/lib/telemetry-client";
import { trust } from "@/lib/ui-strings";
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
  reportHref?: string;
  surface?: "default" | "sticky";
}

interface FirstMessageGuideItem {
  emphasis?: string;
  text: string;
}

const WHATSAPP_MESSAGE = "Merhaba, OtoBurada üzerinden ilanınızla ilgileniyorum.";

function getFirstMessageGuide(options: {
  isProfessional: boolean;
  isTrusted: boolean;
  isRevealed: boolean;
}) {
  const lead = options.isProfessional
    ? "Kurumsal satıcıyla ilk temasta"
    : options.isTrusted
      ? "İlk mesajda"
      : "WhatsApp'a geçmeden önce";

  const items: FirstMessageGuideItem[] = [
    options.isProfessional
      ? {
          emphasis: "Araç hazır mı?",
          text: "Ekspertiz, bakım geçmişi ve güncel durumun hâlâ ilandaki gibi olup olmadığını net sor.",
        }
      : {
          emphasis: "Durum özeti iste:",
          text: "Son ekspertiz, hasar beyanı ve Tramer bilgisini tek mesajda teyit et.",
        },
    options.isRevealed
      ? {
          emphasis: "Ziyaret planını netleştir:",
          text: "Aracı ne zaman görebileceğini ve görüşmede ruhsat sahibiyle ilerlenip ilerlenmeyeceğini sor.",
        }
      : {
          emphasis: "Görüşme zemini kur:",
          text: "Aracı görme zamanı ve bulunduğu konumu kısa biçimde sorarak ilk teması netleştir.",
        },
    {
      emphasis: "Fiyatı bağlama oturt:",
      text: options.isProfessional
        ? "İlandaki fiyatın bakım, donanım veya garanti tarafında hangi noktaya dayandığını öğren."
        : "Fiyatta pazarlık payı ya da son dönemde yapılan masraf olup olmadığını kısaca sor.",
    },
  ];

  return {
    lead,
    items,
  };
}

function formatPhoneNumber(phone: string) {
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 12 && clean.startsWith("90")) {
    return `+90 ${clean.slice(2, 5)} ${clean.slice(5, 8)} ${clean.slice(8, 10)} ${clean.slice(10, 12)}`;
  }
  if (clean.length === 10) {
    return `0${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 10)}`;
  }
  return phone;
}

function normalizeWhatsAppPhone(phone: string) {
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 11 && clean.startsWith("0")) {
    return `90${clean.slice(1)}`;
  }
  if (clean.length === 10 && clean.startsWith("5")) {
    return `90${clean}`;
  }
  if (clean.length === 12 && clean.startsWith("90")) {
    return clean;
  }
  return clean;
}

function getWhatsappLink(phone: string) {
  const normalized = normalizeWhatsAppPhone(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
}

function getWhatsAppFallbackLink(phone: string) {
  const normalized = normalizeWhatsAppPhone(phone);
  return `https://web.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
}

export function ContactActions({
  listingId,
  listingSlug,
  sellerId,
  seller,
  listingTitle,
  listingPrice,
  currentUserId,
  reportHref = "#ilan-bildir",
  surface = "default",
}: ContactActionsProps) {
  const router = useRouter();
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  const trustUI = getSellerTrustUI(seller);
  const { isContactable, isTrusted, label, subMessage, tone } = trustUI;
  const isSticky = surface === "sticky";
  const firstMessageGuide = getFirstMessageGuide({
    isProfessional: trustUI.isProfessional,
    isTrusted,
    isRevealed,
  });

  const isOwnListing = Boolean(currentUserId && currentUserId === sellerId);
  if (isOwnListing) {
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
        <p className="mb-1 text-xs font-bold uppercase tracking-tight">Bu sizin ilanınız</p>
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
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
        <p className="mb-1 text-xs font-bold leading-tight text-amber-900">{label}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide leading-relaxed text-amber-700">
          {subMessage || trust.contactBlockedDesc}
        </p>
      </div>
    );
  }

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

  const whatsappLink = revealedPhone ? getWhatsappLink(revealedPhone) : null;
  const whatsappWebLink = revealedPhone ? getWhatsAppFallbackLink(revealedPhone) : null;
  const isMobile = typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);
  const finalWhatsAppLink = whatsappLink ? (isMobile ? whatsappLink : whatsappWebLink) : null;

  return (
    <div className={cn("space-y-3", !isSticky && "lg:space-y-3.5")}>
      <div
        className={cn(
          "rounded-2xl border p-3",
          isSticky ? "border-emerald-100 bg-emerald-50/70" : "border-indigo-100/60 bg-indigo-50/60"
        )}
      >
        <div className="flex items-start gap-2.5">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-xl shadow-sm",
              isSticky ? "bg-white text-emerald-600" : "bg-white text-indigo-600"
            )}
          >
            <ShieldAlert className="size-4" />
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "mb-1 text-[10px] font-bold uppercase tracking-widest leading-none",
                isSticky ? "text-emerald-700" : "text-indigo-700"
              )}
            >
              Güvenli iletişim akışı
            </p>
            <p
              className={cn(
                "text-[11px] font-medium leading-5",
                isSticky ? "text-emerald-800/80" : "text-indigo-700/80"
              )}
            >
              Önce WhatsApp ile yaz, ardından gerekirse numarayı görerek aramaya geç.
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "rounded-2xl border p-3",
          isSticky ? "border-white/70 bg-white/90" : "border-border/70 bg-background/90"
        )}
      >
        <div className="flex items-start gap-2.5">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-xl border shadow-sm",
              isSticky
                ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                : "border-indigo-100 bg-indigo-50 text-indigo-600"
            )}
          >
            <MessageSquare className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">İlk Mesaj Rehberi</p>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]",
                  isSticky ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                )}
              >
                WhatsApp öncesi
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {firstMessageGuide.lead} şu 3 kısa başlık yeterli olur.
            </p>
            <div className="mt-2.5 space-y-2">
              {firstMessageGuide.items.map((item) => (
                <div
                  key={`${item.emphasis ?? item.text}-${item.text}`}
                  className="flex items-start gap-2"
                >
                  <span
                    className={cn(
                      "mt-1 inline-block size-1.5 shrink-0 rounded-full",
                      isSticky ? "bg-emerald-500" : "bg-indigo-500"
                    )}
                    aria-hidden="true"
                  />
                  <p className="text-[11px] leading-5 text-foreground/90">
                    {item.emphasis ? (
                      <span className="font-semibold text-foreground">{item.emphasis} </span>
                    ) : null}
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            disabled={isLogging && !isRevealed}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#25D366] bg-[#25D366] px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1fb355] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <MessageCircle className="size-5" />
            {isRevealed ? "WhatsApp ile Hemen Yaz" : "WhatsApp ile Yaz"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-md rounded-3xl border border-border bg-card">
          <AlertDialogHeader className="space-y-3 text-left">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600">
              <ShieldAlert className="size-7" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              Güvenli iletişim hatırlatması
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-muted-foreground" asChild>
              <div className="space-y-4">
                <p>İletişime geçmeden önce şu iki adımı akılda tut:</p>
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground/90">
                  <div className="flex gap-3">
                    <AlertTriangle className="size-5 shrink-0 text-amber-500" />
                    <span>
                      <strong>Kapora göndermeyin:</strong> Aracı görmeden ve ekspertiz sürecini
                      netleştirmeden ön ödeme yapmayın.
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <AlertTriangle className="size-5 shrink-0 text-amber-500" />
                    <span>
                      <strong>Ödemeyi resmi devirle eşleştirin:</strong> Noter ve ruhsat sahibi
                      teyidi olmadan işlem tamamlamayın.
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
            {isRevealed && finalWhatsAppLink ? (
              <a
                href={finalWhatsAppLink}
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
              <Button
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
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {(isTrusted || trustUI.isProfessional) && !isRevealed ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-100/70 bg-emerald-50/60 px-3 py-2">
          <div className="size-2 rounded-full bg-emerald-500" />
          <p className="text-[11px] font-medium text-emerald-800">
            {trustUI.isProfessional
              ? "Kurumsal satıcı profili görünür durumda."
              : "Satıcı değerlendirmeleri güven sinyali olarak görünür durumda."}
          </p>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        {!isRevealed ? (
          <Button
            onClick={handleReveal}
            disabled={isLogging}
            variant="outline"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-all hover:bg-muted active:scale-95 disabled:opacity-70"
          >
            {isLogging ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <Phone className="size-5 text-primary" />
                Numarayı Göster
              </>
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-2 sm:col-span-2">
            <a
              href={`tel:${revealedPhone}`}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 text-sm font-bold text-foreground"
            >
              <Phone className="size-5 text-primary" />
              {revealedPhone ? formatPhoneNumber(revealedPhone) : "N/A"}
            </a>
            <button
              type="button"
              onClick={() => {
                if (revealedPhone) {
                  navigator.clipboard.writeText(revealedPhone.replace(/\D/g, ""));
                  toast.success("Numara panoya kopyalandı");
                }
              }}
              aria-label="Numarayı kopyala"
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:bg-muted active:scale-95"
            >
              <Copy size={18} />
            </button>
          </div>
        )}

        {!isOwnListing && currentUserId ? (
          <Button
            onClick={() => {
              router.push(`/dashboard/messages?new=${listingId}&seller=${sellerId}`);
              captureClientEvent("contact_chat_clicked", { listingId, sellerId });
            }}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition-all active:scale-95",
              isSticky ? "bg-slate-700 hover:bg-slate-800" : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            <MessageSquare className="size-5" />
            Mesaj Gönder
          </Button>
        ) : null}
      </div>

      <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-medium leading-5 text-muted-foreground">
            Şüpheli bir durum fark edersen ilanı sakin biçimde moderasyona iletebilirsin.
          </p>
          <a
            href={reportHref}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            İlanı bildir
          </a>
        </div>
      </div>

      {listingTitle && listingPrice && listingSlug && !isSticky ? (
        <div className="hidden lg:block">
          <OfferPanel
            listingId={listingId}
            listingTitle={listingTitle}
            listingSlug={listingSlug}
            currentPrice={listingPrice}
            currentUserId={currentUserId}
            sellerId={sellerId}
          />
        </div>
      ) : null}
    </div>
  );
}

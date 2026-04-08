"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { getListingCardInsights } from "@/services/listings/listing-card-insights";
import type { Listing } from "@/types";

interface AdminListingsModerationProps {
  pendingListings: Listing[];
}

export function AdminListingsModeration({ pendingListings }: AdminListingsModerationProps) {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notesByListingId, setNotesByListingId] = useState<Record<string, string>>({});

  if (pendingListings.length === 0) {
    return (
      <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Moderasyon</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">Bekleyen ilan yok</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Yeni ilanlar geldikce burada inceleme sirasi olusacak.
        </p>
      </section>
    );
  }

  const handleModeration = async (listingId: string, action: "approve" | "reject") => {
    setActiveAction(`${listingId}:${action}`);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/listings/${listingId}/moderate`, {
        body: JSON.stringify({
          action,
          note: notesByListingId[listingId]?.trim() || undefined,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = await response.json().catch(() => null) as { success?: boolean; error?: { message: string } } | null;

      if (!response.ok || !payload?.success) {
        setErrorMessage(payload?.error?.message ?? "Moderasyon işlemi tamamlanamadı.");
        return;
      }

      setNotesByListingId((current) => ({
        ...current,
        [listingId]: "",
      }));
      router.refresh();
    } catch {
      setErrorMessage("Bağlantı sırasında bir hata oluştu. Lütfen tekrar dene.");
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Moderasyon</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Bekleyen ilanlar</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Ilanlari kontrol ederek yayinlama ya da reddetme kararini buradan verebilirsin.
          </p>
        </div>
        <div className="rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground">
          {pendingListings.length} ilan bekliyor
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4">
        {pendingListings.map((listing) => {
          const approving = activeAction === `${listing.id}:approve`;
          const rejecting = activeAction === `${listing.id}:reject`;
          const actionBusy = approving || rejecting;
          const insight = getListingCardInsights(listing);
          const toneClasses = {
            amber: "border-amber-100 bg-gradient-to-r from-amber-50 to-background text-amber-700",
            emerald:
              "border-emerald-100 bg-gradient-to-r from-emerald-50 to-background text-emerald-700",
            indigo: "border-primary/10 bg-gradient-to-r from-primary/10 to-background text-primary",
          }[insight.tone];

          return (
            <article
              key={listing.id}
              className="rounded-[1.75rem] border border-border/70 bg-background p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {listing.title}
                    </h3>
                    <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      Incelemede
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses}`}
                    >
                      {insight.badgeLabel}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
                    <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1.5">
                      {formatCurrency(listing.price)}
                    </span>
                    <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1.5">
                      {listing.year}
                    </span>
                    <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1.5">
                      {formatNumber(listing.mileage)} km
                    </span>
                    <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1.5">
                      {listing.city} / {listing.district}
                    </span>
                    <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1.5">
                      {listing.images.length} fotograf
                    </span>
                  </div>

                  <div className={`rounded-[1.25rem] border p-4 ${toneClasses}`}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Sparkles className="size-4" />
                      Hizli moderasyon ozeti
                    </div>
                    <p className="mt-2 text-sm leading-6 text-foreground/90">{insight.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {insight.highlights.map((highlight) => (
                        <span
                          key={`${listing.id}-${highlight}`}
                          className="rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs font-semibold text-foreground"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {listing.description}
                  </p>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Gonderim tarihi</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {formatDate(listing.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                      <p className="text-xs text-muted-foreground">WhatsApp</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {listing.whatsappPhone}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Konum</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <MapPin className="size-4 text-primary" />
                        {listing.city} / {listing.district}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                    <label
                      htmlFor={`listing-note-${listing.id}`}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Moderasyon notu
                    </label>
                    <textarea
                      id={`listing-note-${listing.id}`}
                      value={notesByListingId[listing.id] ?? ""}
                      onChange={(event) =>
                        setNotesByListingId((current) => ({
                          ...current,
                          [listing.id]: event.target.value,
                        }))
                      }
                      placeholder="Opsiyonel not: neden onaylandi veya reddedildi?"
                      rows={3}
                      className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Not girersen en az 3 karakter olmali ve audit kaydina eklenir.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/listing/${listing.slug}`}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <ArrowRight className="size-4" />
                      Public ilani ac
                    </Link>
                    <a
                      href={`https://wa.me/${listing.whatsappPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <MessageCircle className="size-4" />
                      WhatsApp kontrolu
                    </a>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:w-44 lg:flex-col">
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void handleModeration(listing.id, "approve")}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {approving ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    Onayla
                  </button>

                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void handleModeration(listing.id, "reject")}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {rejecting ? <LoaderCircle className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                    Reddet
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

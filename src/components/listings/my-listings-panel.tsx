"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, LoaderCircle, PencilLine } from "lucide-react";
import { useState } from "react";

import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import type { Listing } from "@/types";

interface MyListingsPanelProps {
  activeEditId?: string;
  listings: Listing[];
}

const statusLabelMap: Record<Listing["status"], string> = {
  approved: "Yayinda",
  archived: "Arsivde",
  draft: "Taslak",
  pending: "Incelemede",
  rejected: "Reddedildi",
};

const statusClassMap: Record<Listing["status"], string> = {
  approved: "bg-primary/10 text-primary",
  archived: "bg-muted text-muted-foreground",
  draft: "bg-amber-100 text-amber-700",
  pending: "bg-sky-100 text-sky-700",
  rejected: "bg-destructive/10 text-destructive",
};

export function MyListingsPanel({ activeEditId, listings }: MyListingsPanelProps) {
  const router = useRouter();
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (listings.length === 0) {
    return (
      <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Ilanlarim</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight">Henuz ilanin yok</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Asagidaki form ile ilk arabanı eklediginde moderasyon durumunu burada goreceksin.
        </p>
      </section>
    );
  }

  const handleArchive = async (listingId: string) => {
    setArchivingId(listingId);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/listings/${listingId}/archive`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setErrorMessage(payload?.message ?? "Ilan arsivlenemedi.");
        return;
      }

      if (activeEditId === listingId) {
        router.replace("/dashboard/listings");
      }
      router.refresh();
    } catch {
      setErrorMessage("Baglanti sirasinda bir hata olustu. Lutfen tekrar dene.");
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Ilanlarim</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">Tum ilanlarin tek yerde</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Sadece sana ait ilanlar gorunur. Incelemede olan ilanlari duzenleyebilir, gerektiginde
            arsive alabilirsin.
          </p>
        </div>
        <div className="rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground">
          Toplam {listings.length} ilan
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4">
        {listings.map((listing) => {
          const isEditable = listing.status === "draft" || listing.status === "pending";
          const isArchiving = archivingId === listing.id;

          return (
            <article
              key={listing.id}
              className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-lg font-semibold tracking-tight text-foreground">
                      {listing.title}
                    </h4>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[listing.status]}`}
                    >
                      {statusLabelMap[listing.status]}
                    </span>
                    {activeEditId === listing.id ? (
                      <span className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                        Duzenleniyor
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
                    <span className="rounded-full bg-background px-3 py-1.5">{listing.year}</span>
                    <span className="rounded-full bg-background px-3 py-1.5">
                      {formatNumber(listing.mileage)} km
                    </span>
                    <span className="rounded-full bg-background px-3 py-1.5">
                      {listing.city} / {listing.district}
                    </span>
                    <span className="rounded-full bg-background px-3 py-1.5">
                      {listing.images.length} fotograf
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-background px-4 py-3">
                      <p className="text-xs text-muted-foreground">Fiyat</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {formatCurrency(listing.price)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-background px-4 py-3">
                      <p className="text-xs text-muted-foreground">Olusturma</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {formatDate(listing.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-background px-4 py-3">
                      <p className="text-xs text-muted-foreground">Son guncelleme</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {formatDate(listing.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                  {isEditable ? (
                    <Link
                      href={`/dashboard/listings?edit=${listing.id}`}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <PencilLine className="size-4" />
                      Duzenle
                    </Link>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => void handleArchive(listing.id)}
                    disabled={listing.status === "archived" || isArchiving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isArchiving ? <LoaderCircle className="size-4 animate-spin" /> : <Archive className="size-4" />}
                    Arsive Al
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

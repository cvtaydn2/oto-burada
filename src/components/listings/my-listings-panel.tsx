"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArrowRight, Loader2, Pencil, Car } from "lucide-react";
import { useState } from "react";

import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Listing } from "@/types";

interface MyListingsPanelProps {
  activeEditId?: string;
  listings: Listing[];
}

const statusLabelMap: Record<Listing["status"], string> = {
  approved: "Yayında",
  archived: "Arşivde",
  draft: "Taslak",
  pending: "Bekliyor",
  rejected: "Reddedildi",
};

const statusClassMap: Record<Listing["status"], string> = {
  approved: "bg-green-50 text-green-700 border-green-200",
  archived: "bg-muted text-muted-foreground border-border",
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-blue-50 text-blue-700 border-blue-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export function MyListingsPanel({ activeEditId, listings }: MyListingsPanelProps) {
  const router = useRouter();
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <Car className="mx-auto size-10 text-muted-foreground/40" />
        <h3 className="mt-3 text-base font-medium">Henüz ilanın yok</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Aşağıdaki form ile ilk arabanı ekle
        </p>
      </div>
    );
  }

  const handleArchive = async (listingId: string) => {
    setArchivingId(listingId);
    setArchiveError(null);

    try {
      const response = await fetch(`/api/listings/${listingId}/archive`, { method: "POST" });
      const payload = await response.json().catch(() => null) as { success?: boolean; error?: { message: string } } | null;

      if (!response.ok || !payload?.success) {
        setArchiveError(payload?.error?.message ?? "İlan arşive alınamadı. Lütfen tekrar dene.");
        return;
      }

      router.refresh();
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-muted-foreground">
          {listings.length} ilan
        </h3>
      </div>

      {archiveError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {archiveError}
        </p>
      ) : null}

      <div className="divide-y divide-border/60">
        {listings.map((listing) => {
          const isEditable = listing.status === "draft" || listing.status === "pending";
          const isArchiving = archivingId === listing.id;
          const isActive = activeEditId === listing.id;

          return (
            <article
              key={listing.id}
              className={`py-3 first:pt-0 last:pb-0 ${isActive ? "bg-primary/5 -mx-4 px-4 rounded-lg" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${statusClassMap[listing.status]}`}>
                      {statusLabelMap[listing.status]}
                    </span>
                    <span className="font-medium text-sm truncate">{listing.title}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{listing.year}</span>
                    <span>•</span>
                    <span>{formatNumber(listing.mileage)} km</span>
                    <span>•</span>
                    <span>{listing.city}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold">
                    {formatCurrency(listing.price)}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isEditable && (
                    <Link
                      href={`/dashboard/listings?edit=${listing.id}`}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                      title="Düzenle"
                    >
                      <Pencil className="size-4" />
                    </Link>
                  )}
                  <Link
                    href={`/listing/${listing.slug}`}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    title="Görüntüle"
                  >
                    <ArrowRight className="size-4" />
                  </Link>
                  {listing.status !== "archived" && (
                    <button
                      type="button"
                      onClick={() => void handleArchive(listing.id)}
                      disabled={isArchiving}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg disabled:opacity-50"
                      title="Arşivle"
                    >
                      {isArchiving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Archive className="size-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

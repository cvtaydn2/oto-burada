"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Archive, ArrowUpCircle, Loader2, Pencil, Plus, Rocket, RotateCcw, X } from "lucide-react";

import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Listing } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ListingDopingPanel } from "./listing-doping-panel";

interface MyListingsPanelProps {
  activeEditId?: string;
  listings: Listing[];
  children?: React.ReactNode;
}

const statusLabelMap: Record<Listing["status"], string> = {
  approved: "Yayında",
  archived: "Arşivde",
  draft: "Taslak",
  pending: "Bekliyor",
  rejected: "Reddedildi",
};

const statusClassMap: Record<Listing["status"], string> = {
  approved: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-gray-100 text-gray-600 border-gray-200",
  draft: "bg-amber-100 text-amber-800 border-amber-200",
  pending: "bg-blue-100 text-blue-800 border-blue-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

export function MyListingsPanel({ activeEditId, listings, children }: MyListingsPanelProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(!!activeEditId);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [bumpingId, setBumpingId] = useState<string | null>(null);
  const [bumpMessage, setBumpMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const handleArchive = async (listingId: string) => {
    setArchivingId(listingId);
    setArchiveError(null);

    try {
      const response = await fetch(`/api/listings/${listingId}/archive`, { method: "POST" });
      const payload = await response.json().catch(() => null) as { success?: boolean; error?: { message: string } } | null;

      if (!response.ok || !payload?.success) {
        setArchiveError(payload?.error?.message ?? "İlan arşive alınamadı.");
        return;
      }

      router.refresh();
    } finally {
      setArchivingId(null);
    }
  };

  const handleBump = async (listingId: string) => {
    setBumpingId(listingId);
    setBumpMessage(null);

    try {
      const response = await fetch(`/api/listings/${listingId}/bump`, { method: "POST" });
      const payload = await response.json().catch(() => null) as { success?: boolean; message?: string; error?: { message: string } } | null;

      if (!response.ok || !payload?.success) {
        setBumpMessage(payload?.error?.message ?? "İlan yenilenemedi.");
        return;
      }

      setBumpMessage(payload.message ?? "İlan yenilendi!");
      router.refresh();
    } finally {
      setBumpingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {archiveError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {archiveError}
        </p>
      ) : null}

      {bumpMessage ? (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {bumpMessage}
        </p>
      ) : null}

      {showForm && children && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">
              {activeEditId ? "İlanı Düzenle" : "Yeni İlan Ver"}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1 hover:bg-primary/10"
            >
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 py-4 text-base font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <Plus className="size-5" />
          Yeni İlan Ver
        </button>
      )}

      {listings.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center bg-slate-50/50">
          <h3 className="text-base font-medium">Henüz ilanın yok</h3>
          <p className="mt-1 text-sm text-gray-500">Hemen ilk arabanı ekle!</p>
        </div>
      )}
      {listings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500">
            {listings.length} ilan
          </h3>
          <div className="space-y-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isArchiving={archivingId === listing.id}
                isBumping={bumpingId === listing.id}
                currentTime={currentTime}
                onArchive={handleArchive}
                onBump={handleBump}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  isArchiving,
  isBumping,
  currentTime,
  onArchive,
  onBump,
}: {
  listing: Listing;
  isArchiving: boolean;
  isBumping: boolean;
  currentTime: number;
  onArchive: (id: string) => void;
  onBump: (id: string) => void;
}) {
  const isArchived = listing.status === "archived";
  const isApproved = listing.status === "approved";

  const canBump = isApproved && (() => {
    if (!listing.bumpedAt) return true;
    const cooldownEnd = new Date(new Date(listing.bumpedAt).getTime() + 7 * 24 * 60 * 60 * 1000);
    return new Date() >= cooldownEnd;
  })();

  const bumpCooldownDays = listing.bumpedAt
    ? Math.max(0, Math.ceil((new Date(listing.bumpedAt).getTime() + 7 * 24 * 60 * 60 * 1000 - currentTime) / (24 * 60 * 60 * 1000)))
    : 0;

  return (
    <div className={`flex gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm ${isArchived ? "opacity-60" : ""}`}>
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {listing.images?.[0]?.url ? (
          <Image
            src={listing.images[0].url}
            alt=""
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <span className="text-xs">Fotoğraf yok</span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${statusClassMap[listing.status]}`}>
            {statusLabelMap[listing.status]}
          </span>
        </div>
        <p className="mt-1 font-medium text-gray-900 truncate">{listing.title}</p>
        <p className="text-sm font-semibold text-gray-900">
          {formatCurrency(listing.price)}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <span>{listing.year}</span>
          <span>•</span>
          <span>{formatNumber(listing.mileage)} km</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          href={`/dashboard/listings?edit=${listing.id}`}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Pencil className="size-4" />
          Düzenle
        </Link>
        {isApproved && (
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
              >
                <Rocket className="size-4" />
                Hızlandır
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>İlanını Öne Çıkar</DialogTitle>
              </DialogHeader>
              <ListingDopingPanel listingId={listing.id} listingTitle={listing.title} />
            </DialogContent>
          </Dialog>
        )}
        {isApproved && (
          <button
            type="button"
            onClick={() => onBump(listing.id)}
            disabled={isBumping || !canBump}
            title={canBump ? "İlanı listenin üstüne taşı" : `${bumpCooldownDays} gün sonra yenileyebilirsin`}
            className="flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBumping ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowUpCircle className="size-4" />
            )}
            {canBump ? "Yenile" : `${bumpCooldownDays}g`}
          </button>
        )}
        {isArchived ? (
          <span className="flex items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500">
            <RotateCcw className="size-4" />
            Arşivde
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onArchive(listing.id)}
            disabled={isArchiving}
            className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            {isArchiving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Archive className="size-4" />
            )}
            Arşivle
          </button>
        )}
      </div>
    </div>
  );
}

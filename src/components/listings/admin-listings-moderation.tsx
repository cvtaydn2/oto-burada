"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Pencil,
  Save,
  Sparkles,
  TriangleAlert,
  ShieldCheck,
  X,
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
  const [activeBulkAction, setActiveBulkAction] = useState<"approve" | "reject" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notesByListingId, setNotesByListingId] = useState<Record<string, string>>({});
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [bulkNote, setBulkNote] = useState("");

  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ title: string; price: number; description: string } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const allPendingListingIds = pendingListings.map((listing) => listing.id);
  const allSelected = pendingListings.length > 0 && selectedListingIds.length === pendingListings.length;

  if (pendingListings.length === 0) {
    return (
      <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Moderasyon</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">Bekleyen ilan yok</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Yeni ilanlar geldikçe burada inceleme sırası oluşacak.
        </p>
      </section>
    );
  }

  const handleModeration = async (listingId: string, action: "approve" | "reject") => {
    setActiveAction(`${listingId}:${action}`);
    setErrorMessage(null);
    setSuccessMessage(null);

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
      setSelectedListingIds((current) => current.filter((id) => id !== listingId));
      setSuccessMessage(action === "approve" ? "İlan onaylandı." : "İlan reddedildi.");
      router.refresh();
    } catch {
      setErrorMessage("Bağlantı sırasında bir hata oluştu. Lütfen tekrar dene.");
    } finally {
      setActiveAction(null);
    }
  };

  const toggleListingSelection = (listingId: string) => {
    setSelectedListingIds((current) =>
      current.includes(listingId)
        ? current.filter((id) => id !== listingId)
        : [...current, listingId],
    );
  };

  const handleBulkModeration = async (
    action: "approve" | "reject",
    listingIds: string[],
  ) => {
    const uniqueListingIds = [...new Set(listingIds)];

    if (uniqueListingIds.length === 0) {
      setErrorMessage("Toplu moderasyon için en az bir ilan seç.");
      return;
    }

    setActiveBulkAction(action);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/admin/listings/bulk-moderate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          listingIds: uniqueListingIds,
          note: bulkNote.trim() || undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            message?: string;
            data?: { moderatedListingIds?: string[]; skippedListingIds?: string[] };
            error?: { message?: string };
          }
        | null;

      if (!response.ok || !payload?.success) {
        setErrorMessage(payload?.error?.message ?? "Toplu moderasyon işlemi tamamlanamadı.");
        return;
      }

      const moderatedIds = payload.data?.moderatedListingIds ?? [];
      const skippedIds = payload.data?.skippedListingIds ?? [];
      setSelectedListingIds((current) => current.filter((id) => !moderatedIds.includes(id)));
      setBulkNote("");
      setSuccessMessage(
        skippedIds.length > 0
          ? `${payload.message ?? "Toplu moderasyon tamamlandı."} ${skippedIds.length} ilan atlandı.`
          : payload.message ?? "Toplu moderasyon tamamlandı.",
      );
      router.refresh();
    } catch {
      setErrorMessage("Toplu moderasyon sırasında bağlantı hatası oluştu.");
    } finally {
      setActiveBulkAction(null);
    }
  };

  const startEditing = (listing: Listing) => {
    setEditingListingId(listing.id);
    const initialValues = {
      title: listing.title || (listing.brand + " " + listing.model),
      price: listing.price,
      description: listing.description,
    };
    setEditValues(initialValues);
  };

  const handleSaveEdit = async () => {
    if (!editingListingId || !editValues) return;
    setIsSavingEdit(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/listings/${editingListingId}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error?.message ?? "Düzenleme kaydedilemedi.");
        return;
      }

      setSuccessMessage("İlan güncellendi.");
      setEditingListingId(null);
      setEditValues(null);
      router.refresh();
    } catch {
      setErrorMessage("Bağlantı hatası.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Moderasyon</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Bekleyen ilanlar</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            İlanları kontrol ederek yayınlama ya da reddetme kararını buradan verebilirsin.
          </p>
        </div>
        <div className="rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground">
          {pendingListings.length} ilan bekliyor
        </div>
      </div>

      {errorMessage && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="mt-6 space-y-6">
        <div className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold text-foreground">
                  {selectedListingIds.length} seçili ilan
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedListingIds(allSelected ? [] : allPendingListingIds)}
                  className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {allSelected ? "Seçimi temizle" : "Tümünü seç"}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Seçili bekleyen ilanları tek hamlede onayla ya da reddet.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={activeBulkAction !== null || selectedListingIds.length === 0}
                onClick={() => void handleBulkModeration("approve", selectedListingIds)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {activeBulkAction === "approve" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Seçilenleri onayla
              </button>
              <button
                type="button"
                disabled={activeBulkAction !== null || selectedListingIds.length === 0}
                onClick={() => void handleBulkModeration("reject", selectedListingIds)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {activeBulkAction === "reject" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <XCircle className="size-4" />
                )}
                Seçilenleri reddet
              </button>
              <button
                type="button"
                disabled={activeBulkAction !== null || pendingListings.length === 0}
                onClick={() => void handleBulkModeration("approve", allPendingListingIds)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles className="size-4" />
                Tümünü onayla
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <label htmlFor="bulk-moderation-note" className="text-xs font-medium text-muted-foreground">
                Toplu moderasyon notu
              </label>
              <button 
                type="button" 
                onClick={() => setBulkNote("")}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Temizle
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 overflow-x-auto pb-1">
              {[
                "Eksik/Düşük Kalite Fotoğraf",
                "Yanıltıcı Bilgi/Fiyat",
                "Uygunsuz İlan Başlığı",
                "Mükerrer İlan",
                "Hatalı Kategori",
                "İletişim Bilgisi Hatalı"
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBulkNote(preset)}
                  className="whitespace-nowrap rounded-full border border-border/60 bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              id="bulk-moderation-note"
              value={bulkNote}
              onChange={(event) => setBulkNote(event.target.value)}
              placeholder="Opsiyonel not: seçili ilanlar için ortak moderasyon notu"
              rows={3}
              className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </div>

        {pendingListings.map((listing) => {
          const approving = activeAction === `${listing.id}:approve`;
          const rejecting = activeAction === `${listing.id}:reject`;
          const actionBusy = approving || rejecting;
          const insight = getListingCardInsights(listing);
          const toneClasses: Record<string, string> = {
            amber: "border-amber-100 bg-gradient-to-r from-amber-50 to-background text-amber-700",
            emerald:
              "border-emerald-100 bg-gradient-to-r from-emerald-50 to-background text-emerald-700",
            indigo: "border-primary/10 bg-gradient-to-r from-primary/10 to-background text-primary",
            blue: "border-blue-100 bg-gradient-to-r from-blue-50 to-background text-blue-700",
            rose: "border-rose-100 bg-gradient-to-r from-rose-50 to-background text-rose-700",
          };
          const currentToneClass = toneClasses[insight.tone] || toneClasses.blue;

          return (
            <article
              key={listing.id}
              className="rounded-[1.75rem] border border-border/70 bg-background p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      id={`listing-select-${listing.id}`}
                      type="checkbox"
                      checked={selectedListingIds.includes(listing.id)}
                      onChange={() => toggleListingSelection(listing.id)}
                      className="size-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor={`listing-select-${listing.id}`}
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Toplu moderasyona dahil et
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      İncelemede
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${currentToneClass}`}
                    >
                      {insight.badgeLabel}
                    </span>
                    {listing.expertInspection?.hasInspection && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        <ShieldCheck className="size-3" />
                        Ekspertiz Raporu Mevcut
                      </span>
                    )}
                  </div>
                  
                  {(listing.fraudScore ?? 0) > 0 && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-rose-700">
                        <TriangleAlert className="size-5" />
                        Sistem Güvenlik Skoru (Yüksek Risk): {listing.fraudScore} Puan
                      </div>
                      {listing.fraudReason && (
                        <p className="mt-1.5 text-xs font-medium text-rose-600">
                          {listing.fraudReason}
                        </p>
                      )}
                    </div>
                  )}

                  {(listing.marketPriceIndex ?? 1) > 1.2 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-amber-700">
                        <TriangleAlert className="size-5" />
                        Fiyat Manüpilasyonu Şüphesi
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-amber-600">
                        İlan fiyatı piyasa ortalamasının %{Math.round(((listing.marketPriceIndex ?? 1) - 1) * 100)} üzerindedir. 
                        Lütfen fiyat ve araç kondisyonu arasındaki tutarlılığı inceleyin.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    {editingListingId === listing.id ? (
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={editValues?.title}
                          onChange={(e) => setEditValues(v => v ? { ...v, title: e.target.value } : null)}
                          className="w-full rounded-xl border border-primary/30 bg-background px-3 py-2 text-lg font-bold focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editValues?.price}
                            onChange={(e) => setEditValues(v => v ? { ...v, price: Number(e.target.value) } : null)}
                            className="w-32 rounded-lg border border-primary/30 bg-background px-3 py-1.5 font-bold text-primary focus:ring-2 focus:ring-primary/20"
                          />
                          <span className="text-sm font-bold text-primary">TL</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground">
                          {listing.title || `${listing.brand} ${listing.model}`}
                        </h3>
                        <p className="mt-1 text-2xl font-bold text-primary">
                          {formatCurrency(listing.price)}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      {editingListingId === listing.id ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            disabled={isSavingEdit}
                            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            {isSavingEdit ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                            Kaydet
                          </button>
                          <button
                            onClick={() => { setEditingListingId(null); setEditValues(null); }}
                            className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                          >
                            <X className="size-4" />
                            İptal
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEditing(listing)}
                          className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          <Pencil className="size-4" />
                          Düzenle
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
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
                      {listing.images.length} fotoğraf
                    </span>
                  </div>

                  <div className={`rounded-[1.25rem] border p-4 ${currentToneClass}`}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Sparkles className="size-4" />
                      Hızlı moderasyon özeti
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

                  {editingListingId === listing.id ? (
                    <textarea
                      value={editValues?.description}
                      onChange={(e) => setEditValues(v => v ? { ...v, description: e.target.value } : null)}
                      rows={5}
                      className="w-full rounded-xl border border-primary/30 bg-background p-4 text-sm leading-6 focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                      {listing.description}
                    </p>
                  )}

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Gönderim tarihi</p>
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
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[
                        "Kurallara uygun, onaylandı",
                        "Eksik veya düşük kaliteli fotoğraf",
                        "Yanıltıcı veya tutarsız bilgi",
                        "Mükerrer/tekrar ilan",
                        "Uygunsuz içerik veya dil",
                        "Şüpheli fiyat (dolandırıcılık riski)",
                        "WhatsApp numarası doğrulanamadı",
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            setNotesByListingId((current) => ({
                              ...current,
                              [listing.id]: preset,
                            }))
                          }
                          className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <textarea
                      id={`listing-note-${listing.id}`}
                      value={notesByListingId[listing.id] ?? ""}
                      onChange={(event) =>
                        setNotesByListingId((current) => ({
                          ...current,
                          [listing.id]: event.target.value,
                        }))
                      }
                      placeholder="Opsiyonel not: neden onaylandı veya reddedildi?"
                      rows={3}
                      className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Not girersen en az 3 karakter olmalı ve audit kaydına eklenir.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/listing/${listing.slug}`}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <ArrowRight className="size-4" />
                      Public ilanı aç
                    </Link>
                    <a
                      href={`https://wa.me/${listing.whatsappPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <MessageCircle className="size-4" />
                      WhatsApp kontrolü
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

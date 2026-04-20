"use client";

import Link from "next/link";
import Image from "next/image";
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
  XCircle 
} from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { getListingCardInsights } from "@/services/listings/listing-card-insights";
import { type Listing } from "@/types";

interface ModerationCardProps {
  listing: Listing;
  selectedListingIds: string[];
  toggleListingSelection: (id: string) => void;
  activeAction: string | null;
  handleModeration: (id: string, action: "approve" | "reject") => void;
  editingListingId: string | null;
  setEditingListingId: (id: string | null) => void;
  editValues: { title: string; price: number; description: string } | null;
  setEditValues: (values: { title: string; price: number; description: string } | null) => void;
  handleSaveEdit: () => void;
  isSavingEdit: boolean;
  notesByListingId: Record<string, string>;
  setNotesByListingId: (fn: (current: Record<string, string>) => Record<string, string>) => void;
}

export function ModerationCard({
  listing,
  selectedListingIds,
  toggleListingSelection,
  activeAction,
  handleModeration,
  editingListingId,
  setEditingListingId,
  editValues,
  setEditValues,
  handleSaveEdit,
  isSavingEdit,
  notesByListingId,
  setNotesByListingId
}: ModerationCardProps) {
  const approving = activeAction === `${listing.id}:approve`;
  const rejecting = activeAction === `${listing.id}:reject`;
  const actionBusy = approving || rejecting;
  const insight = getListingCardInsights(listing);

  const toneClasses: Record<string, string> = {
    amber: "border-amber-100 bg-gradient-to-r from-amber-50 to-background text-amber-700",
    emerald: "border-emerald-100 bg-gradient-to-r from-emerald-50 to-background text-emerald-700",
    indigo: "border-primary/10 bg-gradient-to-r from-primary/10 to-background text-primary",
    blue: "border-blue-100 bg-gradient-to-r from-blue-50 to-background text-blue-700",
    rose: "border-rose-100 bg-gradient-to-r from-rose-50 to-background text-rose-700",
  };
  const currentToneClass = toneClasses[insight.tone] || toneClasses.blue;

  const startEditing = () => {
    setEditingListingId(listing.id);
    setEditValues({
      title: listing.title || (listing.brand + " " + listing.model),
      price: listing.price,
      description: listing.description,
    });
  };

  return (
    <article className="rounded-[1.75rem] border border-border/70 bg-background p-5 shadow-sm">
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
            <label htmlFor={`listing-select-${listing.id}`} className="text-sm font-medium text-muted-foreground">
              Toplu moderasyona dahil et
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-sky-700">
              {listing.status === "pending" ? "İnceleme Bekliyor" : listing.status}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {listing.id.split("-")[0]}</span>
          </div>

          {listing.images && listing.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-4 pt-1 no-scrollbar -mx-1 px-1">
               {listing.images.map((img, i) => (
                 <div key={img.id || i} className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm group/img">
                    <Image src={img.url} alt="" fill className="object-cover transition-transform group-hover/img:scale-110" sizes="128px" />
                 </div>
               ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${currentToneClass}`}>
              {insight.badgeLabel}
            </span>
            {listing.expertInspection?.hasInspection && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                <ShieldCheck className="size-3" /> Ekspertiz Raporu Mevcut
              </span>
            )}
          </div>

          {/* Warning Boxes */}
          {(listing.fraudScore ?? 0) > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-700">
                <TriangleAlert className="size-5" /> Sistem Güvenlik Skoru (Yüksek Risk): {listing.fraudScore} Puan
              </div>
              {listing.fraudReason && <p className="mt-1.5 text-xs font-medium text-rose-600">{listing.fraudReason}</p>}
            </div>
          )}

          {(listing.marketPriceIndex ?? 1) > 1.2 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-700">
                <TriangleAlert className="size-5" /> Fiyat Manüpilasyonu Şüphesi
              </div>
              <p className="mt-1.5 text-xs font-medium text-amber-600">
                İlan fiyatı piyasa ortalamasının %{Math.round(((listing.marketPriceIndex ?? 1) - 1) * 100)} üzerindedir.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            {editingListingId === listing.id ? (
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={editValues?.title}
                  onChange={(e) => setEditValues(editValues ? { ...editValues, title: e.target.value } : null)}
                  className="w-full rounded-xl border border-primary/30 bg-background px-3 py-2 text-lg font-bold focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editValues?.price}
                    onChange={(e) => setEditValues(editValues ? { ...editValues, price: Number(e.target.value) } : null)}
                    className="w-32 rounded-lg border border-primary/30 bg-background px-3 py-1.5 font-bold text-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-sm font-bold text-primary">TL</span>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">{listing.title || `${listing.brand} ${listing.model}`}</h3>
                <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(listing.price)}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              {editingListingId === listing.id ? (
                <>
                  <button onClick={handleSaveEdit} disabled={isSavingEdit} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                    {isSavingEdit ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} Kaydet
                  </button>
                  <button onClick={() => setEditingListingId(null)} className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">
                    <X className="size-4" /> İptal
                  </button>
                </>
              ) : (
                <button onClick={startEditing} className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">
                  <Pencil className="size-4" /> Düzenle
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
            <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1.5">{listing.year}</span>
            <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1.5">{formatNumber(listing.mileage)} km</span>
            <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1.5">{listing.city} / {listing.district}</span>
          </div>

          <div className={`rounded-xl border p-4 ${currentToneClass}`}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4" /> Hızlı moderasyon özeti
            </div>
            <p className="mt-2 text-sm leading-6 text-foreground/90">{insight.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {insight.highlights.map((highlight) => (
                <span key={`${listing.id}-${highlight}`} className="rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs font-semibold text-foreground">
                  {highlight}
                </span>
              ))}
            </div>
          </div>

          {editingListingId === listing.id ? (
            <textarea
              value={editValues?.description}
              onChange={(e) => setEditValues(editValues ? { ...editValues, description: e.target.value } : null)}
              rows={5}
              className="w-full rounded-xl border border-primary/30 bg-background p-4 text-sm leading-6 focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{listing.description}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
             <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
              <p className="text-xs text-muted-foreground">Gönderim tarihi</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{formatDate(listing.createdAt)}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
              <p className="text-xs text-muted-foreground">WhatsApp</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{listing.whatsappPhone}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
              <p className="text-xs text-muted-foreground">Konum</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <MapPin className="size-4 text-primary" /> {listing.city} / {listing.district}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
            <label htmlFor={`listing-note-${listing.id}`} className="text-xs font-medium text-muted-foreground">Moderasyon notu</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                "Kurallara uygun, onaylandı",
                "Eksik veya düşük kaliteli fotoğraf",
                "Yanıltıcı veya tutarsız bilgi",
                "Mükerrer/tekrar ilan",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNotesByListingId((current) => ({ ...current, [listing.id]: preset }))}
                  className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              id={`listing-note-${listing.id}`}
              value={notesByListingId[listing.id] ?? ""}
              onChange={(event) => setNotesByListingId((current) => ({ ...current, [listing.id]: event.target.value }))}
              placeholder="Opsiyonel not..."
              rows={3}
              className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/listing/${listing.slug}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
              <ArrowRight className="size-4" /> Public ilanı aç
            </Link>
            <a href={`https://wa.me/${listing.whatsappPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
              <MessageCircle className="size-4" /> WhatsApp kontrolü
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:w-44 lg:flex-col">
          <button type="button" disabled={actionBusy} onClick={() => handleModeration(listing.id, "approve")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
            {approving ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Onayla
          </button>
          <button type="button" disabled={actionBusy} onClick={() => handleModeration(listing.id, "reject")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60">
            {rejecting ? <LoaderCircle className="size-4 animate-spin" /> : <XCircle className="size-4" />} Reddet
          </button>
        </div>
      </div>
    </article>
  );
}

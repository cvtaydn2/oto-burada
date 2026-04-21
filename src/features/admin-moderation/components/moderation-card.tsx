"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  CheckCircle2, 
  LoaderCircle, 
  MessageCircle, 
  Pencil, 
  Save, 
  Sparkles, 
  TriangleAlert, 
  ShieldCheck, 
  X, 
  XCircle,
  Rocket,
  Shield
} from "lucide-react";
import { formatCurrency, formatDate, formatNumber, cn } from "@/lib/utils";
import { getTrustToneClass } from "@/lib/utils/trust-helpers";
import type { Listing } from "@/types";
import { getListingCardInsights } from "@/services/listings/listing-card-insights";
import { getSellerTrustUI } from "@/lib/utils/trust-ui";

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
    amber: "border-amber-100 bg-amber-50/50 text-amber-700",
    emerald: "border-emerald-100 bg-emerald-50/50 text-emerald-700",
    indigo: "border-primary/10 bg-primary/5 text-primary",
    blue: "border-blue-100 bg-blue-50/50 text-blue-700",
    rose: "border-rose-100 bg-rose-50/50 text-rose-700",
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
    <article className="showroom-card p-6 md:p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Side Navigation Context ── */}
        <div className="lg:w-64 shrink-0 space-y-6">
           <div className="flex items-center gap-4 group cursor-pointer" onClick={() => toggleListingSelection(listing.id)}>
              <div className={cn(
                "size-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                selectedListingIds.includes(listing.id) ? "bg-primary border-primary shadow-lg shadow-primary/20" : "border-border group-hover:border-primary/50"
              )}>
                {selectedListingIds.includes(listing.id) && <CheckCircle2 className="size-4 text-white" />}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                SEÇİME DAHİL ET
              </span>
           </div>

           <div className="space-y-4">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/50 bg-muted/20 shadow-inner group/preview">
                {listing.images?.[0] ? (
                  <Image src={listing.images[0].url} alt="" fill className="object-cover transition-transform duration-700 group-hover/preview:scale-110" sizes="256px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300"><Rocket size={32} /></div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover/preview:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-black/60 to-transparent">
                  <span className="text-white text-[10px] font-bold uppercase tracking-widest">{listing.images?.length || 0} GÖRSEL</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {listing.images?.slice(1, 4).map((img, i) => (
                  <div key={img.id || i} className="relative aspect-square rounded-xl overflow-hidden border border-border/30 bg-muted/10">
                    <Image src={img.url} alt="" fill className="object-cover opacity-80 hover:opacity-100 transition-opacity" sizes="64px" />
                  </div>
                ))}
              </div>
           </div>

           <div className="space-y-3">
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">GÖNDERİM TARİHİ</span>
                 <p className="text-xs font-bold text-foreground">{formatDate(listing.createdAt)}</p>
              </div>
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">SİSTEM KODU</span>
                 <p className="text-xs font-mono font-bold text-slate-400">#{listing.id.split("-")[0].toUpperCase()}</p>
              </div>
           </div>
        </div>

        {/* ── Main Content Area ── */}
        <div className="flex-1 min-w-0 space-y-6">
           <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm", currentToneClass)}>
                  {insight.badgeLabel}
                </span>
                {listing.expertInspection?.hasInspection && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-[10px] font-bold text-emerald-600 shadow-sm">
                    <ShieldCheck className="size-3" /> EKSPERTİZLİ
                  </span>
                )}
                
                {/* Seller Trust Context */}
                {listing.seller && (() => {
                  const trustUI = getSellerTrustUI(listing.seller);
                  return (
                    <Link 
                      href={`/admin/users/${listing.seller.id}`}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold shadow-sm border transition-all hover:scale-105 active:scale-95",
                        getTrustToneClass(trustUI.tone)
                      )}
                    >
                      <Shield size={12} />
                      {trustUI.label} ({listing.seller.trustScore ?? "Kısıtlı"}) Skor
                    </Link>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2">
                {editingListingId === listing.id ? (
                  <>
                    <button onClick={handleSaveEdit} disabled={isSavingEdit} className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20">
                      {isSavingEdit ? <LoaderCircle className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />} KAYDET
                    </button>
                    <button onClick={() => setEditingListingId(null)} className="h-10 px-5 rounded-xl border border-border bg-card text-xs font-bold uppercase tracking-widest hover:bg-muted transition-all">
                      <X className="size-4 mr-2" /> İPTAL
                    </button>
                  </>
                ) : (
                  <button onClick={startEditing} className="h-10 px-5 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm">
                    <Pencil className="size-4 mr-2" /> DÜZENLE
                  </button>
                )}
              </div>
           </div>

           <div className="space-y-4">
              {editingListingId === listing.id ? (
                <div className="grid gap-4 p-6 rounded-2xl bg-muted/20 border border-dashed border-primary/20">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">İLAN BAŞLIĞI</label>
                    <input
                      type="text"
                      value={editValues?.title}
                      onChange={(e) => setEditValues(editValues ? { ...editValues, title: e.target.value } : null)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">SATIŞ FİYATI (TL)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={editValues?.price}
                        onChange={(e) => setEditValues(editValues ? { ...editValues, price: Number(e.target.value) } : null)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xl font-bold text-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all pl-12"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">₺</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <h3 className="text-2xl font-bold text-foreground tracking-tight line-clamp-2">{listing.title}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-primary tracking-tighter">{formatCurrency(listing.price)}</span>
                    <span className="text-xs font-bold text-primary/50 uppercase">TL</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/40">
                   <div className="size-2 rounded-full bg-slate-300" />
                   <span className="text-xs font-bold text-slate-600 tracking-tight">{listing.brand} / {listing.model}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/40">
                   <div className="size-2 rounded-full bg-slate-300" />
                   <span className="text-xs font-bold text-slate-600 tracking-tight">{listing.year}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/40">
                   <div className="size-2 rounded-full bg-slate-300" />
                   <span className="text-xs font-bold text-slate-600 tracking-tight">{formatNumber(listing.mileage)} KM</span>
                </div>
              </div>
           </div>

           {/* ── AI Insights ── */}
           <div className={cn("rounded-2xl border p-6 space-y-4 shadow-sm", currentToneClass)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest opacity-80">
                  <Sparkles className="size-4" /> YAPAY ZEKA MODERASYON ANALİZİ
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={cn("h-1 w-4 rounded-full", i < 4 ? "bg-current opacity-40" : "bg-current opacity-10")} />
                  ))}
                </div>
              </div>
              <p className="text-sm leading-relaxed font-medium">{insight.summary}</p>
              <div className="flex flex-wrap gap-2">
                {insight.highlights.map((highlight) => (
                  <span key={`${listing.id}-${highlight}`} className="rounded-lg border border-border/20 bg-background/50 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                    {highlight}
                  </span>
                ))}
              </div>
           </div>

           {/* ── Risks & Warnings ── */}
           {((listing.fraudScore ?? 0) > 0 || (listing.marketPriceIndex ?? 1) > 1.2) && (
             <div className="grid md:grid-cols-2 gap-4">
               {(listing.fraudScore ?? 0) > 0 && (
                 <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-widest">
                       <TriangleAlert className="size-4" /> GÜVENLİK RİSKİ ({listing.fraudScore})
                    </div>
                    <p className="text-xs font-medium text-rose-600 leading-relaxed">{listing.fraudReason || "Şüpheli kullanıcı davranışı veya veri tutarsızlığı."}</p>
                 </div>
               )}
               {(listing.marketPriceIndex ?? 1) > 1.2 && (
                 <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-widest">
                       <TriangleAlert className="size-4" /> FİYAT ANALİZİ
                    </div>
                    <p className="text-xs font-medium text-amber-600 leading-relaxed">Piyasa ortalamasının %{Math.round(((listing.marketPriceIndex ?? 1) - 1) * 100)} üzerinde fiyatlandırılmış.</p>
                 </div>
               )}
             </div>
           )}

           <div className="space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">MODERASYON NOTU VE KARAR</label>
                <div className="flex gap-2">
                   {["Kurallara uygun", "Düşük kalite görsel", "Mükerrer ilan"].map(tag => (
                     <button key={tag} onClick={() => setNotesByListingId(c => ({...c, [listing.id]: tag}))} className="text-[9px] font-bold uppercase px-2 py-1 rounded bg-muted hover:bg-muted-foreground/10 transition-colors">
                       {tag}
                     </button>
                   ))}
                </div>
             </div>
             <textarea
               value={notesByListingId[listing.id] ?? ""}
               onChange={(e) => setNotesByListingId(c => ({ ...c, [listing.id]: e.target.value }))}
               placeholder="Buraya karar notlarınızı ekleyebilirsiniz..."
               className="w-full min-h-[100px] rounded-2xl border border-border bg-muted/10 p-4 text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:italic"
             />
           </div>

           <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-border/40">
              <div className="flex items-center gap-4">
                 <Link href={`/listing/${listing.slug}`} target="_blank" className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2 hover:underline">
                    PUBLİC SAYFAYI GÖR <ArrowRight className="size-3" />
                 </Link>
                 <a href={`https://wa.me/${listing.whatsappPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-2 hover:underline">
                    <MessageCircle className="size-3" /> WHATSAPP İLETİŞİM
                 </a>
              </div>

              <div className="flex items-center gap-3">
                 <button onClick={() => handleModeration(listing.id, "reject")} disabled={actionBusy} className="h-12 px-8 rounded-2xl border border-border text-xs font-bold uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all disabled:opacity-50">
                    {rejecting ? <LoaderCircle className="size-4 animate-spin" /> : <XCircle className="size-4 mr-2" />} REDDET
                 </button>
                 <button onClick={() => handleModeration(listing.id, "approve")} disabled={actionBusy} className="h-12 px-8 rounded-2xl bg-primary text-white text-xs font-bold uppercase tracking-widest hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50">
                    {approving ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4 mr-2" />} ONAYLA
                 </button>
              </div>
           </div>
        </div>
      </div>
    </article>
  );
}

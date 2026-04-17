"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  Archive, ArrowUpCircle, ChevronLeft, ChevronRight,
  Loader2, Pencil, Plus, Rocket, RotateCcw,
  X, CheckSquare, Square, FileSpreadsheet,
} from "lucide-react";

import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Listing } from "@/types";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ListingDopingPanel } from "./listing-doping-panel";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface MyListingsPanelProps {
  activeEditId?: string;
  initialShowForm?: boolean;
  listings: Listing[];
  children?: React.ReactNode;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

const statusLabelMap: Record<Listing["status"], string> = {
  approved: "Yayında",
  archived: "Arşivde",
  draft: "Taslak",
  pending: "İnceleniyor",
  rejected: "Reddedildi",
};

const statusClassMap: Record<Listing["status"], string> = {
  approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
  archived: "bg-muted text-muted-foreground border-border",
  draft: "bg-amber-50 text-amber-600 border-amber-100",
  pending: "bg-blue-50 text-blue-600 border-blue-100",
  rejected: "bg-red-50 text-red-600 border-red-100",
};

export function MyListingsPanel({
  activeEditId,
  initialShowForm = false,
  listings,
  children,
}: MyListingsPanelProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(Boolean(activeEditId) || initialShowForm);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [bumpingId, setBumpingId] = useState<string | null>(null);
  const [bumpMessage, setBumpMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkArchiving, setIsBulkArchiving] = useState(false);

  // Sayfalama
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.max(1, Math.ceil(listings.length / pageSize));
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return listings.slice(start, start + pageSize);
  }, [listings, currentPage, pageSize]);

  useEffect(() => { setSelectedIds([]); }, [currentPage, pageSize]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  useEffect(() => {
    const id = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    setShowForm(Boolean(activeEditId) || initialShowForm);
  }, [activeEditId, initialShowForm]);

  const handleArchive = async (listingId: string) => {
    setArchivingId(listingId);
    setArchiveError(null);
    const listing = listings.find(l => l.id === listingId);
    const isCurrentlyArchived = listing?.status === "archived";

    try {
      if (isCurrentlyArchived) {
        // Arşivden çıkar → taslağa al
        const res = await fetch("/api/listings/bulk-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [listingId] }),
        });
        const payload = await res.json().catch(() => null) as { success?: boolean; message?: string } | null;
        if (!res.ok || !payload?.success) {
          setArchiveError(payload?.message ?? "İlan taslağa alınamadı.");
          return;
        }
      } else {
        // Arşivle
        const res = await fetch(`/api/listings/${listingId}/archive`, { method: "POST" });
        const payload = await res.json().catch(() => null) as { success?: boolean; error?: { message: string } } | null;
        if (!res.ok || !payload?.success) {
          setArchiveError(payload?.error?.message ?? "İlan arşive alınamadı.");
          return;
        }
      }
      router.refresh();
    } finally {
      setArchivingId(null);
    }
  };

  const handleBulkArchive = async () => {
    if (!selectedIds.length) return;
    setIsBulkArchiving(true);
    setArchiveError(null);
    try {
      const res = await fetch("/api/listings/bulk-archive", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
        headers: { "Content-Type": "application/json" },
      });
      const payload = await res.json();
      if (payload.success) { setSelectedIds([]); router.refresh(); }
      else setArchiveError(payload.message || "Toplu arşivleme sırasında hata oluştu.");
    } catch { setArchiveError("Bir hata oluştu."); }
    finally { setIsBulkArchiving(false); }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    setIsBulkArchiving(true);
    try {
      const res = await fetch("/api/listings/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
        headers: { "Content-Type": "application/json" },
      });
      const payload = await res.json();
      if (payload.success) { setSelectedIds([]); router.refresh(); }
      else setArchiveError(payload.message || "Toplu silme sırasında hata oluştu.");
    } catch { setArchiveError("Bir hata oluştu."); }
    finally { setIsBulkArchiving(false); }
  };

  const handleBump = async (listingId: string) => {
    setBumpingId(listingId);
    setBumpMessage(null);
    try {
      const res = await fetch(`/api/listings/${listingId}/bump`, { method: "POST" });
      const payload = await res.json().catch(() => null) as { success?: boolean; message?: string; error?: { message: string } } | null;
      if (!res.ok || !payload?.success) { setBumpMessage(payload?.error?.message ?? "İlan yenilenemedi."); return; }
      setBumpMessage(payload.message ?? "İlan yenilendi!");
      router.refresh();
    } finally { setBumpingId(null); }
  };

  const pageIds = paginatedListings.map(l => l.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const toggleSelectAll = () => {
    if (allPageSelected) setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    else setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
  };

  const exportCsv = () => {
    const headers = ["title", "brand", "model", "year", "mileage", "fuel_type", "transmission", "price", "city", "district", "whatsapp_phone", "description", "vin"];
    const rows = listings.map(l => [
      `"${l.title}"`, l.brand, l.model, l.year, l.mileage, l.fuelType,
      l.transmission, l.price, l.city, l.district, l.whatsappPhone,
      `"${l.description.replace(/"/g, '""')}"`, l.vin || "",
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `oto-burada-ilanlarim-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {archiveError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-bold">{archiveError}</p>
      )}
      {bumpMessage && (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 font-bold mb-4">{bumpMessage}</p>
      )}

      {showForm && children && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/20 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-black text-foreground">{activeEditId ? "İlanı Düzenle" : "Yeni İlan Ver"}</h3>
            <button onClick={() => setShowForm(false)} className="rounded-xl p-2 bg-card border border-border text-muted-foreground/70 hover:text-muted-foreground transition-all hover:bg-muted/30">
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      )}

      {!showForm && (
        <button onClick={() => setShowForm(true)} className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-200 bg-card py-6 text-base font-bold text-blue-600 transition-all hover:bg-blue-50 hover:border-blue-300 active:scale-[0.99] group shadow-sm">
          <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={24} />
          </div>
          YENİ İLAN YAYINLA
        </button>
      )}

      {listings.length === 0 && !showForm && (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card shadow-sm mt-6">
          <div className="size-20 bg-muted/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Rocket size={40} />
          </div>
          <h3 className="text-xl font-black text-muted-foreground">Henüz İlanınız Yok</h3>
          <p className="mt-2 text-muted-foreground/70 font-medium max-w-xs mx-auto">Hemen ilk arabanızı ekleyerek Türkiye&apos;nin en hızlı pazar yerinde satışa başlayın!</p>
        </div>
      )}

      {listings.length > 0 && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 px-1 py-2">
            {/* Üst satır: seçim + toplu işlemler */}
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-blue-600 transition-colors">
                {allPageSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                Bu Sayfayı Seç ({paginatedListings.length})
              </button>
              {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <Button variant="outline" size="sm" onClick={handleBulkArchive} disabled={isBulkArchiving} className="h-8 px-3 text-[11px] font-bold uppercase tracking-tight rounded-xl shadow-md bg-slate-800 hover:bg-slate-900 text-white">
                    {isBulkArchiving ? <Loader2 className="size-3 animate-spin mr-1" /> : <Archive size={13} className="mr-1" />}
                    {selectedIds.length} Arşivle
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isBulkArchiving || !selectedIds.every(id => listings.find(l => l.id === id)?.status === "archived")} className="h-8 px-3 text-[11px] font-bold uppercase tracking-tight rounded-xl border-red-200 text-red-600 hover:bg-red-50 shadow-sm">
                        Sil
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>İlanları Kalıcı Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                          {selectedIds.length} ilanı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleBulkDelete}>
                          Kalıcı Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* Alt satır: göster + indir + toplam */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 h-9">
                <span className="text-xs font-semibold text-muted-foreground">Göster</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-transparent text-sm font-bold text-foreground/90 outline-none cursor-pointer"
                >
                  {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <Button variant="outline" size="sm" onClick={exportCsv} className="h-9 px-3 text-[11px] font-bold uppercase tracking-tight border-border rounded-xl bg-card hover:bg-muted/30 transition-all text-muted-foreground shadow-sm">
                <FileSpreadsheet size={14} className="mr-1.5" />
                <span className="hidden sm:inline">Listeyi İndir</span>
                <span className="sm:hidden">İndir</span>
              </Button>

              <span className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-widest ml-auto">
                {listings.length} ilan
              </span>
            </div>
          </div>

          {/* İlan listesi */}
          <div className="space-y-3">
            {paginatedListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isSelected={selectedIds.includes(listing.id)}
                onToggleSelect={() => toggleSelect(listing.id)}
                isArchiving={archivingId === listing.id}
                isBumping={bumpingId === listing.id}
                currentTime={currentTime}
                onArchive={handleArchive}
                onBump={handleBump}
              />
            ))}
          </div>

          {/* Sayfalama */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, listings.length)}</span> arası, toplam <span className="font-bold text-foreground">{listings.length}</span> ilan
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-bold text-muted-foreground transition hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | "…")[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "…" ? (
                      <span key={`e-${idx}`} className="px-1 text-muted-foreground/70 text-sm">…</span>
                    ) : (
                      <button key={item} onClick={() => setCurrentPage(item as number)} className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-bold transition ${item === currentPage ? "border-blue-500 bg-blue-500 text-white" : "border-border bg-card text-muted-foreground hover:bg-muted/30"}`}>
                        {item}
                      </button>
                    )
                  )}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-bold text-muted-foreground transition hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ListingCard ──────────────────────────────────────────────────────────────

function ListingCard({
  listing,
  isSelected,
  onToggleSelect,
  isArchiving,
  isBumping,
  currentTime,
  onArchive,
  onBump,
}: {
  listing: Listing;
  isSelected: boolean;
  onToggleSelect: () => void;
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
    <div className={`group flex gap-3 rounded-xl border transition-all duration-300 ${isSelected ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-100" : "border-border bg-card hover:border-blue-200 hover:shadow-md"} p-3 sm:p-4 ${isArchived ? "opacity-60" : ""}`}>
      <div className="flex items-start pt-1">
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} className="size-4 rounded border-border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
      </div>

      <div className="relative h-20 w-24 sm:h-24 sm:w-32 shrink-0 overflow-hidden rounded-xl bg-muted/30 border border-border/50">
        {listing.images?.[0]?.url ? (
          <Image src={listing.images[0].url} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" placeholder={listing.images[0].placeholderBlur ? "blur" : "empty"} blurDataURL={listing.images[0].placeholderBlur ?? undefined} />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300"><Rocket size={20} /></div>
        )}
          {listing.featured && (
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[7px] font-bold uppercase tracking-wider shadow-sm">ÖNE ÇIKAN</div>
          )}
      </div>

      <div className="min-w-0 flex-1 flex flex-col pt-0.5">
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusClassMap[listing.status]} shadow-sm`}>
            {statusLabelMap[listing.status]}
          </span>
          {listing.eidsVerificationJson && null}
        </div>
        <p className="font-bold text-foreground truncate tracking-tight text-sm mb-1 group-hover:text-blue-600 transition-colors">{listing.title}</p>
        <p className="text-base font-black text-blue-600 tracking-tight leading-none">{formatCurrency(listing.price)} ₺</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider pt-1">
          <span>{listing.year}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">{formatNumber(listing.mileage)} km</span>
          <span className="hidden sm:inline">•</span>
          <span className="truncate">{listing.city}</span>
        </div>
      </div>

      {/* Aksiyon butonları — mobilde 2 sütun grid */}
      <div className="grid grid-cols-2 sm:flex sm:flex-col gap-1.5 justify-start sm:justify-center ml-1 sm:ml-2 sm:border-l sm:border-border/50 sm:pl-3">
        <Link href={`/dashboard/listings?edit=${listing.id}`} className="flex items-center justify-center size-8 rounded-lg bg-muted/30 text-muted-foreground/70 hover:bg-blue-600 hover:text-white transition-all border border-border/50" title="Düzenle">
          <Pencil className="size-3.5" />
        </Link>

        {isApproved && (listing.bumpedAt ? (
          <div className="flex items-center justify-center size-8 rounded-lg bg-muted/30 text-slate-300 border border-border/50 cursor-help" title={`${bumpCooldownDays} gün sonra tekrar öne çıkarılabilir`}>
            <ArrowUpCircle className="size-3.5" />
          </div>
        ) : (
          <button type="button" onClick={() => onBump(listing.id)} disabled={isBumping || !canBump} className="flex items-center justify-center size-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-30 border border-emerald-100" title="Üste Taşı">
            {isBumping ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowUpCircle className="size-3.5" />}
          </button>
        ))}

        {isApproved && (
          <Dialog>
            <DialogTrigger asChild>
              <button type="button" className="flex items-center justify-center size-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100" title="Doping">
                <Rocket className="size-3.5" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl rounded-2xl border-none">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">İlanını <span className="text-blue-600">Öne Çıkar</span></DialogTitle>
                <DialogDescription className="sr-only">
                  İlanınızı öne çıkarmak için doping paketi seçin.
                </DialogDescription>
              </DialogHeader>
              <ListingDopingPanel listingId={listing.id} listingTitle={listing.title} />
            </DialogContent>
          </Dialog>
        )}

        <button type="button" onClick={() => onArchive(listing.id)} disabled={isArchiving} className={`flex items-center justify-center size-8 rounded-lg ${isArchived ? "bg-muted text-muted-foreground/70" : "bg-red-50 text-red-500 hover:bg-red-600 hover:text-white"} transition-all disabled:opacity-30 border border-transparent`} title={isArchived ? "Arşivden Çıkar" : "Arşivle"}>
          {isArchiving ? <Loader2 className="size-3.5 animate-spin" /> : isArchived ? <RotateCcw className="size-3.5" /> : <Archive className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

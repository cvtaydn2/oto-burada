"use client"

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type Listing } from "@/types";
import { DashboardListingCard } from "./dashboard-listing-card";
import { 
  Archive, 
  ChevronLeft, 
  ChevronRight,
  X,
  Plus,
  CheckSquare,
  Square,
  Loader2,
  FileSpreadsheet,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MyListingsPanelProps {
  activeEditId?: string;
  initialShowForm?: boolean;
  listings: Listing[];
  children?: React.ReactNode;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

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
    <div className="space-y-6">
      {archiveError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 font-bold shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          {archiveError}
        </div>
      )}
      {bumpMessage && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-4 text-sm text-blue-700 font-bold shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          {bumpMessage}
        </div>
      )}

      {showForm && children && (
        <div className="rounded-3xl border border-primary/10 bg-primary/[0.02] p-8 shadow-sm animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-foreground tracking-tight">{activeEditId ? "İlanı Düzenle" : "Yeni İlan Ver"}</h3>
              <p className="text-sm font-medium text-muted-foreground mt-1">İlan bilgilerini güncelleyerek yayına hazır hale getirin.</p>
            </div>
            <button onClick={() => setShowForm(false)} className="size-10 rounded-xl bg-white border border-border flex items-center justify-center text-muted-foreground/70 hover:text-red-500 hover:border-red-100 transition-all shadow-sm">
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      )}

      {!showForm && (
        <button onClick={() => setShowForm(true)} className="flex w-full items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-primary/20 bg-card py-10 text-lg font-bold text-primary transition-all hover:bg-primary/[0.02] hover:border-primary/40 active:scale-[0.99] group shadow-sm">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
            <Plus size={32} strokeWidth={3} />
          </div>
          YENİ İLAN YAYINLA
        </button>
      )}

      {listings.length === 0 && !showForm && (
        <div className="rounded-3xl border border-border/80 p-20 text-center bg-card shadow-sm mt-8 border-dashed">
          <div className="size-24 bg-muted/30 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-300 rotate-[-10deg] animate-pulse">
            <Rocket size={48} />
          </div>
          <h3 className="text-2xl font-bold text-foreground tracking-tight">Henüz İlanınız Yok</h3>
          <p className="mt-3 text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">Hayalindeki arabayı satmak ya da yenisini almak için hemen ilk adımını at.</p>
        </div>
      )}

      {listings.length > 0 && (
        <div className="space-y-6">
          {/* Enhanced Toolbar */}
          <div className="flex flex-col gap-4 bg-muted/30 p-2 rounded-2xl border border-border/40">
            <div className="flex flex-wrap items-center justify-between gap-4 px-3 py-2">
              <div className="flex items-center gap-4">
                <button onClick={toggleSelectAll} className="flex items-center gap-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">
                  {allPageSelected ? <CheckSquare size={20} className="text-primary" /> : <Square size={20} className="text-border" />}
                  Tümünü Seç ({paginatedListings.length})
                </button>
                
                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="w-px h-4 bg-border mx-1" />
                    <Button variant="outline" size="sm" onClick={handleBulkArchive} disabled={isBulkArchiving} className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest bg-slate-900 border-slate-800 text-white hover:bg-black rounded-xl">
                      {isBulkArchiving ? <Loader2 className="size-3 animate-spin mr-2" /> : <Archive size={14} className="mr-2" />}
                      Arşivle ({selectedIds.length})
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button disabled={isBulkArchiving} className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                          SİL
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl border-none p-8">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-bold tracking-tight">İlanları Kalıcı Sil</AlertDialogTitle>
                          <AlertDialogDescription className="font-medium text-muted-foreground mt-2">
                            {selectedIds.length} ilanı kalıcı olarak silmek istediğinize emin misiniz? Arşivlenmiş olmayan ilanlar silinemez.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8">
                          <AlertDialogCancel className="rounded-xl h-12 px-6">Vazgeç</AlertDialogCancel>
                          <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 rounded-xl h-12 px-6" onClick={handleBulkDelete}>
                            Kalıcı Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 h-10 shadow-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sayfa:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer"
                  >
                    {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <Button variant="outline" size="sm" onClick={exportCsv} className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest border-border rounded-xl bg-card hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm">
                  <FileSpreadsheet size={16} className="mr-2 text-blue-500" />
                  Excel İndir
                </Button>
              </div>
            </div>
          </div>

          {/* İlan Listesi */}
          <div className="grid gap-4">
            {paginatedListings.map((listing) => (
              <DashboardListingCard
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">
                <span className="text-foreground">{(currentPage - 1) * pageSize + 1} – {Math.min(currentPage * pageSize, listings.length)}</span> / <span className="text-foreground">{listings.length}</span> İLAN
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1} 
                  className="size-10 flex items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-primary/5 hover:text-primary disabled:opacity-30 shadow-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-1.5 mx-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | "…")[]>((acc, p, i, arr) => {
                      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "…" ? (
                        <span key={`e-${idx}`} className="px-2 text-muted-foreground/30 font-bold">...</span>
                      ) : (
                        <button 
                          key={item} 
                          onClick={() => setCurrentPage(item as number)} 
                          className={cn(
                            "size-10 flex items-center justify-center rounded-xl text-xs font-bold transition-all shadow-sm",
                            item === currentPage 
                              ? "bg-primary text-primary-foreground shadow-primary/20 scale-110 z-10" 
                              : "bg-card border border-border text-muted-foreground hover:border-primary/30"
                          )}
                        >
                          {item}
                        </button>
                      )
                    )}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages} 
                  className="size-10 flex items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-primary/5 hover:text-primary disabled:opacity-30 shadow-sm"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

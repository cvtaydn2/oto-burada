"use client";

import {
  Archive,
  CheckSquare,
  FileSpreadsheet,
  Loader2,
  Plus,
  Rocket,
  Square,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
import { Button } from "@/components/ui/button";
import { useListingActions } from "@/hooks/use-listing-actions";
import { type Listing } from "@/types";

import { DashboardListingCard } from "./dashboard-listing-card";
import { ListingPagination } from "./listing-pagination";

interface MyListingsPanelProps {
  activeEditId?: string;
  initialShowForm?: boolean;
  listings: Listing[];
  userId?: string;
  children?: React.ReactNode;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export function MyListingsPanel({
  activeEditId,
  initialShowForm = false,
  listings,
  userId,
  children,
}: MyListingsPanelProps) {
  const [showForm, setShowForm] = useState(Boolean(activeEditId) || initialShowForm);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const {
    archivingId,
    archiveError,
    bumpingId,
    bumpMessage,
    selectedIds,
    setSelectedIds,
    isBulkArchiving,
    handleArchive,
    handleBulkArchive,
    handleBulkDelete,
    handleBump,
    toggleSelect,
    clearSelection,
  } = useListingActions(listings, userId);

  const totalPages = Math.max(1, Math.ceil(listings.length / pageSize));
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return listings.slice(start, start + pageSize);
  }, [listings, currentPage, pageSize]);

  useEffect(() => {
    clearSelection();
  }, [currentPage, pageSize, clearSelection]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages); // eslint-disable-line react-hooks/set-state-in-effect
  }, [currentPage, totalPages]);

  useEffect(() => {
    const id = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setShowForm(Boolean(activeEditId) || initialShowForm); // eslint-disable-line react-hooks/set-state-in-effect
  }, [activeEditId, initialShowForm]);

  const pageIds = paginatedListings.map((l) => l.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (allPageSelected) setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    else setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
  };

  const exportCsv = () => {
    const headers = [
      "title",
      "brand",
      "model",
      "year",
      "mileage",
      "fuel_type",
      "transmission",
      "price",
      "city",
      "district",
      "whatsapp_phone",
      "description",
      "vin",
    ];
    const rows = listings.map((l) =>
      [
        `"${l.title}"`,
        l.brand,
        l.model,
        l.year,
        l.mileage,
        l.fuelType,
        l.transmission,
        l.price,
        l.city,
        l.district,
        l.whatsappPhone,
        `"${l.description.replace(/"/g, '""')}"`,
        l.vin || "",
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `oto-burada-ilanlarim-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // ── PERFORMANCE FIX: Issue #FRONT-02 - Memory Leak ─────
    // Clean up the object URL to free memory, especially for large lists
    setTimeout(() => URL.revokeObjectURL(url), 100);
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
              <h3 className="text-2xl font-bold text-foreground tracking-tight">
                {activeEditId ? "İlanı Düzenle" : "Yeni İlan Ver"}
              </h3>
              <p className="text-sm font-medium text-muted-foreground mt-1">
                İlan bilgilerini güncelleyerek yayına hazır hale getirin.
              </p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="size-10 rounded-xl bg-white border border-border flex items-center justify-center text-muted-foreground/70 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
            >
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-primary/20 bg-card py-10 text-lg font-bold text-primary transition-all hover:bg-primary/[0.02] hover:border-primary/40 active:scale-[0.99] group shadow-sm"
          aria-label="Yeni İlan Ver"
        >
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
          <p className="mt-3 text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
            Hayalindeki arabayı satmak ya da yenisini almak için hemen ilk adımını at.
          </p>
        </div>
      )}

      {listings.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 bg-muted/30 p-2 rounded-2xl border border-border/40">
            <div className="flex flex-wrap items-center justify-between gap-4 px-3 py-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
                >
                  {allPageSelected ? (
                    <CheckSquare size={20} className="text-primary" />
                  ) : (
                    <Square size={20} className="text-border" />
                  )}
                  Tümünü Seç ({paginatedListings.length})
                </button>

                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="w-px h-4 bg-border mx-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkArchive}
                      disabled={isBulkArchiving}
                      className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest bg-slate-900 border-slate-800 text-white hover:bg-black rounded-xl"
                    >
                      {isBulkArchiving ? (
                        <Loader2 className="size-3 animate-spin mr-2" />
                      ) : (
                        <Archive size={14} className="mr-2" />
                      )}
                      Arşivle ({selectedIds.length})
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          disabled={isBulkArchiving}
                          className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          SİL
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl border-none p-8">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-bold tracking-tight">
                            İlanları Kalıcı Sil
                          </AlertDialogTitle>
                          <AlertDialogDescription className="font-medium text-muted-foreground mt-2">
                            {selectedIds.length} ilanı kalıcı olarak silmek istediğinize emin
                            misiniz? Arşivlenmiş olmayan ilanlar silinemez.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8">
                          <AlertDialogCancel className="rounded-xl h-12 px-6">
                            Vazgeç
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-rose-600 hover:bg-rose-700 rounded-xl h-12 px-6"
                            onClick={handleBulkDelete}
                          >
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
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Sayfa:
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer"
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCsv}
                  className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest border-border rounded-xl bg-card hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
                >
                  <FileSpreadsheet size={16} className="mr-2 text-blue-500" />
                  Excel İndir
                </Button>
              </div>
            </div>
          </div>

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

          <ListingPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalListings={listings.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}

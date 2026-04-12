"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Archive, ArrowUpCircle, Loader2, Pencil, Plus, Rocket, RotateCcw, ShieldCheck, X, CheckSquare, Square, FileSpreadsheet } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface MyListingsPanelProps {
  activeEditId?: string;
  listings: Listing[];
  children?: React.ReactNode;
}

const statusLabelMap: Record<Listing["status"], string> = {
  approved: "YayÄ±nda",
  archived: "ArÅŸivde",
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
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [bumpMessage, setBumpMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkArchiving, setIsBulkArchiving] = useState(false);

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
        setArchiveError(payload?.error?.message ?? "Ä°lan arÅŸive alÄ±namadÄ±.");
        return;
      }

      router.refresh();
    } finally {
      setArchivingId(null);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkArchiving(true);
    setArchiveError(null);

    try {
      const response = await fetch("/api/listings/bulk-archive", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json();

      if (payload.success) {
        setSelectedIds([]);
        router.refresh();
      } else {
        setArchiveError(payload.message || "Toplu arÅŸivleme sÄ±rasÄ±nda hata oluÅŸtu.");
      }
    } catch (error) {
      setArchiveError("Bir hata oluÅŸtu.");
    } finally {
      setIsBulkArchiving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`${selectedIds.length} ilanı kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    
    setIsBulkArchiving(true);
    try {
      const response = await fetch("/api/listings/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json();

      if (payload.success) {
        setSelectedIds([]);
        router.refresh();
      } else {
        setArchiveError(payload.message || "Toplu silme sırasında hata oluştu.");
      }
    } catch (error) {
      setArchiveError("Bir hata oluştu.");
    } finally {
      setIsBulkArchiving(false);
    }
  };

  const handleBulkDraft = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkArchiving(true);
    try {
      const response = await fetch("/api/listings/bulk-draft", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json();
      if (payload.success) {
        setSelectedIds([]);
        router.refresh();
      } else { setArchiveError(payload.message); }
    } catch (e) { setArchiveError("Hata oluştu."); } finally { setIsBulkArchiving(false); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === listings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(listings.map(l => l.id));
    }
  };

  const handleBump = async (listingId: string) => {
    setBumpingId(listingId);
    setBumpMessage(null);

    try {
      const response = await fetch(`/api/listings/${listingId}/bump`, { method: "POST" });
      const payload = await response.json().catch(() => null) as { success?: boolean; message?: string; error?: { message: string } } | null;

      if (!response.ok || !payload?.success) {
        setBumpMessage(payload?.error?.message ?? "Ä°lan yenilenemedi.");
        return;
      }

      setBumpMessage(payload.message ?? "Ä°lan yenilendi!");
      router.refresh();
    } finally {
      setBumpingId(null);
    }
  };
  
  const handleVerifyEIDS = async (id: string) => {
    setVerifyingId(id);
    try {
      const response = await fetch(`/api/listings/${id}/verify-eids`, {
        method: "POST",
      });
      const result = await response.json();
      
      if (result.success) {
        router.refresh();
      } else {
        alert(result.message || "DoÄŸrulama baÅŸarÄ±sÄ±z oldu.");
      }
    } catch (error) {
      alert("Bir hata oluÅŸtu.");
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {archiveError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-bold">
          {archiveError}
        </p>
      ) : null}

      {bumpMessage ? (
        <p className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 font-bold">
          {bumpMessage}
        </p>
      ) : null}

      {showForm && children && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-black uppercase italic italic tracking-tighter">
              {activeEditId ? "Ä°lanÄ± DÃ¼zenle" : "Yeni Ä°lan Ver"}
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 py-4 text-base font-bold text-primary transition-all hover:bg-primary/10 active:scale-[0.98]"
        >
          <Plus className="size-5" />
          YENÄ° Ä°LAN VER
        </button>
      )}

      {listings.length === 0 && !showForm && (
        <div className="rounded-[2rem] border border-dashed border-slate-200 p-12 text-center bg-white shadow-sm">
          <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
             <Plus size={32} />
          </div>
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-400">HenÃ¼z Ä°lanÄ±n Yok</h3>
          <p className="mt-1 text-sm text-slate-400 font-medium tracking-tight">Hemen ilk arabanÄ± ekleyerek satÄ±ÅŸa baÅŸla!</p>
        </div>
      )}

      {listings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-4">
               <button 
                 onClick={toggleSelectAll}
                 className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors"
               >
                 {selectedIds.length === listings.length ? <CheckSquare size={16} /> : <Square size={16} />}
                 TÃ¼mÃ¼nÃ¼ SeÃ§ ({listings.length})
               </button>
               {selectedIds.length > 0 && (
                 <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleBulkArchive}
                      disabled={isBulkArchiving}
                      className="h-8 px-3 text-[10px] font-black uppercase tracking-tighter italic"
                    >
                      {isBulkArchiving ? <Loader2 className="size-3 animate-spin mr-1" /> : <Archive size={12} className="mr-1" />}
                      {selectedIds.length} Ä°LANÄ± ARÅÄ°VLE
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleBulkDelete}
                      disabled={isBulkArchiving || !selectedIds.every(id => listings.find(l => l.id === id)?.status === "archived")}
                      className="h-8 px-3 text-[10px] font-black uppercase tracking-tighter italic border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      {isBulkArchiving ? <Loader2 className="size-3 animate-spin mr-1" /> : <X size={12} className="mr-1" />}
                      SİL
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleBulkDraft}
                      disabled={isBulkArchiving}
                      className="h-8 px-3 text-[10px] font-black uppercase tracking-tighter italic border-amber-200 text-amber-600 hover:bg-amber-50"
                    >
                      {isBulkArchiving ? <Loader2 className="size-3 animate-spin mr-1" /> : <RotateCcw size={12} className="mr-1" />}
                      TASLAĞA ÇEK
                    </Button>
                 </div>
               )}
            </div>
            <div className="flex items-center gap-2">
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const headers = ["title", "brand", "model", "year", "mileage", "fuel_type", "transmission", "price", "city", "district", "whatsapp_phone", "description", "vin"];
                    const csvContent = [
                      headers.join(","),
                      ...listings.map(l => [
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
                        l.vin || ""
                      ].join(","))
                    ].join("\n");
                    
                    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.setAttribute("download", `oto-burada-ilanlarim-${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="h-8 px-3 text-[10px] font-black uppercase tracking-tighter italic border-2 rounded-xl"
               >
                 <FileSpreadsheet size={12} className="mr-1.5" />
                 LÄ°STEYÄ° CSV Ä°NDÄ°R
               </Button>
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">
                 {listings.length} Toplam Ä°lan
               </h3>
            </div>
          </div>

          <div className="space-y-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isSelected={selectedIds.includes(listing.id)}
                onToggleSelect={() => toggleSelect(listing.id)}
                isArchiving={archivingId === listing.id}
                isBumping={bumpingId === listing.id}
                isVerifying={verifyingId === listing.id}
                currentTime={currentTime}
                onArchive={handleArchive}
                onBump={handleBump}
                onVerifyEIDS={handleVerifyEIDS}
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
  isSelected,
  onToggleSelect,
  isArchiving,
  isBumping,
  currentTime,
  onArchive,
  onBump,
  onVerifyEIDS,
  isVerifying,
}: {
  listing: Listing;
  isSelected: boolean;
  onToggleSelect: () => void;
  isArchiving: boolean;
  isBumping: boolean;
  currentTime: number;
  onArchive: (id: string) => void;
  onBump: (id: string) => void;
  onVerifyEIDS: (id: string) => Promise<void>;
  isVerifying: boolean;
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
    <div className={`group flex gap-3 rounded-[1.5rem] border transition-all duration-300 ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md'} p-3 ${isArchived ? "opacity-60" : ""}`}>
      {/* Checkbox Overlay for Selection */}
      <div className="flex items-center pr-1">
         <Checkbox 
           checked={isSelected} 
           onCheckedChange={onToggleSelect} 
           className="size-5 rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
         />
      </div>

      <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
        {listing.images?.[0]?.url ? (
          <Image
            src={listing.images[0].url}`n            alt=""`n            fill`n            className="object-cover group-hover:scale-105 transition-transform duration-500"`n            placeholder={listing.images[0].placeholderBlur ? "blur" : "empty"}`n            blurDataURL={listing.images[0].placeholderBlur ?? undefined}`n          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
             <Rocket size={24} />
          </div>
        )}
        {listing.featured && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-lg bg-amber-500 text-white text-[8px] font-black uppercase tracking-tighter">
             VÄ°TRÄ°N
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 flex flex-col pt-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[9px] font-black uppercase italic tracking-widest px-2 py-0.5 rounded-full border ${statusClassMap[listing.status]} shadow-sm`}>
            {statusLabelMap[listing.status]}
          </span>
          {listing.eidsVerificationJson && (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700 italic tracking-tighter">
              <ShieldCheck className="size-2.5" />
              EÄ°DS DOÄRULANDI
            </span>
          )}
        </div>
        <p className="font-bold text-slate-900 truncate tracking-tight text-sm line-clamp-1">{listing.title}</p>
        <p className="text-xl font-black text-slate-900 tracking-tighter leading-tight">
          â‚º{formatCurrency(listing.price)}
        </p>
        <div className="mt-auto flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
          <span>{listing.year}</span>
          <span className="text-slate-200">|</span>
          <span>{formatNumber(listing.mileage)} km</span>
          <span className="text-slate-200">|</span>
          <span className="truncate">{listing.city}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 justify-center ml-2 border-l border-slate-50 pl-4 py-1">
        <Link
          href={`/dashboard/listings?edit=${listing.id}`}
          className="flex items-center justify-center size-9 rounded-xl bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-all shadow-sm"
          title="DÃ¼zenle"
        >
          <Pencil className="size-4" />
        </Link>

        {isApproved && (
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-center size-9 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                title="HÄ±zlandÄ±r (Doping)"
              >
                <Rocket className="size-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl rounded-[2rem] border-none">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Ä°lanÄ±nÄ± <span className="text-primary">GÃ¶klerde</span> GÃ¶r</DialogTitle>
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
            className="flex items-center justify-center size-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-30 shadow-sm"
            title={canBump ? "Ä°lanÄ± Ã¼ste taÅŸÄ±" : `${bumpCooldownDays} gÃ¼n beklemelisin`}
          >
            {isBumping ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
               <ArrowUpCircle className="size-4" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => onArchive(listing.id)}
          disabled={isArchiving}
          className={`flex items-center justify-center size-9 rounded-xl ${isArchived ? 'bg-slate-50 text-slate-300' : 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white'} transition-all disabled:opacity-30 shadow-sm`}
          title={isArchived ? "ArÅŸivde" : "ArÅŸivle"}
        >
          {isArchiving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isArchived ? (
            <RotateCcw className="size-4" />
          ) : (
            <Archive className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}



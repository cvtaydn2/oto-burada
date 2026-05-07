"use client";

import { Archive, CheckCircle2, Eye, MoreHorizontal, Trash2, XSquare, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { forceActionOnListing } from "@/features/admin-moderation/services/inventory";
import { ListingPromoBadges } from "@/features/marketplace/components/listing-promo-badges";
import { getListingDopingDisplayItems } from "@/features/marketplace/lib/utils";
import { formatCurrency, formatNumber, supabaseImageUrl } from "@/features/shared/lib";
import { trust } from "@/features/shared/lib/ui-strings";
import { Badge } from "@/features/ui/components/badge";
import { Button } from "@/features/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/ui/components/dropdown-menu";
import { Listing } from "@/types";

interface InventoryTableProps {
  listings: Listing[];
  adminUserId: string;
}

export function InventoryTable({ listings, adminUserId }: InventoryTableProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (
    listingId: string,
    action: "archive" | "delete" | "approve" | "reject"
  ) => {
    setIsLoading(true);
    try {
      if (action === "approve" || action === "reject") {
        // Use the moderation API so audit logs and notifications fire
        const res = await fetch(`/api/admin/listings/${listingId}/moderate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.error?.message ?? "İşlem başarısız");
        }
      } else {
        await forceActionOnListing(listingId, action, adminUserId);
      }
      toast.success("İşlem başarıyla gerçekleştirildi");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "İşlem başarısız oldu";
      toast.error("İşlem hatası: " + message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/30">
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              İlan
            </th>
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Fiyat
            </th>
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Durum
            </th>
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Doping
            </th>
            <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {listings.map((listing, idx) => (
            <tr key={listing.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative size-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {listing.images?.[0] ? (
                      <Image
                        src={supabaseImageUrl(listing.images[0].url, 128, 70)}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                        priority={idx < 5}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Zap size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-900 truncate max-w-[180px] sm:max-w-[240px]">
                      {listing.title}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                      {listing.brand} {listing.model} • {listing.year} •{" "}
                      {formatNumber(listing.mileage)} km
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(listing.price)}
                </span>
              </td>
              <td className="px-6 py-4">
                {listing.status === "approved" ? (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none rounded-lg text-[9px] font-bold uppercase tracking-tighter">
                    {trust.admin.listingStatus.approved}
                  </Badge>
                ) : listing.status === "archived" ? (
                  <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none rounded-lg text-[9px] font-bold uppercase tracking-tighter">
                    {trust.admin.listingStatus.archived}
                  </Badge>
                ) : listing.status === "rejected" ? (
                  <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none rounded-lg text-[9px] font-bold uppercase tracking-tighter">
                    {trust.admin.listingStatus.rejected}
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none rounded-lg text-[9px] font-bold uppercase tracking-tighter">
                    {trust.admin.listingStatus.pending}
                  </Badge>
                )}
              </td>
              <td className="px-6 py-4">
                <ListingPromoBadges
                  items={getListingDopingDisplayItems(listing)}
                  limit={2}
                  size="sm"
                  variant="soft"
                />
              </td>
              <td className="px-6 py-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px] rounded-xl">
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">
                      İlan Kontrolü
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a
                        href={`/listing/${listing.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer gap-2 font-bold"
                      >
                        <Eye size={14} />
                        İlanı Görüntüle
                      </a>
                    </DropdownMenuItem>

                    {listing.seller?.businessSlug && (
                      <DropdownMenuItem asChild>
                        <a
                          href={`/galeri/${listing.seller.businessSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer gap-2 font-bold text-blue-600"
                        >
                          <Eye size={14} />
                          Galeriyi Görüntüle
                        </a>
                      </DropdownMenuItem>
                    )}

                    {listing.status !== "approved" && (
                      <DropdownMenuItem
                        onClick={() => handleAction(listing.id, "approve")}
                        className="cursor-pointer gap-2 font-bold text-emerald-600"
                      >
                        <CheckCircle2 size={14} />
                        Hemen Onayla
                      </DropdownMenuItem>
                    )}

                    {listing.status === "approved" && (
                      <DropdownMenuItem
                        onClick={() => handleAction(listing.id, "archive")}
                        className="cursor-pointer gap-2 font-bold text-slate-600"
                      >
                        <Archive size={14} />
                        Yayından Kaldır
                      </DropdownMenuItem>
                    )}

                    {listing.status !== "rejected" && (
                      <DropdownMenuItem
                        onClick={() => handleAction(listing.id, "reject")}
                        className="cursor-pointer gap-2 font-bold text-amber-600"
                      >
                        <XSquare size={14} />
                        Reddet
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleAction(listing.id, "delete")}
                      className="cursor-pointer gap-2 font-bold text-rose-600"
                    >
                      <Trash2 size={14} />
                      Kalıcı Olarak Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { ChevronRight, ClipboardList, Eye, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { trust } from "@/lib/constants/ui-strings";
import { cn } from "@/lib/utils";

interface Listing {
  id: string;
  slug: string;
  title: string;
  price: number;
  year: number;
  brand: string;
  status: string;
  viewCount?: number;
  images: { url: string }[];
}

interface DashboardListingsTableProps {
  listings: Listing[];
}

export function DashboardListingsTable({ listings }: DashboardListingsTableProps) {
  if (listings.length === 0) {
    return (
      <div className="py-20 text-center bg-card rounded-2xl border border-dashed border-border">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground/30">
          <ClipboardList size={32} />
        </div>
        <h4 className="text-lg font-bold text-foreground tracking-tight">İlan bulunamadı</h4>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Henüz ilan yayınlamamışsınız.
        </p>
        <Button
          className="mt-8 rounded-xl h-11 px-10 text-[10px] font-bold uppercase tracking-widest shadow-sm shadow-primary/20"
          asChild
        >
          <Link href="/dashboard/listings?create=true">İLK İLANINI YAYINLA</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 lg:p-8 shadow-sm">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground tracking-tight">Son İlanlar</h3>
          <p className="text-xs font-medium text-muted-foreground">
            Aktif ilanlarının performansını buradan izle.
          </p>
        </div>
        <Link
          href="/dashboard/listings"
          className="flex items-center gap-2 rounded-xl bg-muted h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-foreground transition-all hover:bg-muted/80"
        >
          TÜMÜ
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="-mx-6 overflow-x-auto px-6 lg:mx-0 lg:px-0">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
              <th className="pb-4 text-left font-bold">ARAÇ</th>
              <th className="pb-4 text-left font-bold">FİYAT</th>
              <th className="pb-4 text-left font-bold">DURUM</th>
              <th className="pb-4 text-right font-bold">AKSİYON</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {listings.slice(0, 5).map((listing) => (
              <tr key={listing.id} className="group hover:bg-muted/20 transition-colors">
                <td className="py-4 pr-4">
                  <Link href={`/listing/${listing.slug}`} className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                      <Image
                        src={listing.images[0]?.url || "https://placehold.co/100x75?text=Ara%C3%A7"}
                        alt={listing.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-bold text-foreground text-sm leading-tight transition-colors group-hover:text-primary tracking-tight">
                        {listing.title}
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-wider">
                        {listing.year} &middot; {listing.brand}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="py-4">
                  <div className="font-bold text-foreground text-sm tracking-tight">
                    {new Intl.NumberFormat("tr-TR").format(listing.price)} ₺
                  </div>
                </td>
                <td className="py-4">
                  <div
                    className={cn(
                      "inline-flex items-center rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest",
                      listing.status === "approved"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : listing.status === "pending"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-muted text-muted-foreground/60 border border-border"
                    )}
                  >
                    {trust.admin.listingStatus[
                      listing.status as keyof typeof trust.admin.listingStatus
                    ] || listing.status}
                  </div>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                      <Eye size={12} className="text-muted-foreground/20" />
                      {listing.viewCount ?? 0}
                    </div>
                    <Link
                      href={`/dashboard/listings?edit=${listing.id}`}
                      className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-all hover:bg-foreground hover:text-background"
                    >
                      <Settings size={14} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

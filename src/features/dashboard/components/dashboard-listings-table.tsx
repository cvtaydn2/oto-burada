import { CarFront, ChevronRight, ClipboardList, Eye, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { trust } from "@/lib/ui-strings";
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
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">Son İlanlar</h3>
          <p className="text-xs font-medium text-muted-foreground">
            Aktif ilanlarının performansını buradan izle.
          </p>
        </div>
        <Link
          href="/dashboard/listings"
          className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-muted px-5 text-[10px] font-bold uppercase tracking-widest text-foreground transition-all hover:bg-muted/80"
        >
          TÜMÜ
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="space-y-3 md:hidden">
        {listings.slice(0, 5).map((listing) => (
          <article
            key={listing.id}
            className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <Link
                href={`/listing/${listing.slug}`}
                className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
              >
                {listing.images?.[0]?.url ? (
                  <Image
                    src={listing.images[0].url}
                    alt={listing.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-muted">
                    <CarFront size={20} className="text-muted-foreground/30" />
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <Link
                    href={`/listing/${listing.slug}`}
                    className="line-clamp-2 text-sm font-bold leading-5 tracking-tight text-foreground"
                  >
                    {listing.title}
                  </Link>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                    {listing.year} &middot; {listing.brand}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="text-sm font-bold tracking-tight text-foreground">
                    {new Intl.NumberFormat("tr-TR").format(listing.price)} ₺
                  </div>
                  <div
                    className={cn(
                      "inline-flex items-center rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest",
                      listing.status === "approved"
                        ? "border border-emerald-100 bg-emerald-50 text-emerald-600"
                        : listing.status === "pending"
                          ? "border border-amber-100 bg-amber-50 text-amber-600"
                          : "border border-border bg-muted text-muted-foreground/60"
                    )}
                  >
                    {trust.admin.listingStatus[
                      listing.status as keyof typeof trust.admin.listingStatus
                    ] || listing.status}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                    <Eye size={12} className="text-muted-foreground/20" />
                    {listing.viewCount ?? 0}
                  </div>
                  <Link
                    href={`/dashboard/listings?edit=${listing.id}`}
                    className="flex h-9 items-center justify-center rounded-xl bg-muted px-3 text-xs font-semibold text-muted-foreground transition-all hover:bg-foreground hover:text-background"
                  >
                    Düzenle
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="-mx-6 hidden overflow-x-auto px-6 md:block lg:mx-0 lg:px-0">
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
              <tr key={listing.id} className="group transition-colors hover:bg-muted/20">
                <td className="py-4 pr-4">
                  <Link href={`/listing/${listing.slug}`} className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                      {listing.images?.[0]?.url ? (
                        <Image
                          src={listing.images[0].url}
                          alt={listing.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-muted">
                          <CarFront size={20} className="text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
                        {listing.title}
                      </div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        {listing.year} &middot; {listing.brand}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="py-4">
                  <div className="text-sm font-bold tracking-tight text-foreground">
                    {new Intl.NumberFormat("tr-TR").format(listing.price)} ₺
                  </div>
                </td>
                <td className="py-4">
                  <div
                    className={cn(
                      "inline-flex items-center rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest",
                      listing.status === "approved"
                        ? "border border-emerald-100 bg-emerald-50 text-emerald-600"
                        : listing.status === "pending"
                          ? "border border-amber-100 bg-amber-50 text-amber-600"
                          : "border border-border bg-muted text-muted-foreground/60"
                    )}
                  >
                    {trust.admin.listingStatus[
                      listing.status as keyof typeof trust.admin.listingStatus
                    ] || listing.status}
                  </div>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
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

"use client";

import {
  Archive,
  CheckCircle2,
  Eye,
  LoaderCircle,
  MoreHorizontal,
  Trash2,
  TriangleAlert,
  XSquare,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { forceActionOnListing } from "@/features/admin-moderation/services/inventory";
import { ListingPromoBadges } from "@/features/marketplace/components/listing-promo-badges";
import { getListingDopingDisplayItems } from "@/features/marketplace/lib/utils";
import { trust } from "@/lib/ui-strings";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { supabaseImageUrl } from "@/lib/utils/image";
import { Listing } from "@/types";

interface InventoryTableProps {
  listings: Listing[];
  adminUserId: string;
}

type InventoryAction = "archive" | "delete" | "approve" | "reject";

interface PendingAction {
  action: InventoryAction;
  listing: Listing;
}

const actionCopy: Record<
  InventoryAction,
  {
    title: string;
    description: string;
    confirmLabel: string;
    confirmClassName?: string;
    icon: typeof CheckCircle2;
  }
> = {
  approve: {
    title: "İlanı onayla",
    description:
      "Bu işlem ilanı yayına alır ve moderasyon kaydını günceller. İlanın içerik ve fiyat doğruluğunu yeniden kontrol ettiğinden emin ol.",
    confirmLabel: "Onayla",
    confirmClassName: "bg-emerald-600 text-white hover:bg-emerald-700",
    icon: CheckCircle2,
  },
  archive: {
    title: "İlanı yayından kaldır",
    description:
      "Bu işlem ilanı arşive taşır. Canlı görünürlüğü kapanır ancak kayıt sistemde tutulur ve daha sonra yeniden değerlendirilebilir.",
    confirmLabel: "Yayından kaldır",
    confirmClassName: "bg-slate-900 text-white hover:bg-slate-800",
    icon: Archive,
  },
  reject: {
    title: "İlanı reddet",
    description:
      "Bu işlem ilanı reddedilmiş duruma geçirir. Gerekirse önce ilan detayını açıp problemli alanları tekrar doğrula.",
    confirmLabel: "Reddet",
    confirmClassName: "bg-amber-500 text-white hover:bg-amber-600",
    icon: XSquare,
  },
  delete: {
    title: "İlanı kalıcı olarak sil",
    description:
      "Bu işlem geri alınamaz. Sadece açıkça hatalı, spam veya politika ihlali içeren ilanlarda kullanılmalıdır.",
    confirmLabel: "Kalıcı olarak sil",
    confirmClassName: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    icon: Trash2,
  },
};

function getStatusBadge(status: Listing["status"]) {
  if (status === "approved") {
    return {
      label: trust.admin.listingStatus.approved,
      className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none",
    };
  }

  if (status === "archived") {
    return {
      label: trust.admin.listingStatus.archived,
      className: "bg-slate-100 text-slate-600 hover:bg-slate-100 border-none",
    };
  }

  if (status === "rejected") {
    return {
      label: trust.admin.listingStatus.rejected,
      className: "bg-rose-100 text-rose-700 hover:bg-rose-100 border-none",
    };
  }

  return {
    label: trust.admin.listingStatus.pending,
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100 border-none",
  };
}

export function InventoryTable({ listings, adminUserId }: InventoryTableProps) {
  const router = useRouter();
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const listingCountLabel = useMemo(
    () => `${listings.length} ilan listeleniyor`,
    [listings.length]
  );

  const handleAction = async (listingId: string, action: InventoryAction) => {
    setActiveActionKey(`${listingId}:${action}`);
    try {
      if (action === "approve" || action === "reject") {
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
      setPendingAction(null);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "İşlem başarısız oldu";
      toast.error("İşlem hatası: " + message);
    } finally {
      setActiveActionKey(null);
    }
  };

  const renderActionsMenu = (listing: Listing) => {
    const busy = activeActionKey?.startsWith(`${listing.id}:`) ?? false;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-9 w-9 rounded-xl border border-transparent p-0 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
            disabled={busy}
            aria-label={`${listing.title} için işlemleri aç`}
          >
            {busy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px] rounded-2xl border-border/70 p-2">
          <DropdownMenuLabel className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
            Güvenli işlem menüsü
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a
              href={`/listing/${listing.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer gap-2 rounded-xl px-2 py-2 font-semibold"
            >
              <Eye size={14} />
              İlanı görüntüle
            </a>
          </DropdownMenuItem>

          {listing.seller?.businessSlug ? (
            <DropdownMenuItem asChild>
              <a
                href={`/galeri/${listing.seller.businessSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer gap-2 rounded-xl px-2 py-2 font-semibold text-blue-600"
              >
                <Eye size={14} />
                Galeriyi görüntüle
              </a>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          {listing.status !== "approved" ? (
            <DropdownMenuItem
              onClick={() => setPendingAction({ listing, action: "approve" })}
              className="cursor-pointer gap-2 rounded-xl px-2 py-2 font-semibold text-emerald-700 focus:text-emerald-700"
            >
              <CheckCircle2 size={14} />
              Onay akışını başlat
            </DropdownMenuItem>
          ) : null}

          {listing.status === "approved" ? (
            <DropdownMenuItem
              onClick={() => setPendingAction({ listing, action: "archive" })}
              className="cursor-pointer gap-2 rounded-xl px-2 py-2 font-semibold text-slate-700"
            >
              <Archive size={14} />
              Yayından kaldır
            </DropdownMenuItem>
          ) : null}

          {listing.status !== "rejected" ? (
            <DropdownMenuItem
              onClick={() => setPendingAction({ listing, action: "reject" })}
              className="cursor-pointer gap-2 rounded-xl px-2 py-2 font-semibold text-amber-700 focus:text-amber-700"
            >
              <XSquare size={14} />
              Reddet
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setPendingAction({ listing, action: "delete" })}
            className="cursor-pointer gap-2 rounded-xl px-2 py-2 font-semibold text-destructive focus:text-destructive"
          >
            <Trash2 size={14} />
            Kalıcı silme uyarısı
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <>
      <section className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              Yayın ve envanter görünümü
            </p>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Önce ön izleme bağlantılarını kontrol et, ardından geri alınabilir işlemler ile kalıcı
              silme aksiyonunu ayrı değerlendir.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold text-foreground">
              {listingCountLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <TriangleAlert className="size-3.5" />
              Yıkıcı işlemler ek onay ister
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:hidden">
          {listings.map((listing, idx) => {
            const statusBadge = getStatusBadge(listing.status);

            return (
              <article
                key={listing.id}
                className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted">
                    {listing.images?.[0] ? (
                      <Image
                        src={supabaseImageUrl(listing.images[0].url, 160, 90)}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                        priority={idx < 4}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                        <Zap size={18} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-foreground">
                          {listing.title}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          {listing.brand} {listing.model} • {listing.year}
                        </p>
                      </div>
                      {renderActionsMenu(listing)}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                          statusBadge.className
                        )}
                      >
                        {statusBadge.label}
                      </Badge>
                      <span className="rounded-full border border-border/70 bg-muted/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {formatNumber(listing.mileage)} km
                      </span>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                        Fiyat
                      </p>
                      <p className="mt-1 text-base font-bold tracking-tight text-foreground">
                        {formatCurrency(listing.price)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                        Doping görünürlüğü
                      </p>
                      <ListingPromoBadges
                        items={getListingDopingDisplayItems(listing)}
                        limit={2}
                        size="sm"
                        variant="soft"
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-border/70 lg:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/70 bg-muted/30">
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                    İlan
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                    Fiyat
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                    Durum
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                    Doping
                  </th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-background">
                {listings.map((listing, idx) => {
                  const statusBadge = getStatusBadge(listing.status);

                  return (
                    <tr key={listing.id} className="group transition-colors hover:bg-muted/20">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
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
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                                <Zap size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block max-w-[260px] truncate text-sm font-bold text-foreground xl:max-w-[340px]">
                              {listing.title}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {listing.brand} {listing.model} • {listing.year} •{" "}
                              {formatNumber(listing.mileage)} km
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground">
                        {formatCurrency(listing.price)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                            statusBadge.className
                          )}
                        >
                          {statusBadge.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <ListingPromoBadges
                          items={getListingDopingDisplayItems(listing)}
                          limit={2}
                          size="sm"
                          variant="soft"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">{renderActionsMenu(listing)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open && !activeActionKey) {
            setPendingAction(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-3xl border-border/70 p-0 overflow-hidden">
          {pendingAction ? (
            <>
              <div className="border-b border-border/70 bg-muted/20 p-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background">
                    {(() => {
                      const Icon = actionCopy[pendingAction.action].icon;
                      return <Icon className="size-5 text-foreground" />;
                    })()}
                  </div>
                  <AlertDialogHeader className="text-left">
                    <AlertDialogTitle>{actionCopy[pendingAction.action].title}</AlertDialogTitle>
                    <AlertDialogDescription className="leading-6">
                      {actionCopy[pendingAction.action].description}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                    Seçilen ilan
                  </p>
                  <p className="mt-2 text-sm font-bold text-foreground">
                    {pendingAction.listing.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pendingAction.listing.brand} {pendingAction.listing.model} •{" "}
                    {pendingAction.listing.year} • {formatCurrency(pendingAction.listing.price)}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Bu onay penceresi yanlış tıklamaları azaltmak için eklenmiştir. Özellikle kalıcı
                  silme işleminden önce ilanı yeni sekmede açarak kontrol etmen önerilir.
                </div>
              </div>

              <AlertDialogFooter className="border-t border-border/70 bg-background px-6 py-4">
                <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
                <AlertDialogAction
                  className={cn("rounded-xl", actionCopy[pendingAction.action].confirmClassName)}
                  onClick={(event) => {
                    event.preventDefault();
                    void handleAction(pendingAction.listing.id, pendingAction.action);
                  }}
                  disabled={
                    activeActionKey === `${pendingAction.listing.id}:${pendingAction.action}`
                  }
                >
                  {activeActionKey === `${pendingAction.listing.id}:${pendingAction.action}` ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {actionCopy[pendingAction.action].confirmLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import { Plus, Rocket, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useListingActions } from "@/features/marketplace/hooks/use-listing-actions";
import { EmptyState } from "@/features/shared/components/empty-state";
import { Button } from "@/features/ui/components/button";
import { type Listing } from "@/types";

import { DashboardListingCard } from "./dashboard-listing-card";
import { ListingPagination } from "./listing-pagination";
import { MyListingsAlerts } from "./my-listings-alerts";
import { MyListingsBulkActions } from "./my-listings-bulk-actions";

interface MyListingsPanelProps {
  activeEditId?: string;
  initialShowForm?: boolean;
  listings: Listing[];
  userId?: string;
  children?: React.ReactNode;
}

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
    if (currentPage > totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const id = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowForm(Boolean(activeEditId) || initialShowForm);
  }, [activeEditId, initialShowForm]);

  const pageIds = paginatedListings.map((l) => l.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
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

    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <MyListingsAlerts archiveError={archiveError} bumpMessage={bumpMessage} />

      {showForm && children && (
        <div className="animate-in fade-in zoom-in-95 rounded-3xl border border-primary/10 bg-primary/[0.02] p-5 shadow-sm duration-500 sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3 sm:mb-8 sm:flex-nowrap sm:items-center">
            <div>
              <h3 className="text-2xl font-bold text-foreground tracking-tight">
                {activeEditId ? "İlanı Düzenle" : "Yeni İlan Ver"}
              </h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                İlan bilgilerini güncelleyerek yayına hazır hale getirin.
              </p>
            </div>
            <Button
              onClick={() => setShowForm(false)}
              className="flex size-11 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground/70 shadow-sm transition-all hover:border-red-100 hover:text-red-500 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="İlan formunu kapat"
            >
              <X size={20} />
            </Button>
          </div>
          {children}
        </div>
      )}

      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="group flex w-full items-center justify-between gap-4 rounded-3xl border border-primary/15 bg-card px-5 py-5 text-left text-primary shadow-sm transition-all hover:border-primary/30 hover:bg-primary/[0.02] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.99] sm:px-6"
          aria-label="Yeni İlan Ver"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner transition-transform duration-500 group-hover:scale-105">
              <Plus size={24} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary/75">
                Yeni ilan
              </p>
              <p className="mt-1 text-base font-semibold tracking-tight text-foreground sm:text-lg">
                Yeni ilan yayınla
              </p>
              <p className="mt-1 text-sm font-normal text-muted-foreground">
                2 dakikadan kısa sürede yeni araç ilanı oluştur.
              </p>
            </div>
          </div>
          <span className="shrink-0 text-xs font-bold uppercase tracking-[0.18em] text-primary/70">
            Başlat
          </span>
        </Button>
      )}

      {listings.length === 0 && !showForm && (
        <EmptyState
          title="Henüz İlanınız Yok"
          description="Hayalindeki arabayı satmak ya da yenisini almak için hemen ilk adımını at. İlan vermek tamamen ücretsiz!"
          icon={<Rocket size={48} className="text-primary" />}
          primaryAction={{
            label: "Ücretsiz İlan Ver",
            onClick: () => setShowForm(true),
          }}
          secondaryAction={{
            label: "İlanları İncele",
            onClick: () => {},
            href: "/listings",
          }}
        />
      )}

      {listings.length > 0 && (
        <div className="space-y-6">
          <MyListingsBulkActions
            allPageSelected={allPageSelected}
            paginatedCount={paginatedListings.length}
            selectedCount={selectedIds.length}
            isBulkArchiving={isBulkArchiving}
            pageSize={pageSize}
            toggleSelectAll={toggleSelectAll}
            handleBulkArchive={handleBulkArchive}
            handleBulkDelete={handleBulkDelete}
            setPageSize={handlePageSizeChange}
            exportCsv={exportCsv}
          />

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

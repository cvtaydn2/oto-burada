<write_file path="src/features/marketplace/types/dashboard-listings.ts">
import type { BrandCatalogItem, CityOption, Listing } from "@/types";

export type DashboardListingStatus = Listing["status"];

export interface DashboardListingSummary {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  city: string;
  status: DashboardListingStatus;
  updatedAt: string | null;
  publishedAt: string | null;
  version: number;
}

export interface DashboardEditableListing {
  id: string;
  version: number;
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  price: number;
  city: string;
  district: string;
  whatsappPhone: string;
  description: string;
  vin: string | null;
  status: DashboardListingStatus;
}

export type DashboardEditState =
  | { status: "idle" }
  | { status: "loaded"; listing: DashboardEditableListing }
  | { status: "not_found" }
  | { status: "forbidden" };

export interface DashboardListingsPageData {
  listingsPage: {
    page: number;
    pageSize: number;
    totalCount: number;
    items: DashboardListingSummary[];
  };
  editing: DashboardEditState;
  references: {
    brands: BrandCatalogItem[];
    cities: CityOption[];
  };
  profile: {
    city: string | null;
    phone: string | null;
    emailVerified: boolean;
  } | null;
}
</write_file>

<write_file path="src/features/marketplace/services/dashboard-listings-actions.ts">
"use server";

import type { Listing } from "@/types";

import { getStoredListingById, getStoredUserListings } from "@/features/marketplace/services/queries/get-listings";
import { getStoredProfileById } from "@/features/profile/services/profile-records";
import { getLiveMarketplaceReferenceData } from "@/features/shared/services/live-reference-data";

import type {
  DashboardEditableListing,
  DashboardEditState,
  DashboardListingSummary,
  DashboardListingsPageData,
} from "../types/dashboard-listings";

interface GetDashboardListingsPageDataParams {
  userId: string;
  page: number;
  pageSize: number;
  editId?: string | null;
}

function toDashboardListingSummary(listing: Listing): DashboardListingSummary {
  return {
    id: listing.id,
    title: listing.title,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    price: listing.price,
    city: listing.city,
    status: listing.status,
    updatedAt: listing.updatedAt ?? null,
    publishedAt: listing.publishedAt ?? null,
    version: listing.version,
  };
}

function toDashboardEditableListing(listing: Listing): DashboardEditableListing {
  return {
    id: listing.id,
    version: listing.version,
    title: listing.title,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    mileage: listing.mileage,
    fuelType: listing.fuelType,
    transmission: listing.transmission,
    price: listing.price,
    city: listing.city,
    district: listing.district,
    whatsappPhone: listing.whatsappPhone,
    description: listing.description,
    vin: listing.vin ?? null,
    status: listing.status,
  };
}

async function resolveEditingState(userId: string, editId?: string | null): Promise<DashboardEditState> {
  if (!editId) {
    return { status: "idle" };
  }

  const listing = await getStoredListingById(editId);

  if (!listing) {
    return { status: "not_found" };
  }

  if (listing.sellerId !== userId) {
    return { status: "forbidden" };
  }

  return {
    status: "loaded",
    listing: toDashboardEditableListing(listing),
  };
}

function normalizeTotalCount(result: {
  listings?: Listing[];
  totalCount?: number | null;
  count?: number | null;
}) {
  if (typeof result.totalCount === "number") {
    return result.totalCount;
  }

  if (typeof result.count === "number") {
    return result.count;
  }

  return Array.isArray(result.listings) ? result.listings.length : 0;
}

export async function getDashboardListingsPageData({
  userId,
  page,
  pageSize,
  editId = null,
}: GetDashboardListingsPageDataParams): Promise<DashboardListingsPageData> {
  const [listingsResult, references, profile, editing] = await Promise.all([
    getStoredUserListings(userId, page, pageSize),
    getLiveMarketplaceReferenceData(),
    getStoredProfileById(userId),
    resolveEditingState(userId, editId),
  ]);

  const listings = Array.isArray(listingsResult.listings) ? listingsResult.listings : [];

  return {
    listingsPage: {
      page,
      pageSize,
      totalCount: normalizeTotalCount(listingsResult),
      items: listings.map(toDashboardListingSummary),
    },
    editing,
    references: {
      brands: references.brands,
      cities: references.cities,
    },
    profile: profile
      ? {
          city: profile.city ?? null,
          phone: profile.phone ?? null,
          emailVerified: profile.emailVerified ?? false,
        }
      : null,
  };
}
</write_file>

<write_file path="src/app/dashboard/listings/page.tsx">
import { Plus } from "lucide-react";
import Link from "next/link";

import { ListingCreateForm } from "@/components/forms/listing-create-form";
import { AccountTrustNotice } from "@/components/shared/account-trust-notice";
import { requireUser } from "@/features/auth/lib/session";
import { MyListingsPanel } from "@/features/marketplace/components/my-listings-panel";
import { getDashboardListingsPageData } from "@/features/marketplace/services/dashboard-listings-actions";
import type {
  DashboardEditableListing,
  DashboardListingsPageData,
} from "@/features/marketplace/types/dashboard-listings";
import { getStoredProfileById } from "@/features/profile/services/profile-records";
import { mergeCityOptions } from "@/features/shared/services/live-reference-data";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface DashboardListingsPageProps {
  searchParams?: Promise<{
    create?: string;
    created?: string;
    edit?: string;
    updated?: string;
    page?: string;
    pageSize?: string;
  }>;
}

function parsePositiveInt(value?: string, fallback = 1) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function clampPageSize(value?: string) {
  const parsed = parsePositiveInt(value, 10);
  return Math.min(parsed, 100);
}

function mergeBrands(
  brands: DashboardListingsPageData["references"]["brands"],
  selectedListing: DashboardEditableListing | null
) {
  if (!selectedListing?.brand) {
    return brands;
  }

  const hasBrand = brands.some((item) => item.brand === selectedListing.brand);

  if (hasBrand) {
    return brands;
  }

  return [
    ...brands,
    {
      brand: selectedListing.brand,
      slug: selectedListing.brand.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      name: selectedListing.brand,
      models: selectedListing.model ? [{ name: selectedListing.model, trims: [] }] : [],
    },
  ].sort((left, right) => left.brand.localeCompare(right.brand, "tr"));
}

export default async function DashboardListingsPage({ searchParams }: DashboardListingsPageProps) {
  const user = await requireUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const hasRequestedCreate = resolvedSearchParams?.create === "true";
  const hasCreatedPendingListing = resolvedSearchParams?.created === "pending";
  const hasUpdatedListing = resolvedSearchParams?.updated === "true";
  const editId = resolvedSearchParams?.edit ?? null;
  const page = parsePositiveInt(resolvedSearchParams?.page, 1);
  const pageSize = clampPageSize(resolvedSearchParams?.pageSize);

  const [data, sellerProfile] = await Promise.all([
    getDashboardListingsPageData({
      userId: user.id,
      page,
      pageSize,
      editId,
    }),
    getStoredProfileById(user.id),
  ]);

  const selectedListing = data.editing.status === "loaded" ? data.editing.listing : null;
  const mergedBrands = mergeBrands(data.references.brands, selectedListing);
  const mergedCities = mergeCityOptions(data.references.cities, [
    data.profile?.city ?? "",
    selectedListing?.city ?? "",
  ]);
  const isEmailVerified = data.profile?.emailVerified ?? false;
  const approvedCountOnPage = data.listingsPage.items.filter((listing) => listing.status === "approved").length;
  const isEditingExisting = data.editing.status === "loaded";

  return (
    <div className="space-y-8">
      <AccountTrustNotice seller={sellerProfile ?? null} />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">İlanlarım</h2>
          <p className="mt-1 text-sm font-medium italic text-muted-foreground">
            Toplam {data.listingsPage.totalCount} ilanın var. Bu sayfadaki{" "}
            {data.listingsPage.items.length} ilandan {approvedCountOnPage} tanesi yayında.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
              isEmailVerified
                ? "border-emerald-100 bg-emerald-50/50 text-emerald-600"
                : "border-amber-100 bg-amber-50/50 text-amber-600"
            )}
          >
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isEmailVerified ? "bg-emerald-500" : "bg-amber-500"
              )}
            />
            {isEmailVerified ? "Doğrulanmış" : "Doğrulanmadı"}
          </div>

          <Link
            href="/dashboard/listings?create=true"
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90"
            aria-label="Yeni İlan Ver"
          >
            <Plus size={18} />
            YENİ İLAN
          </Link>
        </div>
      </div>

      {data.editing.status === "not_found" && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-xs font-semibold text-amber-700">
          Düzenlemek istediğin ilan bulunamadı.
        </div>
      )}

      {data.editing.status === "forbidden" && (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4 text-xs font-semibold text-red-700">
          Bu ilanı düzenleme yetkin yok.
        </div>
      )}

      {hasCreatedPendingListing && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs font-semibold text-blue-700">
          İlanın oluşturuldu. Şu anda moderasyon incelemesinde.
        </div>
      )}

      {hasUpdatedListing && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs font-semibold text-emerald-700">
          İlanın güncellendi.
        </div>
      )}

      <MyListingsPanel
        activeEditId={selectedListing?.id}
        initialShowForm={hasRequestedCreate && !isEditingExisting}
        listings={data.listingsPage.items}
        currentPage={data.listingsPage.page}
        pageSize={data.listingsPage.pageSize}
        totalCount={data.listingsPage.totalCount}
        userId={user.id}
      >
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-8 border-b border-border/50 pb-6">
            <h3 className="text-xl font-bold text-foreground">
              {isEditingExisting ? "İlanı Düzenle" : "Hızlı İlan Oluştur"}
            </h3>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Gerekli bilgileri eksiksiz doldurarak ilanınızı yayınlayın.
            </p>
          </div>

          <ListingCreateForm
            key={selectedListing?.id ?? "create-listing"}
            initialListing={selectedListing}
            initialValues={{
              city: data.profile?.city ?? "",
              whatsappPhone: data.profile?.phone ?? "",
            }}
            brands={mergedBrands}
            cities={mergedCities}
            isEmailVerified={isEmailVerified}
          />
        </div>
      </MyListingsPanel>
    </div>
  );
}
</write_file>

<write_file path="src/components/forms/listing-create-form.tsx">
import type { DashboardEditableListing } from "@/features/marketplace/types/dashboard-listings";
import type { BrandCatalogItem, CityOption, Listing } from "@/types";

import { ListingCreateFormRenderer } from "./listing-create-form-renderer";

interface ListingCreateFormProps {
  initialValues: { city: string; whatsappPhone: string };
  brands: BrandCatalogItem[];
  cities: CityOption[];
  initialListing?: DashboardEditableListing | null;
  isEmailVerified?: boolean;
}

function adaptInitialListing(listing?: DashboardEditableListing | null): Listing | null | undefined {
  if (!listing) {
    return listing;
  }

  return listing as unknown as Listing;
}

export function ListingCreateForm({
  initialListing,
  ...props
}: ListingCreateFormProps) {
  return <ListingCreateFormRenderer {...props} initialListing={adaptInitialListing(initialListing)} />;
}
</write_file>

<write_file path="src/features/marketplace/components/my-listings-panel.tsx">
"use client";

import { Plus, Rocket, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useListingActions } from "@/features/marketplace/hooks/use-listing-actions";
import type { DashboardListingSummary } from "@/features/marketplace/types/dashboard-listings";
import type { Listing } from "@/types";

import { DashboardListingCard } from "./dashboard-listing-card";
import { ListingPagination } from "./listing-pagination";
import { MyListingsAlerts } from "./my-listings-alerts";
import { MyListingsBulkActions } from "./my-listings-bulk-actions";

interface MyListingsPanelProps {
  activeEditId?: string;
  initialShowForm?: boolean;
  listings: DashboardListingSummary[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  userId?: string;
  children?: React.ReactNode;
}

export function MyListingsPanel({
  activeEditId,
  initialShowForm = false,
  listings,
  currentPage,
  pageSize,
  totalCount,
  userId,
  children,
}: MyListingsPanelProps) {
  const [showForm, setShowForm] = useState(Boolean(activeEditId) || initialShowForm);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
  } = useListingActions(listings as unknown as Listing[], userId);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageIds = listings.map((listing) => listing.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    clearSelection();
  }, [currentPage, pageSize, clearSelection]);

  useEffect(() => {
    const id = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setShowForm(Boolean(activeEditId) || initialShowForm);
  }, [activeEditId, initialShowForm]);

  const updateQuery = (nextPage: number, nextPageSize = pageSize) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", String(nextPage));
    params.set("pageSize", String(nextPageSize));

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
  };

  const exportCsv = () => {
    const headers = ["title", "brand", "model", "year", "price", "city", "status"];

    const rows = listings.map((listing) =>
      [
        `"${listing.title.replace(/"/g, '""')}"`,
        listing.brand,
        listing.model,
        listing.year,
        listing.price,
        listing.city,
        listing.status,
      ].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute(
      "download",
      `oto-burada-ilanlarim-sayfa-${currentPage}-${new Date().toISOString().split("T")[0]}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <div className="space-y-6">
      <MyListingsAlerts archiveError={archiveError} bumpMessage={bumpMessage} />

      {showForm && children && (
        <div className="animate-in fade-in zoom-in-95 rounded-3xl border border-primary/10 bg-primary/[0.02] p-5 shadow-sm duration-500 sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3 sm:mb-8 sm:flex-nowrap sm:items-center">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
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

      {totalCount === 0 && !showForm && (
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

      {totalCount > 0 && (
        <div className="space-y-6">
          <MyListingsBulkActions
            allPageSelected={allPageSelected}
            paginatedCount={listings.length}
            selectedCount={selectedIds.length}
            isBulkArchiving={isBulkArchiving}
            pageSize={pageSize}
            toggleSelectAll={toggleSelectAll}
            handleBulkArchive={handleBulkArchive}
            handleBulkDelete={handleBulkDelete}
            setPageSize={(size) => updateQuery(1, size)}
            exportCsv={exportCsv}
          />

          <div className="grid gap-4">
            {listings.map((listing) => (
              <DashboardListingCard
                key={listing.id}
                listing={listing as unknown as Listing}
                currentTime={currentTime}
                isSelected={selectedIds.includes(listing.id)}
                isArchiving={archivingId === listing.id}
                isBumping={bumpingId === listing.id}
                onToggleSelect={() => toggleSelect(listing.id)}
                onArchive={() => handleArchive(listing.id)}
                onBump={() => handleBump(listing.id)}
                activeEditId={activeEditId}
              />
            ))}
          </div>

          <ListingPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={(nextPage) => updateQuery(nextPage, pageSize)}
          />
        </div>
      )}
    </div>
  );
}
</write_file>

<write_file path="src/features/marketplace/components/listing-pagination.tsx">
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ListingPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function ListingPagination({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
}: ListingPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(totalCount, currentPage * pageSize);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {start}-{end} / {totalCount} ilan gösteriliyor
      </p>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Önceki sayfa"
        >
          <ChevronLeft size={16} />
        </Button>

        <div className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground">
          Sayfa {currentPage} / {totalPages}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Sonraki sayfa"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
</write_file>
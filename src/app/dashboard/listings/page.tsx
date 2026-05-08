import { Plus } from "lucide-react";
import Link from "next/link";

import { requireUser } from "@/features/auth/lib/session";
import { ListingCreateForm } from "@/features/forms/components/listing-create-form";
import { MyListingsPanel } from "@/features/marketplace/components/my-listings-panel";
import { getStoredUserListings } from "@/features/marketplace/services/listing-submissions";
import { getStoredProfileById } from "@/features/profile/services/profile-records";
import { AccountTrustNotice } from "@/features/shared/components/account-trust-notice";
import {
  getLiveMarketplaceReferenceData,
  mergeCityOptions,
} from "@/features/shared/services/live-reference-data";
import { cn } from "@/lib";
import { Listing } from "@/types";

export const dynamic = "force-dynamic";
// revalidate kaldırıldı — force-dynamic ile çakışıyor

interface DashboardListingsPageProps {
  searchParams?: Promise<{
    create?: string;
    created?: string;
    edit?: string;
    updated?: string;
  }>;
}

export default async function DashboardListingsPage({ searchParams }: DashboardListingsPageProps) {
  const user = await requireUser();
  const metadata = user.user_metadata as {
    city?: string;
    phone?: string;
  };
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const hasRequestedCreate = resolvedSearchParams?.create === "true";
  const editId = resolvedSearchParams?.edit;
  const hasRequestedEdit = Boolean(editId);
  const hasCreatedPendingListing = resolvedSearchParams?.created === "pending";
  const hasUpdatedListing = resolvedSearchParams?.updated === "true";

  // Paralel fetch
  // PERFORMANCE FIX: Explicit limit to avoid loading too many listings in dashboard overview
  // UX FIX: Explicitly fetch the listing being edited to avoid state loss if it's not in the first 20.
  const [listingsResult, references, profile, specificListing] = await Promise.all([
    getStoredUserListings(user.id, 1, 20), // Limit to 20 listings for dashboard
    getLiveMarketplaceReferenceData(),
    getStoredProfileById(user.id),
    editId
      ? import("@/features/marketplace/services/queries/get-listings").then((m) =>
          m.getStoredListingById(editId)
        )
      : Promise.resolve(null),
  ]);

  const storedListings = listingsResult.listings;

  // UX FIX: Priority given to specificListing if it belongs to the user
  const selectedListing =
    specificListing && specificListing.sellerId === user.id
      ? specificListing
      : editId
        ? (storedListings.find((l: Listing) => l.id === editId) ?? null)
        : null;
  const mergedBrands = references.brands.some((item) => item.brand === selectedListing?.brand)
    ? references.brands
    : selectedListing?.brand
      ? [
          ...references.brands,
          {
            brand: selectedListing.brand,
            slug: selectedListing.brand.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            name: selectedListing.brand,
            models: selectedListing.model ? [{ name: selectedListing.model, trims: [] }] : [],
          },
        ].sort((left, right) => left.brand.localeCompare(right.brand, "tr"))
      : references.brands;
  const isEmailVerified = profile?.emailVerified ?? false;

  const mergedCities = mergeCityOptions(references.cities, [
    metadata.city ?? "",
    selectedListing?.city ?? "",
    profile?.city ?? "",
  ]);

  const isEditingExisting = selectedListing !== null;

  return (
    <div className="space-y-8">
      <AccountTrustNotice seller={profile} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">İlanlarım</h2>
          <p className="mt-1 text-sm text-muted-foreground font-medium italic">
            Toplam {storedListings.length} ilandan{" "}
            {storedListings.filter((l: Listing) => l.status === "approved").length} tanesi yayında.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] uppercase font-bold tracking-widest transition-all",
              isEmailVerified
                ? "bg-emerald-50/50 border-emerald-100 text-emerald-600"
                : "bg-amber-50/50 border-amber-100 text-amber-600"
            )}
          >
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isEmailVerified ? "bg-emerald-500" : "bg-amber-500"
              )}
            />
            {isEmailVerified ? "Doğrulanmış" : "Doğrulanmadı"}
          </div>
          <Link
            href="/dashboard/listings?create=true"
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
            aria-label="Yeni İlan Ver"
          >
            <Plus size={18} />
            YENİ İLAN
          </Link>
        </div>
      </div>

      {hasRequestedEdit && !isEditingExisting && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-xs text-amber-700 font-semibold flex items-center gap-3">
          İlan bulunamadı veya yetkiniz yok.
        </div>
      )}

      {hasCreatedPendingListing && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-700 font-semibold flex items-center gap-3">
          İlanın oluşturuldu. Şu anda moderasyon incelemesinde.
        </div>
      )}

      {hasUpdatedListing && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs text-emerald-700 font-semibold flex items-center gap-3">
          İlanın güncellendi.
        </div>
      )}

      <MyListingsPanel
        activeEditId={selectedListing?.id}
        initialShowForm={hasRequestedCreate && !isEditingExisting}
        listings={storedListings}
        userId={user.id}
      >
        <div className="mt-8 bg-card rounded-2xl border border-border p-8 shadow-sm">
          <div className="mb-8 pb-6 border-b border-border/50">
            <h3 className="text-xl font-bold text-foreground">
              {isEditingExisting ? "İlanı Düzenle" : "Hızlı İlan Oluştur"}
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              Gerekli bilgileri eksiksiz doldurarak ilanınızı yayınlayın.
            </p>
          </div>
          <ListingCreateForm
            key={selectedListing?.id ?? "create-listing"}
            initialListing={selectedListing}
            initialValues={{
              city: metadata.city ?? "",
              whatsappPhone: metadata.phone ?? "",
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

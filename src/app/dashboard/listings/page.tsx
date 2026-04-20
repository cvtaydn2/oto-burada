import Link from "next/link";
import { MyListingsPanel } from "@/components/listings/my-listings-panel";
import { ListingCreateForm } from "@/components/forms/listing-create-form";
import { requireUser } from "@/lib/auth/session";
import { getStoredUserListings } from "@/services/listings/listing-submissions";
import { getStoredProfileById } from "@/services/profile/profile-records";
import { getLiveMarketplaceReferenceData, mergeCityOptions } from "@/services/reference/live-reference-data";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const hasRequestedEdit = Boolean(resolvedSearchParams?.edit);
  const hasCreatedPendingListing = resolvedSearchParams?.created === "pending";
  const hasUpdatedListing = resolvedSearchParams?.updated === "true";

  // Paralel fetch
  const [storedListings, references, profile] = await Promise.all([
    getStoredUserListings(user.id),
    getLiveMarketplaceReferenceData(),
    getStoredProfileById(user.id),
  ]);
  const selectedListing = resolvedSearchParams?.edit
    ? storedListings.find((l) => l.id === resolvedSearchParams.edit) ?? null
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">İlanlarım</h2>
          <p className="mt-1 text-sm text-muted-foreground font-medium italic">
            Toplam {storedListings.length} ilandan {storedListings.filter((l) => l.status === "approved").length} tanesi yayında.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all",
            isEmailVerified 
              ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm shadow-emerald-50/50" 
              : "bg-amber-50 border-amber-100 text-amber-600 shadow-sm shadow-amber-50/50"
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isEmailVerified ? "bg-emerald-500" : "bg-amber-500")} />
            {isEmailVerified ? "E-posta Doğrulandı" : "E-posta Doğrulanmadı"}
          </div>
          <Link
            href="/dashboard/listings?create=true"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Plus size={18} strokeWidth={3} />
            YENİ İLAN
          </Link>
        </div>
      </div>

      {hasRequestedEdit && !isEditingExisting && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 font-bold flex items-center gap-3">
          <div className="size-2 rounded-full bg-amber-500 animate-bounce" />
          İlan bulunamadı veya yetkiniz yok.
        </div>
      )}

      {hasCreatedPendingListing && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 font-bold flex items-center gap-3">
          <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
          İlanın oluşturuldu. Şu anda moderasyon incelemesinde. Sonucu bildirimlerinden takip edebilirsin.
        </div>
      )}

      {hasUpdatedListing && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 font-bold flex items-center gap-3">
          <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          İlanın güncellendi.
        </div>
      )}

      <MyListingsPanel 
        activeEditId={selectedListing?.id} 
        initialShowForm={hasRequestedCreate && !isEditingExisting}
        listings={storedListings}
      >
        <div className="mt-8 bg-card rounded-3xl border border-border p-8 shadow-sm">
          <div className="mb-8 pb-6 border-b border-border/50">
             <h3 className="text-xl font-bold text-foreground">{isEditingExisting ? "İlanı Düzenle" : "Hızlı İlan Oluştur"}</h3>
             <p className="text-sm text-muted-foreground/70 font-medium mt-1">Gerekli bilgileri eksiksiz doldurarak ilanınızı yayınlayın.</p>
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

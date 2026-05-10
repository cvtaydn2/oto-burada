import { Plus } from "lucide-react";
import type { Metadata } from "next";
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
import { buildAbsoluteUrl } from "@/features/seo/lib";
import { mergeCityOptions } from "@/features/shared/services/live-reference-data";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "İlanlarım | OtoBurada Dashboard",
  description: "Kendi ilanlarınızı oluşturun, düzenleyin ve moderasyon durumlarını yönetin.",
  alternates: {
    canonical: buildAbsoluteUrl("/dashboard/listings"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

interface DashboardListingsPageProps {
  searchParams?: Promise<{
    create?: string;
    created?: string;
    edit?: string;
    updated?: string;
    focus?: string;
    listing?: string;
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
  const createdListingId = resolvedSearchParams?.listing ?? null;
  const focusMode = resolvedSearchParams?.focus === "trust" ? "trust" : "default";
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
  const approvedCountOnPage = data.listingsPage.items.filter(
    (listing) => listing.status === "approved"
  ).length;
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
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 text-blue-900 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
                İlanın incelemeye alındı
              </p>
              <h3 className="text-lg font-semibold leading-tight text-blue-950">
                Moderasyon ekibi ilanını kontrol ediyor.
              </h3>
              <p className="max-w-2xl text-sm font-medium leading-6 text-blue-800/90">
                Bu sırada ilanın henüz yayında görünmez. İnceleme tamamlandığında uygun ilanlar
                otomatik olarak yayına alınır.
              </p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-white/70 px-4 py-3 text-xs font-semibold leading-5 text-blue-800 sm:max-w-xs">
              Fotoğraflar, açıklama ve iletişim bilgilerin net olduğu ilanlar genelde daha hızlı
              onaylanır.
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-blue-200/80 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Opsiyonel güven artırıcı adım
              </p>
              <p className="text-sm font-medium leading-6 text-blue-900/85">
                İstersen şimdi ekspertiz, hasar ve Tramer bilgilerini ekleyerek ilanını daha güven
                verici hale getirebilirsin. Bu adım zorunlu değil ve yayına girmeni bekletmez.
              </p>
            </div>
            {createdListingId ? (
              <Link
                href={`/dashboard/listings?edit=${createdListingId}&focus=trust`}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-sm transition-all hover:bg-blue-700"
              >
                Güven artırıcı detayları ekle
              </Link>
            ) : null}
          </div>
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
              {isEditingExisting ? "İlanı Düzenle" : "3 Adımda İlan Oluştur"}
            </h3>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Temel bilgileri ve en az 3 fotoğrafı ekleyin, ilanınızı moderasyon incelemesine
              gönderin.
            </p>
          </div>

          <ListingCreateForm
            key={`${selectedListing?.id ?? "create-listing"}-${focusMode}`}
            initialListing={selectedListing}
            initialValues={{
              city: data.profile?.city ?? "",
              whatsappPhone: data.profile?.phone ?? "",
            }}
            brands={mergedBrands}
            cities={mergedCities}
            isEmailVerified={isEmailVerified}
            focusMode={focusMode}
          />
        </div>
      </MyListingsPanel>
    </div>
  );
}

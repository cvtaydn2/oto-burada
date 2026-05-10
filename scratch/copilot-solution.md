<write_file path="src/features/marketplace/services/query-normalizers.ts">
import { z } from "zod";

const uuidSchema = z.string().uuid();

function getFirstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function parseCompareIdsParam(idsParam: string | string[] | undefined): string[] {
  if (!idsParam) return [];

  const raw = Array.isArray(idsParam) ? idsParam.join(",") : idsParam;

  const parsed = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => uuidSchema.safeParse(value))
    .filter((result): result is z.SafeParseSuccess<string> => result.success)
    .map((result) => result.data);

  return Array.from(new Set(parsed)).slice(0, 4);
}

export function parsePositiveIntParam(
  value: string | string[] | undefined,
  fallback: number
): number {
  const raw = getFirstValue(value);
  const parsed = Number(raw);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseBoundedIntParam(
  value: string | string[] | undefined,
  fallback: number,
  max: number
): number {
  return Math.min(parsePositiveIntParam(value, fallback), max);
}

export function parseOptionalNumberParam(
  value: string | string[] | undefined
): number | undefined {
  const raw = getFirstValue(value);

  if (!raw) return undefined;

  const parsed = Number(raw);

  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseOptionalStringParam(
  value: string | string[] | undefined
): string | undefined {
  const raw = getFirstValue(value)?.trim();

  return raw ? raw : undefined;
}

export function parseBooleanFlagParam(value: string | string[] | undefined): boolean {
  const raw = getFirstValue(value);

  if (raw === undefined) return false;

  const normalized = raw.trim().toLowerCase();

  return normalized !== "false" && normalized !== "0" && normalized !== "off";
}
</write_file>

<write_file path="src/features/marketplace/services/filter-route-resolvers.ts">
import type { BrandCatalogItem, CityOption, ListingFilters } from "@/types";

import {
  parseBooleanFlagParam,
  parseOptionalNumberParam,
  parseOptionalStringParam,
} from "@/features/marketplace/services/query-normalizers";

function resolveBrandSlugToName(
  brands: BrandCatalogItem[],
  slug: string | undefined
): string | undefined {
  if (!slug) return undefined;

  const match = brands.find((brand) => brand.slug.toLowerCase() === slug.toLowerCase());
  return match?.brand;
}

function resolveCitySlugToName(cities: CityOption[], slug: string | undefined): string | undefined {
  if (!slug) return undefined;

  const match = cities.find((city) => city.slug.toLowerCase() === slug.toLowerCase());
  return match?.city;
}

export function buildMarketplaceInitialFiltersFromRoute(params: {
  brands: BrandCatalogItem[];
  cities: CityOption[];
  searchParams?: Record<string, string | string[] | undefined>;
}): ListingFilters {
  const { brands, cities, searchParams } = params;

  const brand = resolveBrandSlugToName(
    brands,
    parseOptionalStringParam(searchParams?.brand)
  );
  const city = resolveCitySlugToName(cities, parseOptionalStringParam(searchParams?.city));
  const query = parseOptionalStringParam(searchParams?.query);
  const model = parseOptionalStringParam(searchParams?.model);
  const minPrice = parseOptionalNumberParam(searchParams?.minPrice);
  const maxPrice = parseOptionalNumberParam(searchParams?.maxPrice);
  const minYear = parseOptionalNumberParam(searchParams?.minYear);
  const maxYear = parseOptionalNumberParam(searchParams?.maxYear);
  const fuelType = parseOptionalStringParam(searchParams?.fuelType);
  const transmission = parseOptionalStringParam(searchParams?.transmission);
  const hasExpertReport = parseBooleanFlagParam(searchParams?.hasExpertReport);

  return {
    sort: "newest",
    page: 1,
    limit: 12,
    ...(brand ? { brand } : {}),
    ...(city ? { city } : {}),
    ...(query ? { query } : {}),
    ...(model ? { model } : {}),
    ...(minPrice !== undefined ? { minPrice } : {}),
    ...(maxPrice !== undefined ? { maxPrice } : {}),
    ...(minYear !== undefined ? { minYear } : {}),
    ...(maxYear !== undefined ? { maxYear } : {}),
    ...(fuelType ? { fuelType } : {}),
    ...(transmission ? { transmission } : {}),
    ...(hasExpertReport ? { hasExpertReport: true } : {}),
  };
}
</write_file>

<write_file path="src/features/marketplace/services/dashboard-listing-route-state.ts">
import type { BrandCatalogItem } from "@/types";

import {
  parseBoundedIntParam,
  parseOptionalStringParam,
} from "@/features/marketplace/services/query-normalizers";

interface DashboardListingsRouteSearchParams {
  create?: string;
  created?: string;
  edit?: string;
  updated?: string;
  page?: string;
  pageSize?: string;
}

interface MergeListingFormBrandsParams {
  brands: BrandCatalogItem[];
  selectedBrand?: string | null;
  selectedModel?: string | null;
}

export function parseDashboardListingsRouteState(
  searchParams?: DashboardListingsRouteSearchParams
) {
  const create = searchParams?.create === "true";
  const created = searchParams?.created === "pending";
  const updated = searchParams?.updated === "true";
  const editId = parseOptionalStringParam(searchParams?.edit) ?? null;
  const page = parseBoundedIntParam(searchParams?.page, 1, Number.MAX_SAFE_INTEGER);
  const pageSize = parseBoundedIntParam(searchParams?.pageSize, 10, 100);

  return {
    create,
    created,
    updated,
    editId,
    page,
    pageSize,
  };
}

export function mergeListingFormBrands({
  brands,
  selectedBrand,
  selectedModel,
}: MergeListingFormBrandsParams): BrandCatalogItem[] {
  if (!selectedBrand) {
    return brands;
  }

  const hasBrand = brands.some((item) => item.brand === selectedBrand);

  if (hasBrand) {
    return brands;
  }

  return [
    ...brands,
    {
      brand: selectedBrand,
      slug: selectedBrand.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      name: selectedBrand,
      models: selectedModel ? [{ name: selectedModel, trims: [] }] : [],
    },
  ].sort((left, right) => left.brand.localeCompare(right.brand, "tr"));
}
</write_file>

<write_file path="src/features/offers/services/offers/offer-normalizers.ts">
type RawOfferListing =
  | null
  | {
      id?: string | null;
      slug?: string | null;
      title?: string | null;
      price?: number | null;
    }
  | Array<{
      id?: string | null;
      slug?: string | null;
      title?: string | null;
      price?: number | null;
    }>;

type RawOfferStatus = "pending" | "accepted" | "rejected" | "counter_offer" | "cancelled";

type RawOffer = {
  id: string;
  listing_id: string;
  offered_price: number;
  message: string | null;
  status: string;
  counter_price: number | null;
  counter_message: string | null;
  listing?: RawOfferListing;
};

export interface OfferListItem {
  id: string;
  listingId: string;
  offeredPrice: number;
  message: string | null;
  status: RawOfferStatus;
  counterPrice: number | null;
  counterMessage: string | null;
  listing: {
    id: string;
    slug: string | null;
    title: string;
    price: number | null;
  } | null;
}

function normalizeOfferStatus(status: string): RawOfferStatus {
  if (
    status === "pending" ||
    status === "accepted" ||
    status === "rejected" ||
    status === "counter_offer" ||
    status === "cancelled"
  ) {
    return status;
  }

  return "pending";
}

function normalizeSingleListing(input: RawOfferListing | undefined): OfferListItem["listing"] {
  const candidate = Array.isArray(input) ? input[0] ?? null : input ?? null;

  if (!candidate?.id) {
    return null;
  }

  return {
    id: candidate.id,
    slug: candidate.slug ?? null,
    title: candidate.title ?? "İlan",
    price: typeof candidate.price === "number" ? candidate.price : null,
  };
}

export function normalizeOffer(raw: RawOffer): OfferListItem {
  return {
    id: raw.id,
    listingId: raw.listing_id,
    offeredPrice: raw.offered_price,
    message: raw.message ?? null,
    status: normalizeOfferStatus(raw.status),
    counterPrice: raw.counter_price ?? null,
    counterMessage: raw.counter_message ?? null,
    listing: normalizeSingleListing(raw.listing),
  };
}

export function normalizeOfferList(rawOffers: RawOffer[]): OfferListItem[] {
  return rawOffers.map(normalizeOffer);
}
</write_file>

<write_file path="src/app/(public)/(marketplace)/compare/page.tsx">
import { BarChart3, ChevronLeft, SearchX } from "lucide-react";
import Link from "next/link";

import { ListingCard } from "@/components/shared/listing-card";
import { CompareRemoveButton } from "@/features/marketplace/components/compare-remove-button";
import { CompareShareButton } from "@/features/marketplace/components/compare-share-button";
import { parseCompareIdsParam } from "@/features/marketplace/services/query-normalizers";
import { getMarketplaceListingsByIds } from "@/features/marketplace/services/marketplace-listings";
import { formatNumber, formatPrice } from "@/lib/utils/format";
import type { Listing } from "@/types";

export const dynamic = "force-dynamic";

interface ComparePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const ids = parseCompareIdsParam(resolvedSearchParams?.ids);
  const listings = ids.length > 0 ? await getMarketplaceListingsByIds(ids) : [];

  const listingsById = new Map(listings.map((listing) => [listing.id, listing]));
  const orderedListings = ids
    .map((id) => listingsById.get(id))
    .filter((listing): listing is Listing => listing !== undefined);

  const hasEnoughListingsToCompare = orderedListings.length > 1;

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-5 py-8 lg:px-6 lg:py-10">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <Link
              href="/listings"
              aria-label="İlanlara dön"
              className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-transform hover:bg-muted/30"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Link>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Araç Karşılaştırma
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">
            Araç karşılaştır
          </h1>
          <p className="mt-2.5 text-sm font-medium leading-relaxed text-muted-foreground">
            Fiyat, kilometre ve teknik özellikleri yan yana görerek daha hızlı karar ver.
          </p>
        </div>
        {hasEnoughListingsToCompare && (
          <CompareShareButton ids={orderedListings.map((item) => item.id)} />
        )}
      </div>

      {orderedListings.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <SearchX className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Karşılaştırılacak ilan bulunamadı</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Karşılaştırma için en az iki ilan seçin. Listeleme sayfasından beğendiğiniz araçları
            ekleyip tekrar deneyebilirsiniz.
          </p>
          <Link
            href="/listings"
            className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90"
          >
            İlanlara Git
          </Link>
        </div>
      ) : (
        <>
          {!hasEnoughListingsToCompare && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4 text-sm font-medium text-blue-800">
              Teknik karşılaştırma tablosunu gösterebilmek için en az iki ilan gerekir. Aşağıdaki
              ilana ek olarak bir araç daha seçerek tam karşılaştırmayı açabilirsiniz.
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {orderedListings.map((listing) => {
              const otherIds = orderedListings
                .filter((item) => item.id !== listing.id)
                .map((item) => item.id)
                .join(",");

              return (
                <div key={listing.id} className="relative">
                  <CompareRemoveButton otherIds={otherIds} />
                  <ListingCard listing={listing} showInsights={false} />
                </div>
              );
            })}
          </div>

          {hasEnoughListingsToCompare && (
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="size-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Hızlı teknik karşılaştırma</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-3 font-semibold">Kriter</th>
                      {orderedListings.map((listing) => (
                        <th key={listing.id} className="px-3 py-3 font-semibold">
                          {listing.brand} {listing.model}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-border/70">
                      <th className="px-3 py-3 font-semibold text-foreground">Fiyat</th>
                      {orderedListings.map((listing) => (
                        <td key={listing.id} className="px-3 py-3 font-medium">
                          {formatPrice(listing.price)} TL
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/70">
                      <th className="px-3 py-3 font-semibold text-foreground">Yıl</th>
                      {orderedListings.map((listing) => (
                        <td key={listing.id} className="px-3 py-3">
                          {listing.year}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/70">
                      <th className="px-3 py-3 font-semibold text-foreground">Kilometre</th>
                      {orderedListings.map((listing) => (
                        <td key={listing.id} className="px-3 py-3">
                          {formatNumber(listing.mileage)} km
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/70">
                      <th className="px-3 py-3 font-semibold text-foreground">Yakıt</th>
                      {orderedListings.map((listing) => (
                        <td key={listing.id} className="px-3 py-3">
                          {listing.fuelType}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th className="px-3 py-3 font-semibold text-foreground">Şanzıman</th>
                      {orderedListings.map((listing) => (
                        <td key={listing.id} className="px-3 py-3">
                          {listing.transmission}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
</write_file>

<write_file path="src/app/(public)/(marketplace)/listings/filter/page.tsx">
import type { Metadata } from "next";

import { AdvancedFilterPage } from "@/features/marketplace/components/advanced-filter-page";
import { buildMarketplaceInitialFiltersFromRoute } from "@/features/marketplace/services/filter-route-resolvers";
import { getFilteredMarketplaceListings } from "@/features/marketplace/services/marketplace-listings";
import { getLiveMarketplaceReferenceData } from "@/features/shared/services/live-reference-data";

export const metadata: Metadata = {
  title: "Gelişmiş Filtreleme | OtoBurada",
  description: "Detaylı kriterlerle hayalinizdeki aracı bulun.",
};

interface FilterPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ListingsFilterPage({ searchParams }: FilterPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;

  const [references, result] = await Promise.all([
    getLiveMarketplaceReferenceData(),
    getFilteredMarketplaceListings({ sort: "newest", page: 1, limit: 1 }),
  ]);

  const initialFilters = buildMarketplaceInitialFiltersFromRoute({
    brands: references.brands,
    cities: references.cities,
    searchParams: resolvedParams,
  });

  return (
    <AdvancedFilterPage
      brands={references.brands}
      cities={references.cities}
      initialFilters={initialFilters}
      totalCount={result.total}
    />
  );
}
</write_file>

<write_file path="src/app/dashboard/listings/page.tsx">
import { Plus } from "lucide-react";
import Link from "next/link";

import { ListingCreateForm } from "@/components/forms/listing-create-form";
import { AccountTrustNotice } from "@/components/shared/account-trust-notice";
import { requireUser } from "@/features/auth/lib/session";
import { MyListingsPanel } from "@/features/marketplace/components/my-listings-panel";
import {
  mergeListingFormBrands,
  parseDashboardListingsRouteState,
} from "@/features/marketplace/services/dashboard-listing-route-state";
import { getDashboardListingsPageData } from "@/features/marketplace/services/dashboard-listings-actions";
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

export default async function DashboardListingsPage({ searchParams }: DashboardListingsPageProps) {
  const user = await requireUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const routeState = parseDashboardListingsRouteState(resolvedSearchParams);

  const [data, sellerProfile] = await Promise.all([
    getDashboardListingsPageData({
      userId: user.id,
      page: routeState.page,
      pageSize: routeState.pageSize,
      editId: routeState.editId,
    }),
    getStoredProfileById(user.id),
  ]);

  const selectedListing = data.editing.status === "loaded" ? data.editing.listing : null;
  const mergedBrands = mergeListingFormBrands({
    brands: data.references.brands,
    selectedBrand: selectedListing?.brand,
    selectedModel: selectedListing?.model,
  });
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

      {routeState.created && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs font-semibold text-blue-700">
          İlanın oluşturuldu. Şu anda moderasyon incelemesinde.
        </div>
      )}

      {routeState.updated && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs font-semibold text-emerald-700">
          İlanın güncellendi.
        </div>
      )}

      <MyListingsPanel
        activeEditId={selectedListing?.id}
        initialShowForm={routeState.create && !isEditingExisting}
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

<write_file path="src/app/dashboard/messages/page.tsx">
"use client";

import { ArrowLeft, MessageCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthUser } from "@/components/shared/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatList } from "@/features/chat/components/chat-list";
import { ChatWindow } from "@/features/chat/components/chat-window";
import { useCreateChat } from "@/hooks/use-chat-queries";

import { useMediaQuery } from "@/hooks/use-media-query";

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const { userId, isReady: isAuthResolved, isAuthenticated } = useAuthUser();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const createChatMutation = useCreateChat();
  const hasHandledPrefillRef = useRef(false);
  const [showSessionNotFound, setShowSessionNotFound] = useState(false);
  const [prefillError, setPrefillError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAuthResolved && !isAuthenticated) {
      timer = setTimeout(() => {
        setShowSessionNotFound(true);
      }, 1000);
    } else {
      timer = setTimeout(() => {
        setShowSessionNotFound(false);
      }, 0);
    }
    return () => clearTimeout(timer);
  }, [isAuthResolved, isAuthenticated]);

  const handleChatSelect = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedChatId(null);
  }, []);

  useEffect(() => {
    if (!isAuthResolved || !userId || hasHandledPrefillRef.current) {
      return;
    }

    const listingId = searchParams.get("new");
    const sellerId = searchParams.get("seller");

    if (!listingId || !sellerId) {
      hasHandledPrefillRef.current = true;
      return;
    }

    hasHandledPrefillRef.current = true;
    setPrefillError(null);

    void createChatMutation
      .mutateAsync({
        listingId,
        sellerId,
        buyerId: userId,
      })
      .then((chat) => {
        if (chat?.id) {
          setSelectedChatId(chat.id);
          return;
        }

        setPrefillError("Sohbet başlatılamadı. Lütfen birazdan tekrar deneyin.");
      })
      .catch(() => {
        setPrefillError(
          "Sohbet başlatılamadı. İlan sahibine WhatsApp ile ulaşabilir veya daha sonra tekrar deneyebilirsiniz."
        );
      });
  }, [isAuthResolved, userId, searchParams, createChatMutation]);

  const showChatList = !isMobile || !selectedChatId;
  const showChatWindow = !isMobile || selectedChatId;

  if (!isAuthResolved || (!isAuthenticated && !showSessionNotFound)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-3xl border-border/60 p-8 text-center shadow-sm">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Mesajlar yükleniyor...</p>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !userId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-3xl border-border/60 p-8 text-center shadow-sm">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Oturum bulunamadı. Lütfen yeniden giriş yapın.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-3 sm:p-4 lg:flex-row">
      {prefillError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 lg:basis-full">
          {prefillError}
        </div>
      )}

      {showChatList && (
        <Card
          className={`${isMobile && selectedChatId ? "hidden" : ""} flex min-h-[calc(100vh-14rem)] flex-1 flex-col overflow-hidden rounded-3xl border-border/60 p-4 shadow-sm md:p-5 lg:max-w-[380px]`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground md:text-xl">Mesajlarım</h2>
              <p className="text-xs text-muted-foreground">
                Tüm ilan görüşmelerin burada listelenir.
              </p>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <ChatList
              userId={userId}
              onChatSelect={handleChatSelect}
              selectedChatId={selectedChatId || undefined}
            />
          </div>
        </Card>
      )}

      {showChatWindow && (
        <Card
          className={`${!isMobile && !selectedChatId ? "hidden lg:flex" : ""} flex min-h-[calc(100vh-14rem)] flex-1 flex-col overflow-hidden rounded-3xl border-border/60 shadow-sm`}
        >
          {isMobile && selectedChatId && (
            <div className="border-b px-3 py-2.5">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
          {selectedChatId ? (
            <ChatWindow chatId={selectedChatId} userId={userId} onBack={handleBack} />
          ) : (
            <div className="flex h-full items-center justify-center p-5 text-center">
              <div className="max-w-md rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10">
                <MessageCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium text-foreground">Bir konuşma seçin</h3>
                <p className="text-sm text-muted-foreground">
                  Soldaki listeden bir sohbet açarak araç sahibiyle görüşmeye başlayabilirsiniz.
                </p>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
</write_file>

<write_file path="src/app/dashboard/pricing/page.tsx">
import { ShieldCheck, Zap } from "lucide-react";
import type { Metadata } from "next";

import { getPublicPricingPlans } from "@/features/admin-moderation/services/plans";
import { requireUser } from "@/features/auth/lib/session";
import { DopingStore } from "@/features/dashboard/components/doping-store";
import { PlanSelector } from "@/features/dashboard/components/plan-selector";
import { getStoredUserListings } from "@/features/marketplace/services/listing-submissions";

export const metadata: Metadata = {
  title: "Paketler & Üyelik Planları | Oto Burada",
  description:
    "İlanlarınızı öne çıkarmak için doping alın veya kurumsal üyelik planlarına göz atın.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await requireUser();

  const [plans, { listings }] = await Promise.all([
    getPublicPricingPlans(),
    getStoredUserListings(user.id),
  ]);

  const approvedListings = listings.filter((listing) => listing.status === "approved");

  return (
    <div className="space-y-16 pb-20">
      <section className="space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                Garantili
              </span>
              <h2 className="text-3xl font-black tracking-tight text-foreground">
                Üyelik Planları
              </h2>
            </div>
            <p className="max-w-xl text-sm font-medium text-muted-foreground">
              Bireysel kullanıcılar için ilan vermek her zaman ücretsizdir. Profesyonel satıcılar
              daha yüksek kapasite için plan seçebilir.
            </p>
          </div>
        </div>

        <PlanSelector plans={plans} />
      </section>

      <hr className="border-border/50" />

      <section className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-amber-100 bg-amber-50">
              <Zap size={20} className="fill-amber-500/30 text-amber-500" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-foreground">Doping Paketleri</h2>
          </div>
          <p className="max-w-xl text-sm font-medium text-muted-foreground">
            İlanlarınızın daha hızlı satılması için öne çıkarma özelliklerini kullanın.
            <span className="ml-1 text-primary">Piyasanın 1/10 fiyatına!</span>
          </p>
        </div>

        {approvedListings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-16 text-center shadow-sm">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-border bg-background">
              <Zap size={32} className="text-muted-foreground/30" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">Yayındaki ilan bulunamadı</h3>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Doping satın alabilmek için en az bir onaylı ilanın olması gerekiyor. İlanını şimdi
              oluşturabilir veya moderasyondaki ilanlarını takip edebilirsin.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/dashboard/listings?create=true"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Yeni ilan oluştur
              </a>
              <a
                href="/dashboard/listings"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                İlan durumunu kontrol et
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {approvedListings.map((listing) => (
              <div
                key={listing.id}
                className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      İLANINIZI ÖNE ÇIKARIN
                    </p>
                    <h3 className="truncate text-xl font-black text-foreground">{listing.title}</h3>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <span>
                        {listing.brand} {listing.model}
                      </span>
                      <span>•</span>
                      <span>{listing.year}</span>
                      <span>•</span>
                      <span className="font-bold text-foreground">
                        {listing.price.toLocaleString("tr-TR")} ₺
                      </span>
                    </div>
                  </div>
                  <div className="hidden items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-2 sm:flex">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold text-muted-foreground">GÜVENLİ ÖDEME</span>
                  </div>
                </div>
                <DopingStore listing={listing} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
</write_file>

<write_file path="src/app/dashboard/stok/page.tsx">
import { ArrowRight, Package, Plus, TrendingDown, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/features/auth/lib/session";
import { getGalleryListings, getGalleryStats } from "@/features/marketplace/services";

export default async function StockDashboardPage() {
  const user = await requireUser();
  const stats = await getGalleryStats(user.id);
  const listings = await getGalleryListings(user.id, { limit: 12 });

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-3 py-6 sm:px-4 sm:py-8 lg:px-10 lg:py-12">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Stok Yönetimi</h1>
          <p className="text-sm text-muted-foreground">Galeri stoğunuzu yönetin</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/bulk-import">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Toplu Yükle
            </Button>
          </Link>
          <Link href="/dashboard/listings?create=true">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni İlan
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktif İlan</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bekleyen</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Arşivlenen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.archived}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Satılan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSold}</div>
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Aktif Stok ({listings.length})</h2>
          <Link
            href="/dashboard/listings"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Tümünü gör <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <p className="mb-4 text-muted-foreground">Henüz ilanınız yok.</p>
            <Link href="/dashboard/listings?create=true">
              <Button>İlk İlanınızı Verin</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/dashboard/listings?edit=${listing.id}`}
                className="flex items-center gap-4 rounded-xl border border-border/50 p-3 transition-colors hover:bg-muted/30"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {listing.coverImage && (
                    <Image
                      src={listing.coverImage}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {listing.year} {listing.brand} {listing.model}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {listing.city} • {listing.price.toLocaleString("tr-TR")} TL
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
</write_file>

<write_file path="src/app/dashboard/teklifler/page.tsx">
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/features/auth/lib/session";
import { OfferActions } from "@/features/offers/components/offer-actions";
import { OfferStatusBadge } from "@/features/offers/components/offer-status-badge";
import { normalizeOfferList } from "@/features/offers/services/offers/offer-normalizers";
import {
  getOffersForUser,
  getOffersReceived,
} from "@/features/offers/services/offers/offer-actions";
import { formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function OffersDashboardPage() {
  const user = await requireUser();

  const [rawMyOffers, rawReceivedOffers] = await Promise.all([
    getOffersForUser(user.id),
    getOffersReceived(user.id),
  ]);

  const myOffers = normalizeOfferList(rawMyOffers);
  const receivedOffers = normalizeOfferList(rawReceivedOffers);

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-3 py-6 sm:px-4 sm:py-8 lg:px-10 lg:py-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Teklifler</h1>
        <p className="text-sm text-muted-foreground">Verdiğiniz ve aldığınız teklifler</p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold">
          Aldığım Teklifler{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({receivedOffers.length})
          </span>
        </h2>
        {receivedOffers.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Henüz teklif almadınız.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {receivedOffers.map((offer) => (
              <Card key={offer.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1 space-y-1">
                      <Link
                        href={`/listing/${offer.listing?.slug ?? offer.listingId}`}
                        className="block truncate text-sm font-semibold transition-colors hover:text-primary"
                      >
                        {offer.listing?.title ?? "İlan"}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span>
                          Teklif:{" "}
                          <span className="font-bold text-foreground">
                            {formatPrice(offer.offeredPrice)} TL
                          </span>
                        </span>
                        {offer.listing?.price && (
                          <span className="text-xs">
                            (İlan: {formatPrice(offer.listing.price)} TL)
                          </span>
                        )}
                      </div>
                      {offer.message && (
                        <p className="line-clamp-2 text-xs italic text-muted-foreground">
                          &ldquo;{offer.message}&rdquo;
                        </p>
                      )}
                      {offer.status === "counter_offer" && offer.counterPrice && (
                        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                          <span className="font-bold">Karşı Teklif:</span>{" "}
                          {formatPrice(offer.counterPrice)} TL
                          {offer.counterMessage && ` — ${offer.counterMessage}`}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                      <OfferStatusBadge status={offer.status} />
                      {offer.status === "pending" && (
                        <OfferActions
                          offerId={offer.id}
                          view="seller"
                          offeredPrice={offer.offeredPrice}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">
          Verdiğim Teklifler{" "}
          <span className="text-sm font-normal text-muted-foreground">({myOffers.length})</span>
        </h2>
        {myOffers.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Henüz teklif vermediniz.{" "}
              <Link href="/listings" className="text-primary hover:underline">
                İlanları incele
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myOffers.map((offer) => (
              <Card key={offer.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1 space-y-1">
                      <Link
                        href={`/listing/${offer.listing?.slug ?? offer.listingId}`}
                        className="block truncate text-sm font-semibold transition-colors hover:text-primary"
                      >
                        {offer.listing?.title ?? "İlan"}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span>
                          Teklifiniz:{" "}
                          <span className="font-bold text-foreground">
                            {formatPrice(offer.offeredPrice)} TL
                          </span>
                        </span>
                        {offer.listing?.price && (
                          <span className="text-xs">
                            (İlan: {formatPrice(offer.listing.price)} TL)
                          </span>
                        )}
                      </div>
                      {offer.message && (
                        <p className="line-clamp-2 text-xs italic text-muted-foreground">
                          &ldquo;{offer.message}&rdquo;
                        </p>
                      )}
                      {offer.status === "counter_offer" && offer.counterPrice && (
                        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                          <span className="font-bold">Satıcı Karşı Teklif Yaptı:</span>{" "}
                          {formatPrice(offer.counterPrice)} TL
                          {offer.counterMessage && ` — ${offer.counterMessage}`}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <OfferStatusBadge status={offer.status} />
                      {offer.status === "counter_offer" && (
                        <OfferActions
                          offerId={offer.id}
                          view="buyer"
                          offeredPrice={offer.counterPrice || undefined}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
</write_file>

<write_file path="src/app/admin/tickets/page.tsx">
import { Clock3, MessageSquare, ShieldCheck } from "lucide-react";

import { requireAdminUser } from "@/features/auth/lib/session";
import { AdminTicketList } from "@/features/support/components/admin-ticket-list";
import type { TicketStatus } from "@/features/support/services/ticket-service";
import { getAllTickets, getTicketCount } from "@/features/support/services/ticket-service";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdminUser();
  const { status, q } = await searchParams;

  const [allTickets, counts] = await Promise.all([getAllTickets(), getTicketCount()]);

  const openCount = counts.open + counts.in_progress;
  const resolvedCount = counts.resolved + counts.closed;

  return (
    <main className="min-h-full space-y-6 bg-muted/30 p-4 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              Müşteri deneyimi
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Destek <span className="text-emerald-600">Talepleri</span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm font-medium italic text-muted-foreground">
            Gelen yardım çağrılarını, yanıt kayıtlarını ve kuyruk durumunu mobilde de okunabilir tek
            yüzeyde yönetin.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm xl:max-w-sm">
          <p className="font-semibold">Operasyon notu</p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Yanıt eklemek ticket kaydına bağlamsal iz bırakır. Kapatma veya çözüm kararından önce
            kısa bir admin cevabı bırakmanız önerilir.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Açık kuyruk"
          count={openCount}
          hint="Yanıt veya inceleme bekliyor"
          tone="warning"
          icon={Clock3}
        />
        <StatCard
          label="Açık"
          count={counts.open}
          hint="Henüz işlem alınmadı"
          tone="warning-soft"
          icon={MessageSquare}
        />
        <StatCard
          label="İnceleniyor"
          count={counts.in_progress}
          hint="Admin aksiyonu başlatıldı"
          tone="info"
          icon={ShieldCheck}
        />
        <StatCard
          label="Kapanan kayıt"
          count={resolvedCount}
          hint="Çözüldü veya kapatıldı"
          tone="success"
          icon={ShieldCheck}
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background text-emerald-500 shadow-sm">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground sm:text-base">Tüm talepler</h2>
              <p className="text-xs text-muted-foreground">
                Toplam {allTickets.length} kayıt • filtreler ve aksiyonlar aşağıda
              </p>
            </div>
          </div>
          {openCount > 0 ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              <div className="size-2 rounded-full bg-amber-500" />
              {openCount} kayıt halen kuyrukta
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              <div className="size-2 rounded-full bg-emerald-500" />
              Aktif kuyruk temiz görünüyor
            </div>
          )}
        </div>

        <AdminTicketList
          tickets={allTickets}
          initialStatus={(status as TicketStatus) ?? "all"}
          initialQuery={q ?? ""}
        />
      </section>
    </main>
  );
}

function StatCard({
  label,
  count,
  hint,
  tone,
  icon: Icon,
}: {
  label: string;
  count: number;
  hint: string;
  tone: "warning" | "warning-soft" | "info" | "success";
  icon: typeof Clock3;
}) {
  const toneClassName = {
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    "warning-soft": "border-amber-100 bg-card text-amber-700",
    info: "border-blue-200 bg-blue-50 text-blue-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[tone];

  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm", toneClassName)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]">{label}</span>
        <Icon className="size-4" />
      </div>
      <p className="mt-3 text-3xl font-bold leading-none">{count}</p>
      <p className="mt-2 text-xs leading-5 opacity-90">{hint}</p>
    </div>
  );
}
</write_file>

<write_file path="database/migrations/0107_chats_unique_listing_buyer_seller.sql">
begin;

create unique index if not exists chats_unique_listing_buyer_seller_idx
  on public.chats (listing_id, buyer_id, seller_id);

create index if not exists chats_buyer_id_idx
  on public.chats (buyer_id);

create index if not exists chats_seller_id_idx
  on public.chats (seller_id);

create index if not exists messages_chat_id_created_at_idx
  on public.messages (chat_id, created_at desc);

commit;
</write_file>
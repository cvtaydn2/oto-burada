import { getLiveMarketplaceReferenceData } from "@/features/shared/services/reference/reference-records";
import type { BrandCatalogItem, CityOption, Listing, SearchSuggestionItem } from "@/types";

import { getPublicMarketplaceListingsFromRawFilters } from "./listings/marketplace-listings";

type AsyncStatus = "fulfilled" | "rejected";

export interface MarketplaceHomepageViewModel {
  featuredListings: Listing[];
  galleryListings: Listing[];
  latestListings: Listing[];
  brands: BrandCatalogItem[];
  cities: CityOption[];
  heroCities: string[];
  searchSuggestions: SearchSuggestionItem[];
  results: {
    featuredStatus: AsyncStatus;
    galleryStatus: AsyncStatus;
    latestStatus: AsyncStatus;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeListing(candidate: unknown): Listing | null {
  if (!isRecord(candidate)) return null;

  const id = candidate.id;
  const slug = candidate.slug;
  const brand = candidate.brand;
  const model = candidate.model;
  const title = candidate.title;
  const city = candidate.city;
  const price = candidate.price;
  const year = candidate.year;
  const seller = candidate.seller;
  const images = candidate.images;

  if (!isNonEmptyString(id) && !isFiniteNumber(id)) {
    return null;
  }

  if (
    !isNonEmptyString(slug) ||
    !isNonEmptyString(brand) ||
    !isNonEmptyString(model) ||
    !isNonEmptyString(title) ||
    !isNonEmptyString(city) ||
    !isFiniteNumber(price) ||
    !isFiniteNumber(year) ||
    !isRecord(seller)
  ) {
    return null;
  }

  return {
    ...candidate,
    id,
    slug: slug.trim(),
    brand: brand.trim(),
    model: model.trim(),
    title: title.trim(),
    city: city.trim(),
    price,
    year,
    seller,
    images: Array.isArray(images) ? images : [],
  } as Listing;
}

function normalizeListings(payload: unknown): Listing[] {
  if (!isRecord(payload)) return [];
  const listings = payload.listings;

  if (!Array.isArray(listings)) return [];

  return listings
    .map((listing) => normalizeListing(listing))
    .filter((listing): listing is Listing => listing !== null);
}

function normalizeSearchSuggestions(payload: unknown): SearchSuggestionItem[] {
  if (!Array.isArray(payload)) return [];
  return payload.filter((item): item is SearchSuggestionItem => isRecord(item));
}

function normalizeQuickExploreBrands(payload: unknown): BrandCatalogItem[] {
  if (!Array.isArray(payload)) return [];
  return payload.filter((item): item is BrandCatalogItem => isRecord(item));
}

function normalizeQuickExploreCities(payload: unknown): CityOption[] {
  if (!Array.isArray(payload)) return [];
  return payload.filter((item): item is CityOption => isRecord(item));
}

function extractHeroCities(cities: CityOption[]): string[] {
  const values = cities
    .map((city) => {
      if (isRecord(city) && isNonEmptyString(city.city)) {
        return city.city.trim();
      }

      return null;
    })
    .filter((city): city is string => city !== null);

  return Array.from(new Set(values));
}

function normalizeReferenceData(payload: unknown): {
  brands: BrandCatalogItem[];
  cities: CityOption[];
  heroCities: string[];
  searchSuggestions: SearchSuggestionItem[];
} {
  if (!isRecord(payload)) {
    return {
      brands: [],
      cities: [],
      heroCities: [],
      searchSuggestions: [],
    };
  }

  const brands = normalizeQuickExploreBrands(payload.brands);
  const cities = normalizeQuickExploreCities(payload.cities);
  const heroCities = extractHeroCities(cities);
  const searchSuggestions = normalizeSearchSuggestions(payload.searchSuggestions);

  return {
    brands,
    cities,
    heroCities,
    searchSuggestions,
  };
}

export async function getMarketplaceHomepageViewModel(): Promise<MarketplaceHomepageViewModel> {
  const [featuredResult, galleryResult, latestResult, referencesResult] = await Promise.allSettled([
    getPublicMarketplaceListingsFromRawFilters({ limit: 4, featured: true, sort: "newest" }),
    getPublicMarketplaceListingsFromRawFilters({ limit: 8, galleryPriority: 1, sort: "newest" }),
    getPublicMarketplaceListingsFromRawFilters({ limit: 12, sort: "newest" }),
    getLiveMarketplaceReferenceData(),
  ]);

  const featuredListings =
    featuredResult.status === "fulfilled" ? normalizeListings(featuredResult.value) : [];
  const galleryListings =
    galleryResult.status === "fulfilled" ? normalizeListings(galleryResult.value) : [];
  const latestSourceListings =
    latestResult.status === "fulfilled" ? normalizeListings(latestResult.value) : [];

  const referenceData =
    referencesResult.status === "fulfilled"
      ? normalizeReferenceData(referencesResult.value)
      : {
          brands: [],
          cities: [],
          heroCities: [],
          searchSuggestions: [],
        };

  const featuredIds = new Set(featuredListings.map((listing) => String(listing.id)));
  const galleryIds = new Set(galleryListings.map((listing) => String(listing.id)));

  const latestListings = latestSourceListings
    .filter((listing) => {
      const id = String(listing.id);
      return !featuredIds.has(id) && !galleryIds.has(id);
    })
    .slice(0, 8);

  return {
    featuredListings,
    galleryListings,
    latestListings,
    brands: referenceData.brands,
    cities: referenceData.cities,
    heroCities: referenceData.heroCities,
    searchSuggestions: referenceData.searchSuggestions,
    results: {
      featuredStatus: featuredResult.status,
      galleryStatus: galleryResult.status,
      latestStatus: latestResult.status,
    },
  };
}

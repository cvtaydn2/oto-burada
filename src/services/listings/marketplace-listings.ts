import { 
  getStoredListingBySlug, 
  getStoredListingsByIds, 
  getStoredListingById,
  getFilteredDatabaseListings,
  type PaginatedListingsResult 
} from "@/services/listings/listing-submissions";
import { getStoredProfileById } from "@/services/profile/profile-records";
import type { Profile, ListingFilters } from "@/types";

export async function getFilteredMarketplaceListings(
  filters: ListingFilters
): Promise<PaginatedListingsResult> {
  const result = await getFilteredDatabaseListings(filters);
  return result;
}

export async function getMarketplaceListingsByIds(ids: string[]) {
  const storedListings = await getStoredListingsByIds(ids);
  return storedListings;
}

export async function getMarketplaceListingBySlug(slug: string) {
  console.log(`[getMarketplaceListingBySlug] Slug: ${slug}`);
  const storedListing = await getStoredListingBySlug(slug);
  console.log(`[getMarketplaceListingBySlug] Stored listing found: ${!!storedListing}, Status: ${storedListing?.status}`);

  if (storedListing?.status === "approved") {
    return storedListing;
  }

  return null;
}

export async function getListingById(id: string) {
  return getStoredListingById(id);
}

export async function getMarketplaceSeller(sellerId: string): Promise<Profile | null> {
  const storedProfile = await getStoredProfileById(sellerId);

  return storedProfile;
}

export async function getPublicMarketplaceListings(filters: ListingFilters = { page: 1, limit: 12, sort: "newest" }) {
  return getFilteredMarketplaceListings(filters);
}

export async function getAllKnownListings() {
  const result = await getFilteredDatabaseListings({
    limit: 100,
    page: 1,
    sort: "newest"
  });
  return result.listings;
}

export async function getSimilarMarketplaceListings(slug: string, brand: string, city: string) {
  // We can fetch a small set for similarity
  const result = await getFilteredDatabaseListings({
    brand,
    limit: 10,
    page: 1,
    sort: "newest"
  });

  const listings = result.listings;
  
  const similarByBrand = listings.filter(
    (listing) => listing.slug !== slug && listing.brand === brand,
  );

  if (similarByBrand.length >= 3) {
    return similarByBrand.slice(0, 3);
  }

  // Fallback to city search if not enough brand matches
  const cityResult = await getFilteredDatabaseListings({
    city,
    limit: 10,
    page: 1,
    sort: "newest"
  });

  const similarByCity = cityResult.listings.filter(
    (listing) =>
      listing.slug !== slug &&
      listing.city === city &&
      !similarByBrand.some((brandMatch) => brandMatch.id === listing.id),
  );

  return [...similarByBrand, ...similarByCity].slice(0, 3);
}

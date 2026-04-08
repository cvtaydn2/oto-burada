import { getStoredListingBySlug, getStoredListings, getStoredListingsByIds } from "@/services/listings/listing-submissions";
import { getStoredProfileById } from "@/services/profile/profile-records";
import type { Profile } from "@/types";

export async function getAllKnownListings() {
  const storedListings = await getStoredListings();
  return storedListings.sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
}

export async function getPublicMarketplaceListings() {
  const listings = await getAllKnownListings();

  return listings.filter((listing) => listing.status === "approved");
}

export async function getMarketplaceListingsByIds(ids: string[]) {
  const storedListings = await getStoredListingsByIds(ids);
  return storedListings;
}

export async function getMarketplaceListingBySlug(slug: string) {
  const storedListing = await getStoredListingBySlug(slug);

  if (storedListing?.status === "approved") {
    return storedListing;
  }

  return null;
}

export async function getMarketplaceSeller(sellerId: string): Promise<Profile | null> {
  const storedProfile = await getStoredProfileById(sellerId);

  return storedProfile;
}

export async function getSimilarMarketplaceListings(slug: string, brand: string, city: string) {
  const listings = await getPublicMarketplaceListings();
  const similarByBrand = listings.filter(
    (listing) => listing.slug !== slug && listing.brand === brand,
  );

  if (similarByBrand.length >= 3) {
    return similarByBrand.slice(0, 3);
  }

  const similarByCity = listings.filter(
    (listing) =>
      listing.slug !== slug &&
      listing.city === city &&
      !similarByBrand.some((brandMatch) => brandMatch.id === listing.id),
  );

  return [...similarByBrand, ...similarByCity].slice(0, 3);
}

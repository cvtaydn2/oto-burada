import { allUsers, exampleListings } from "@/data";
import { getStoredProfileById } from "@/services/profile/profile-records";
import {
  getStoredListingBySlug,
  getStoredListings,
  getStoredListingsByIds,
} from "@/services/listings/listing-submissions";
import type { Listing, Profile } from "@/types";

const isDev = process.env.NODE_ENV === "development";

function mergeListings(primary: Listing[], secondary: Listing[]) {
  const listingMap = new Map<string, Listing>();

  [...secondary, ...primary].forEach((listing) => {
    listingMap.set(listing.id, listing);
  });

  return [...listingMap.values()];
}

export async function getAllKnownListings() {
  const storedListings = await getStoredListings();
  
  if (!isDev) {
    return storedListings.sort(
      (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
    );
  }
  
  return mergeListings(storedListings, exampleListings).sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
}

export async function getPublicMarketplaceListings() {
  const listings = await getAllKnownListings();

  return listings.filter((listing) => listing.status === "approved");
}

export async function getMarketplaceListingsByIds(ids: string[]) {
  const storedListings = await getStoredListingsByIds(ids);
  
  if (!isDev) {
    return storedListings;
  }

  const seedListings = exampleListings.filter((listing) => ids.includes(listing.id));

  return mergeListings(storedListings, seedListings);
}

export async function getMarketplaceListingBySlug(slug: string) {
  const storedListing = await getStoredListingBySlug(slug);

  if (storedListing?.status === "approved") {
    return storedListing;
  }

  if (!isDev) {
    return null;
  }

  return exampleListings.find((listing) => listing.slug === slug) ?? null;
}

export async function getMarketplaceSeller(sellerId: string): Promise<Profile | null> {
  const storedProfile = await getStoredProfileById(sellerId);

  if (storedProfile) {
    return storedProfile;
  }

  if (!isDev) {
    return null;
  }

  return allUsers.find((user) => user.id === sellerId) ?? null;
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

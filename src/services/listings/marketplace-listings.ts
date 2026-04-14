import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { 
  getStoredListingBySlug, 
  getStoredListingsByIds, 
  getStoredListingById,
  getFilteredDatabaseListings,
  type PaginatedListingsResult 
} from "@/services/listings/listing-submissions";
import type { Profile, ListingFilters } from "@/types";

async function withNextCache<T>(
  keyParts: string[],
  loader: () => Promise<T>,
  revalidate = 60,
): Promise<T> {
  if (process.env.NODE_ENV === "test" || typeof window !== "undefined" || !process.env.NEXT_RUNTIME) {
    return loader();
  }

  try {
    const { unstable_cache } = await import("next/cache");
    return unstable_cache(loader, keyParts, { revalidate })();
  } catch {
    return loader();
  }
}

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
  const storedListing = await withNextCache(
    [`marketplace-listing:${slug}`],
    () => getStoredListingBySlug(slug),
    60,
  );

  if (storedListing?.status === "approved") {
    return storedListing;
  }

  return null;
}

export async function getListingById(id: string) {
  return getStoredListingById(id);
}

export async function getMarketplaceSeller(sellerId: string): Promise<Profile | null> {
  return withNextCache(
    [`marketplace-seller:${sellerId}`],
    async () => {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin
        .from("profiles")
        .select("id, full_name, phone, city, avatar_url, role, user_type, balance_credits, is_verified, tc_verified_at, eids_id, business_name, business_logo_url, business_slug, created_at, updated_at")
        .eq("id", sellerId)
        .maybeSingle<{
          avatar_url: string | null;
          balance_credits: number | null;
          business_logo_url: string | null;
          business_name: string | null;
          business_slug: string | null;
          city: string;
          created_at: string;
          eids_id: string | null;
          full_name: string;
          id: string;
          is_verified: boolean;
          phone: string;
          role: Profile["role"];
          tc_verified_at: string | null;
          updated_at: string;
          user_type: "individual" | "professional" | "staff";
        }>();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        fullName: data.full_name,
        phone: data.phone,
        city: data.city,
        avatarUrl: data.avatar_url,
        emailVerified: false,
        phoneVerified: false,
        identityVerified: data.is_verified,
        role: data.role,
        userType: data.user_type,
        balanceCredits: data.balance_credits ?? 0,
        isVerified: data.is_verified,
        tcVerifiedAt: data.tc_verified_at,
        eidsId: data.eids_id,
        businessName: data.business_name,
        businessLogoUrl: data.business_logo_url,
        businessSlug: data.business_slug,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } satisfies Profile;
    },
    300,
  );
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
  return withNextCache(
    [`similar-marketplace-listings:${slug}:${brand}:${city}`],
    async () => {
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
    },
    120,
  );
}

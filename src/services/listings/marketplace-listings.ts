import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { 
  getStoredListingBySlug, 
  getStoredListingsByIds, 
  getStoredListingById,
  type PaginatedListingsResult 
} from "@/services/listings/listing-submissions";
import { getPublicListings } from "@/services/listings/catalog";
import { createExpertDocumentSignedUrl } from "@/services/listings/listing-documents";
import { maskPhoneNumber } from "@/lib/utils/listing-utils";
import type { Profile, ListingFilters, Listing } from "@/types";

export { 
  getStoredListingBySlug, 
  getStoredListingsByIds, 
  getStoredListingById,
  type PaginatedListingsResult 
};

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
  return getPublicListings(filters);
}

export async function getMarketplaceListingsByIds(ids: string[]) {
  const storedListings = await getStoredListingsByIds(ids);
  return storedListings;
}

export async function getMarketplaceListingBySlug(slug: string) {
  const storedListing = await withNextCache<Listing | null>(
    [`marketplace-listing:${slug}`],
    () => getStoredListingBySlug(slug),
    60,
  );

  if (storedListing && storedListing.status === "approved") {
    if (!storedListing.expertInspection?.documentPath) {
      return {
        ...storedListing,
        whatsappPhone: maskPhoneNumber(storedListing.whatsappPhone),
      };
    }

    const signedUrl = await createExpertDocumentSignedUrl(
      storedListing.expertInspection.documentPath,
    );

    return {
      ...storedListing,
      whatsappPhone: maskPhoneNumber(storedListing.whatsappPhone),
      expertInspection: {
        ...storedListing.expertInspection,
        documentUrl: signedUrl ?? storedListing.expertInspection.documentUrl,
      },
    };
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
        .select(`
          id, 
          full_name, 
          phone, 
          city, 
          avatar_url, 
          role, 
          user_type, 
          balance_credits, 
          is_verified, 
          is_banned,
          ban_reason,
          business_name, 
          business_logo_url, 
          business_slug, 
          business_description,
          website_url,
          verified_business,
          verification_status,
          verification_requested_at,
          verification_reviewed_at,
          verification_feedback,
          trust_score,
          created_at, 
          updated_at
        `)
        .eq("id", sellerId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        fullName: data.full_name,
        phone: data.phone || "",
        city: data.city,
        avatarUrl: data.avatar_url,
        emailVerified: false,
        isVerified: data.is_verified,
        role: data.role as Profile["role"],
        userType: data.user_type as Profile["userType"],
        balanceCredits: data.balance_credits ?? 0,
        businessName: data.business_name,
        businessLogoUrl: data.business_logo_url,
        businessSlug: data.business_slug,
        businessDescription: data.business_description,
        websiteUrl: data.website_url,
        verificationStatus: data.verification_status,
        verificationRequestedAt: data.verification_requested_at,
        verificationReviewedAt: data.verification_reviewed_at,
        verificationFeedback: data.verification_feedback,
        trustScore: data.trust_score ?? 0,

        isBanned: data.is_banned,
        banReason: data.ban_reason,
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
  const result = await getPublicListings({
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
      // Single query: fetch candidates by brand, then supplement with city if needed
      const brandResult = await getPublicListings({
        brand,
        limit: 10,
        page: 1,
        sort: "newest",
      });

      const byBrand = brandResult.listings.filter((l: Listing) => l.slug !== slug);

      if (byBrand.length >= 3) {
        return byBrand.slice(0, 3);
      }

      // Not enough brand matches — fetch by city and merge
      const cityResult = await getPublicListings({
        city,
        limit: 10,
        page: 1,
        sort: "newest",
      });

      const brandIds = new Set(byBrand.map((l: Listing) => l.id));
      const byCity = cityResult.listings.filter(
        (l: Listing) => l.slug !== slug && !brandIds.has(l.id),
      );

      return [...byBrand, ...byCity].slice(0, 3);
    },
    120,
  );
}

import { listingSchema } from "@/lib/validators";
import { toSlugSegment } from "@/services/listings/listing-submission-helpers";
import type { Listing, ListingCreateInput } from "@/types";

/**
 * Domain Factory for Car Listings.
 * Centralizes the creation and transformation of Listing entities.
 */

export function buildListingSlug(
  input: { brand: string; model: string; year: number; city: string; title: string },
  existingSlugs: Set<string>
) {
  const baseSlug = toSlugSegment(
    `${input.brand} ${input.model} ${input.year} ${input.city} ${input.title}`
  );

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

export function createListingEntity(
  input: ListingCreateInput,
  sellerId: string,
  existingListings: { id: string; slug: string }[],
  options?: {
    existingListing?: Listing;
    id?: string;
    status?: Listing["status"];
  }
): Listing {
  const existingListing = options?.existingListing;
  const id = existingListing?.id ?? options?.id ?? crypto.randomUUID();

  // Create set of existing slugs for faster lookup
  const otherSlugs = new Set(
    existingListings.filter((l) => l.id !== existingListing?.id).map((l) => l.slug)
  );

  // Generate base slug
  let slug = buildListingSlug(input, otherSlugs);

  // Add unique suffix for new listings to prevent race conditions
  if (!existingListing) {
    const shortId = crypto.randomUUID().split("-")[0];
    slug = `${slug}-${shortId}`;
  }

  const timestamp = new Date().toISOString();

  return listingSchema.parse({
    id,
    slug,
    sellerId,
    viewCount: existingListing?.viewCount ?? 0,
    version: existingListing ? (existingListing.version ?? 0) + 1 : 0,
    title: input.title,
    category: input.category ?? "otomobil",
    brand: input.brand,
    model: input.model,
    year: input.year,
    mileage: input.mileage,
    fuelType: input.fuelType,
    transmission: input.transmission,
    price: input.price,
    city: input.city,
    district: input.district,
    description: input.description,
    whatsappPhone: input.whatsappPhone,
    vin: input.vin,
    licensePlate: input.licensePlate ?? null,
    tramerAmount: input.tramerAmount ?? null,
    damageStatusJson: input.damageStatusJson ?? null,
    fraudScore: 0,
    fraudReason: null,
    status: options?.status ?? existingListing?.status ?? "pending_ai_review",
    featured: existingListing?.featured ?? false,
    expertInspection: input.expertInspection,
    bumpedAt: existingListing?.bumpedAt ?? null,
    featuredUntil: existingListing?.featuredUntil ?? null,
    urgentUntil: existingListing?.urgentUntil ?? null,
    highlightedUntil: existingListing?.highlightedUntil ?? null,
    marketPriceIndex: existingListing?.marketPriceIndex ?? null,
    createdAt: existingListing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    images: input.images.map((image, index) => ({
      id: `${id}-image-${index + 1}`,
      listingId: id,
      storagePath: image.storagePath,
      url: image.url,
      order: index,
      isCover: index === 0,
    })),
  });
}

/**
 * Cleans markdown/formatting from listing description for better display.
 */
export function getCleanDescription(description: string): string {
  return description
    .split("\n")
    .filter((line) => !/^#{1,6}\s*$/.test(line))
    .map((line) => line.replace(/^#{1,6}\s+/, ""))
    .join("\n")
    .trim();
}

/**
 * Generates breadcrumbs for a listing.
 */
export function getListingBreadcrumbs(listing: { brand: string; model: string; slug: string }) {
  return [
    { name: "Ana Sayfa", url: "/" },
    { name: "Arabalar", url: "/listings" },
    { name: listing.brand, url: `/listings?brand=${encodeURIComponent(listing.brand)}` },
    { name: listing.model, url: `/listing/${listing.slug}` },
  ];
}

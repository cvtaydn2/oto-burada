import { toSlugSegment } from "@/features/marketplace/services/listing-submission-helpers";
import { listingSchema } from "@/features/shared/lib";
import type { Listing, ListingCreateInput } from "@/types";

function normalizeListingPrice(price: number): number {
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Listing price must be a positive finite number.");
  }

  // Faz 5 hardening: preserve incoming value exactly and reject fractional drift.
  // The listing form contract already sends full TL as an integer-like number.
  // We explicitly avoid any Math.round-style coercion here.
  if (!Number.isInteger(price)) {
    throw new Error("Listing price must be provided as a whole TL amount.");
  }

  return price;
}

/**
 * Domain Factory for Car Listings.
 * Centralizes the creation and transformation of Listing entities.
 */

/**
 * Build a base slug from listing input.
 * This generates the human-readable part without uniqueness guarantees.
 */
export function buildBaseSlug(input: {
  brand: string;
  model: string;
  year: number;
  city: string;
  title: string;
}): string {
  return toSlugSegment(`${input.brand} ${input.model} ${input.year} ${input.city} ${input.title}`);
}

/**
 * Build a unique slug with fallback suffix logic.
 * @deprecated Use atomic slug generation in database (unique constraint + retry) instead.
 * This function has a race condition between check and insert.
 * See: createDatabaseListing for proper atomic slug generation.
 */
export function buildListingSlug(
  input: { brand: string; model: string; year: number; city: string; title: string },
  existingSlugs: Set<string>
) {
  const baseSlug = buildBaseSlug(input);

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
    slug?: string; // Allow pre-generated slug for atomic operations
  }
): Listing {
  const existingListing = options?.existingListing;
  const id = existingListing?.id ?? options?.id ?? crypto.randomUUID();

  // Use pre-generated slug if provided (for atomic slug generation)
  let slug: string;
  if (options?.slug) {
    slug = options.slug;
  } else {
    // Fallback to legacy slug generation
    // Create set of existing slugs for faster lookup
    const otherSlugs = new Set(
      existingListings.filter((l) => l.id !== existingListing?.id).map((l) => l.slug)
    );

    // Generate base slug
    slug = buildListingSlug(input, otherSlugs);

    // ── LOGIC FIX: Issue LOGIC-05 - Clarify Non-Deterministic Slug Generation ─────────────
    // Add random suffix for new listings to prevent slug collisions.
    // This is intentionally non-deterministic to ensure uniqueness across concurrent requests.
    // The random suffix makes it extremely unlikely for two listings created simultaneously
    // to generate the same slug, even with identical input data.
    if (!existingListing) {
      const shortId = crypto.randomUUID().split("-")[0];
      slug = `${slug}-${shortId}`;
    }
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
    price: normalizeListingPrice(input.price),
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
 *
 * ── LOGIC FIX: Issue LOGIC-08 - Use Listing Title in Breadcrumb ─────────────
 * Last breadcrumb should show listing title since it links to the listing detail page.
 * Model breadcrumb now links to model filter page for better navigation.
 */
export function getListingBreadcrumbs(listing: {
  brand: string;
  model: string;
  title: string;
  slug: string;
}) {
  return [
    { name: "Ana Sayfa", url: "/" },
    { name: "Arabalar", url: "/listings" },
    { name: listing.brand, url: `/listings?brand=${encodeURIComponent(listing.brand)}` },
    {
      name: listing.model,
      url: `/listings?brand=${encodeURIComponent(listing.brand)}&model=${encodeURIComponent(listing.model)}`,
    },
    { name: listing.title, url: `/listing/${listing.slug}` },
  ];
}

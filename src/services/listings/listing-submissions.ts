import { cookies } from "next/headers";

import { listingSchema } from "@/lib/validators";
import type { Listing, ListingCreateInput } from "@/types";

const turkishCharacterMap: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

export const listingSubmissionsCookieName = "oto-burada-listing-submissions";

export const listingSubmissionsCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
  sameSite: "lax" as const,
};

function toSlugSegment(value: string) {
  return value
    .split("")
    .map((character) => turkishCharacterMap[character] ?? character)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function buildListingSlug(input: ListingCreateInput, existingListings: Listing[]) {
  const baseSlug = toSlugSegment(`${input.year} ${input.brand} ${input.model} ${input.title}`);
  const existingSlugs = new Set(existingListings.map((listing) => listing.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;

  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

function buildListingRecord(
  input: ListingCreateInput,
  sellerId: string,
  existingListings: Listing[],
  options?: {
    existingListing?: Listing;
    status?: Listing["status"];
  },
) {
  const existingListing = options?.existingListing;
  const id = existingListing?.id ?? `listing-${crypto.randomUUID()}`;
  const slug = buildListingSlug(
    input,
    existingListing
      ? existingListings.filter((listing) => listing.id !== existingListing.id)
      : existingListings,
  );
  const timestamp = new Date().toISOString();

  return listingSchema.parse({
    id,
    slug,
    sellerId,
    title: input.title,
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
    status: options?.status ?? existingListing?.status ?? "pending",
    featured: existingListing?.featured ?? false,
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

export function parseStoredListings(rawValue?: string | null) {
  if (!rawValue) {
    return [] satisfies Listing[];
  }

  try {
    const parsed = JSON.parse(rawValue);
    const result = listingSchema.array().safeParse(parsed);

    if (!result.success) {
      return [] satisfies Listing[];
    }

    return result.data;
  } catch {
    return [] satisfies Listing[];
  }
}

export function serializeStoredListings(listings: Listing[]) {
  return JSON.stringify(listings);
}

export function buildPendingListing(
  input: ListingCreateInput,
  sellerId: string,
  existingListings: Listing[],
) {
  return buildListingRecord(input, sellerId, existingListings, {
    status: "pending",
  });
}

export function buildUpdatedListing(
  input: ListingCreateInput,
  existingListing: Listing,
  existingListings: Listing[],
) {
  return buildListingRecord(input, existingListing.sellerId, existingListings, {
    existingListing,
  });
}

export function replaceStoredListing(existingListings: Listing[], nextListing: Listing) {
  const alreadyExists = existingListings.some((listing) => listing.id === nextListing.id);

  if (!alreadyExists) {
    return [nextListing, ...existingListings];
  }

  return existingListings.map((listing) => (listing.id === nextListing.id ? nextListing : listing));
}

export function archiveStoredListing(existingListing: Listing) {
  return listingSchema.parse({
    ...existingListing,
    status: "archived",
    updatedAt: new Date().toISOString(),
  });
}

export function moderateStoredListing(
  existingListing: Listing,
  status: Extract<Listing["status"], "approved" | "rejected">,
) {
  return listingSchema.parse({
    ...existingListing,
    status,
    updatedAt: new Date().toISOString(),
  });
}

export function getEditableListingById(listings: Listing[], listingId: string, sellerId: string) {
  return listings.find(
    (listing) =>
      listing.id === listingId &&
      listing.sellerId === sellerId &&
      (listing.status === "draft" || listing.status === "pending"),
  );
}

export function getArchivableListingById(listings: Listing[], listingId: string, sellerId: string) {
  return listings.find(
    (listing) =>
      listing.id === listingId &&
      listing.sellerId === sellerId &&
      listing.status !== "archived",
  );
}

export function getModeratableListingById(listings: Listing[], listingId: string) {
  return listings.find((listing) => listing.id === listingId && listing.status === "pending");
}

export async function getStoredListings() {
  const cookieStore = await cookies();

  return parseStoredListings(cookieStore.get(listingSubmissionsCookieName)?.value).sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
}

export async function getStoredUserListings(sellerId: string) {
  const cookieStore = await cookies();
  const listings = parseStoredListings(cookieStore.get(listingSubmissionsCookieName)?.value);

  return listings
    .filter((listing) => listing.sellerId === sellerId)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

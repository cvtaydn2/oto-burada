import { cookies } from "next/headers";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
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

interface ListingImageRow {
  id: string;
  is_cover: boolean;
  listing_id: string;
  public_url: string;
  sort_order: number;
  storage_path: string;
}

interface ListingRow {
  brand: string;
  city: string;
  created_at: string;
  description: string;
  district: string;
  featured: boolean;
  fuel_type: Listing["fuelType"];
  id: string;
  listing_images?: ListingImageRow[] | null;
  mileage: number;
  model: string;
  price: number;
  seller_id: string;
  slug: string;
  status: Listing["status"];
  title: string;
  transmission: Listing["transmission"];
  updated_at: string;
  whatsapp_phone: string;
  year: number;
}

const listingSelect = `
  id,
  seller_id,
  slug,
  title,
  brand,
  model,
  year,
  mileage,
  fuel_type,
  transmission,
  price,
  city,
  district,
  description,
  whatsapp_phone,
  status,
  featured,
  created_at,
  updated_at,
  listing_images (
    id,
    listing_id,
    storage_path,
    public_url,
    sort_order,
    is_cover
  )
`;

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
    id?: string;
    status?: Listing["status"];
  },
) {
  const existingListing = options?.existingListing;
  const id = existingListing?.id ?? options?.id ?? crypto.randomUUID();
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

function mapListingRow(row: ListingRow) {
  return listingSchema.parse({
    brand: row.brand,
    city: row.city,
    createdAt: row.created_at,
    description: row.description,
    district: row.district,
    featured: row.featured,
    fuelType: row.fuel_type,
    id: row.id,
    images: (row.listing_images ?? [])
      .map((image) => ({
        id: image.id,
        isCover: image.is_cover,
        listingId: image.listing_id,
        order: image.sort_order,
        storagePath: image.storage_path,
        url: image.public_url,
      }))
      .sort((left, right) => left.order - right.order),
    mileage: row.mileage,
    model: row.model,
    price: row.price,
    sellerId: row.seller_id,
    slug: row.slug,
    status: row.status,
    title: row.title,
    transmission: row.transmission,
    updatedAt: row.updated_at,
    whatsappPhone: row.whatsapp_phone,
    year: row.year,
  });
}

async function getDatabaseListings(options?: {
  ids?: string[];
  listingId?: string;
  sellerId?: string;
  slug?: string;
  statuses?: Listing["status"][];
}) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  let query = admin.from("listings").select(listingSelect).order("updated_at", { ascending: false });

  if (options?.sellerId) {
    query = query.eq("seller_id", options.sellerId);
  }

  if (options?.listingId) {
    query = query.eq("id", options.listingId);
  }

  if (options?.slug) {
    query = query.eq("slug", options.slug);
  }

  if (options?.ids?.length) {
    query = query.in("id", options.ids);
  }

  if (options?.statuses?.length) {
    query = query.in("status", options.statuses);
  }

  const { data, error } = await query.returns<ListingRow[]>();

  if (error || !data) {
    return null;
  }

  return data.map(mapListingRow);
}

function mapListingToDatabaseRow(listing: Listing) {
  return {
    brand: listing.brand,
    city: listing.city,
    created_at: listing.createdAt,
    description: listing.description,
    district: listing.district,
    featured: listing.featured,
    fuel_type: listing.fuelType,
    id: listing.id,
    mileage: listing.mileage,
    model: listing.model,
    price: listing.price,
    seller_id: listing.sellerId,
    slug: listing.slug,
    status: listing.status,
    title: listing.title,
    transmission: listing.transmission,
    updated_at: listing.updatedAt,
    whatsapp_phone: listing.whatsappPhone,
    year: listing.year,
  };
}

function mapListingImagesToDatabaseRows(listing: Listing) {
  return listing.images.map((image) => ({
    is_cover: image.isCover,
    listing_id: listing.id,
    public_url: image.url,
    sort_order: image.order,
    storage_path: image.storagePath,
  }));
}

function mergeListings(primary: Listing[], secondary: Listing[]) {
  const listingMap = new Map<string, Listing>();

  [...secondary, ...primary].forEach((listing) => {
    listingMap.set(listing.id, listing);
  });

  return [...listingMap.values()];
}

export async function createDatabaseListing(listing: Listing) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const insertResult = await admin.from("listings").insert(mapListingToDatabaseRow(listing));

  if (insertResult.error) {
    return null;
  }

  const imageRows = mapListingImagesToDatabaseRows(listing);

  if (imageRows.length > 0) {
    const imageInsertResult = await admin.from("listing_images").insert(imageRows);

    if (imageInsertResult.error) {
      await admin.from("listings").delete().eq("id", listing.id);
      return null;
    }
  }

  return (await getDatabaseListings({ listingId: listing.id }))?.[0] ?? null;
}

export async function updateDatabaseListing(listing: Listing) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const updateResult = await admin
    .from("listings")
    .update(mapListingToDatabaseRow(listing))
    .eq("id", listing.id);

  if (updateResult.error) {
    return null;
  }

  const deleteImagesResult = await admin.from("listing_images").delete().eq("listing_id", listing.id);

  if (deleteImagesResult.error) {
    return null;
  }

  const imageRows = mapListingImagesToDatabaseRows(listing);

  if (imageRows.length > 0) {
    const imageInsertResult = await admin.from("listing_images").insert(imageRows);

    if (imageInsertResult.error) {
      return null;
    }
  }

  return (await getDatabaseListings({ listingId: listing.id }))?.[0] ?? null;
}

export async function archiveDatabaseListing(listingId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("listings")
    .update({
      status: "archived" satisfies Listing["status"],
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  if (error) {
    return null;
  }

  return (await getDatabaseListings({ listingId }))?.[0] ?? null;
}

export async function moderateDatabaseListing(
  listingId: string,
  status: Extract<Listing["status"], "approved" | "rejected">,
) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("listings")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  if (error) {
    return null;
  }

  return (await getDatabaseListings({ listingId }))?.[0] ?? null;
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

export async function getLegacyStoredListings() {
  const cookieStore = await cookies();

  return parseStoredListings(cookieStore.get(listingSubmissionsCookieName)?.value).sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
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

export async function findEditableListingById(listingId: string, sellerId: string) {
  const dbListings = await getDatabaseListings({
    listingId,
    sellerId,
    statuses: ["draft", "pending"],
  });

  if (dbListings && dbListings.length > 0) {
    return dbListings[0];
  }

  const cookieListings = await getLegacyStoredListings();
  return getEditableListingById(cookieListings, listingId, sellerId) ?? null;
}

export async function findArchivableListingById(listingId: string, sellerId: string) {
  const dbListings = await getDatabaseListings({
    listingId,
    sellerId,
  });

  if (dbListings && dbListings.length > 0) {
    const listing = dbListings[0];
    if (listing.status !== "archived") {
      return listing;
    }
    return null;
  }

  const cookieListings = await getLegacyStoredListings();
  return getArchivableListingById(cookieListings, listingId, sellerId) ?? null;
}

export function getModeratableListingById(listings: Listing[], listingId: string) {
  return listings.find((listing) => listing.id === listingId && listing.status === "pending");
}

export async function getStoredListings() {
  const cookieListings = await getLegacyStoredListings();
  const databaseListings = await getDatabaseListings();

  if (databaseListings) {
    return mergeListings(databaseListings, cookieListings).sort(
      (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
    );
  }

  return cookieListings.sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
}

export async function getStoredUserListings(sellerId: string) {
  const cookieListings = (await getLegacyStoredListings()).filter((listing) => listing.sellerId === sellerId);
  const databaseListings = await getDatabaseListings({ sellerId });

  if (databaseListings) {
    return mergeListings(databaseListings, cookieListings).sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );
  }

  return cookieListings
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export async function getStoredListingBySlug(slug: string) {
  const cookieListings = await getLegacyStoredListings();
  const databaseListing = await getDatabaseListings({ slug });

  if (databaseListing?.[0]) {
    return mergeListings(databaseListing, cookieListings).find((listing) => listing.slug === slug) ?? null;
  }

  return cookieListings.find((listing) => listing.slug === slug) ?? null;
}

export async function getStoredListingsByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  const cookieListings = (await getLegacyStoredListings()).filter(
    (listing) => ids.includes(listing.id),
  );
  const databaseListings = await getDatabaseListings({ ids });

  if (databaseListings) {
    return mergeListings(databaseListings, cookieListings);
  }

  return cookieListings;
}

export async function getLegacyStoredUserListings(sellerId: string) {
  return (await getLegacyStoredListings()).filter((listing) => listing.sellerId === sellerId);
}

export async function upsertDatabaseListingRecord(listing: Listing) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const updatedListing = await updateDatabaseListing(listing);

  if (updatedListing) {
    return updatedListing;
  }

  return createDatabaseListing(listing);
}

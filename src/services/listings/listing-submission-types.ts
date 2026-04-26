import { Listing, Profile, UserRole, VerificationStatus } from "@/types";

/** DB row shape for a listing image — used internally for mapping. */
export interface ListingImageRow {
  id: string;
  is_cover: boolean;
  listing_id: string;
  public_url: string;
  sort_order: number;
  storage_path: string;
  placeholder_blur: string | null;
}

/** DB row shape for a listing — used internally for mapping. */
export interface ListingRow {
  brand: string;
  category?: Listing["category"] | null;
  city: string;
  created_at: string;
  damage_status_json?: Record<string, unknown> | null;
  description: string;
  district: string;
  expert_inspection?: Listing["expertInspection"] | null;
  featured: boolean;
  featured_until?: string | null;
  urgent_until?: string | null;
  highlighted_until?: string | null;
  is_featured?: boolean | null;
  is_urgent?: boolean | null;
  frame_color?: string | null;
  gallery_priority?: number | null;
  small_photo_until?: string | null;
  homepage_showcase_until?: string | null;
  category_showcase_until?: string | null;
  top_rank_until?: string | null;
  detailed_search_showcase_until?: string | null;
  bold_frame_until?: string | null;
  fraud_reason?: string | null;
  fraud_score?: number | null;
  fuel_type: Listing["fuelType"];
  id: string;
  license_plate?: string | null;
  listing_images?: ListingImageRow[] | null;
  profiles?: {
    id: string;
    full_name: string;
    phone?: string | null;
    city: string;
    avatar_url: string | null;
    role: string;
    user_type: string;
    business_name: string | null;
    business_logo_url: string | null;
    is_verified: boolean;
    is_banned: boolean;
    ban_reason: string | null;
    verified_business: boolean;
    verification_status: string;
    trust_score: number | null;
    business_slug: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  mileage: number;
  model: string;
  price: number;
  published_at?: string | null;
  view_count?: number;
  seller_id: string;
  slug: string;
  status: Listing["status"];
  title: string;
  tramer_amount?: number | null;
  transmission: Listing["transmission"];
  updated_at: string;
  version?: number;
  bumped_at?: string | null;
  market_price_index?: number | null;
  whatsapp_phone: string;
  year: number;
  vin?: string | null;
  car_trim?: string | null;
}

export function mapListingRow(row: ListingRow): Listing {
  return {
    brand: row.brand,
    category: row.category ?? "otomobil",
    city: row.city,
    createdAt: row.created_at,
    damageStatusJson: (row.damage_status_json as Record<string, string> | null) ?? null,
    description: row.description,
    district: row.district,
    expertInspection: row.expert_inspection ?? undefined,
    featured: row.featured,
    fraudReason: row.fraud_reason ?? null,
    fraudScore: row.fraud_score ?? 0,
    fuelType: row.fuel_type,
    id: row.id,
    images: (row.listing_images || [])
      .map((image) => ({
        id: image.id,
        isCover: image.is_cover || false,
        listingId: image.listing_id,
        order: image.sort_order || 0,
        storagePath: image.storage_path || "",
        url: image.public_url || "",
        placeholderBlur: image.placeholder_blur || null,
      }))
      .sort((left, right) => left.order - right.order),
    mileage: row.mileage,
    model: row.model,
    price: Number(row.price),
    carTrim: row.car_trim ?? null,
    sellerId: row.seller_id,
    viewCount: row.view_count ?? 0,
    seller: row.profiles
      ? {
          id: row.profiles.id,
          fullName: row.profiles.full_name,
          phone: row.profiles.phone ?? "",
          city: row.profiles.city,
          avatarUrl: row.profiles.avatar_url,
          role: row.profiles.role as UserRole,
          userType: row.profiles.user_type as Profile["userType"],
          businessName: row.profiles.business_name,
          businessLogoUrl: row.profiles.business_logo_url,
          isVerified: row.profiles.is_verified,
          isBanned: row.profiles.is_banned,
          banReason: row.profiles.ban_reason,
          verificationStatus: row.profiles.verification_status as VerificationStatus,
          trustScore: row.profiles.trust_score ?? undefined,
          businessSlug: row.profiles.business_slug,
          emailVerified: false,
          createdAt: row.profiles.created_at ?? "",
          updatedAt: row.profiles.updated_at ?? "",
        }
      : undefined,
    slug: row.slug,
    status: row.status,
    title: row.title,
    tramerAmount: row.tramer_amount != null ? Number(row.tramer_amount) : null,
    transmission: row.transmission,
    updatedAt: row.updated_at,
    bumpedAt: row.bumped_at ?? null,
    featuredUntil: row.featured_until ?? null,
    urgentUntil: row.urgent_until ?? null,
    highlightedUntil: row.highlighted_until ?? null,
    isFeatured: row.is_featured ?? null,
    isUrgent: row.is_urgent ?? null,
    frameColor: row.frame_color ?? null,
    galleryPriority: row.gallery_priority ?? null,
    smallPhotoUntil: row.small_photo_until ?? null,
    homepageShowcaseUntil: row.homepage_showcase_until ?? null,
    categoryShowcaseUntil: row.category_showcase_until ?? null,
    topRankUntil: row.top_rank_until ?? null,
    detailedSearchShowcaseUntil: row.detailed_search_showcase_until ?? null,
    boldFrameUntil: row.bold_frame_until ?? null,
    marketPriceIndex: row.market_price_index ? Number(row.market_price_index) : null,
    whatsappPhone: row.whatsapp_phone,
    vin: row.vin ?? null,
    licensePlate: row.license_plate ?? null,
    year: row.year,
    version: row.version ?? 0,
  };
}

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export interface GalleryProfile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  businessName: string | null;
  businessSlug: string | null;
  businessDescription: string | null;
  businessLogoUrl: string | null;
  businessCoverUrl: string | null;
  businessAddress: string | null;
  businessHours: Record<string, unknown> | null;
  phone: string | null;
  websiteUrl: string | null;
  city: string | null;
  userType: "individual" | "professional" | "staff";
  verifiedBusiness: boolean;
  totalListingsCount: number;
  totalSoldCount: number;
  trustScore: number | null;
  createdAt: string;
}

export interface GalleryListing {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  city: string;
  status: string;
  createdAt: string;
  coverImage?: string | null;
}

export async function getGalleryBySlug(slug: string): Promise<GalleryProfile | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `id, full_name, avatar_url, business_name, business_slug, business_description,
       business_logo_url, business_cover_url, business_address, business_hours,
       phone, website_url, city, user_type, verified_business,
       total_listings_count, total_sold_count, trust_score, created_at`
    )
    .eq("business_slug", slug)
    .single();

  if (error || !data) {
    logger.db.error("getGalleryBySlug failed", error, { slug });
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    businessName: data.business_name,
    businessSlug: data.business_slug,
    businessDescription: data.business_description,
    businessLogoUrl: data.business_logo_url,
    businessCoverUrl: data.business_cover_url,
    businessAddress: data.business_address,
    businessHours: data.business_hours,
    phone: data.phone,
    websiteUrl: data.website_url,
    city: data.city,
    userType: data.user_type,
    verifiedBusiness: data.verified_business,
    totalListingsCount: data.total_listings_count,
    totalSoldCount: data.total_sold_count,
    trustScore: data.trust_score,
    createdAt: data.created_at,
  };
}

export async function getGalleryListings(
  galleryId: string,
  options?: { limit?: number; status?: string }
): Promise<GalleryListing[]> {
  const supabase = await createSupabaseServerClient();
  const limit = options?.limit ?? 12;

  const { data, error } = await supabase
    .from("listings")
    .select(
      `id, title, brand, model, year, price, city, status, created_at,
      cover_image:listing_images(public_url)`
    )
    .eq("seller_id", galleryId)
    .eq("status", options?.status ?? "approved")
    .eq("listing_images.is_cover", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.db.error("getGalleryListings failed", error, { galleryId });
    return [];
  }

  return (data ?? []).map(
    (row: {
      id: string;
      title: string;
      brand: string;
      model: string;
      year: number;
      price: number;
      city: string;
      status: string;
      created_at: string;
      cover_image: { public_url: string }[];
    }) => ({
      id: row.id,
      title: row.title,
      brand: row.brand,
      model: row.model,
      year: row.year,
      price: row.price,
      city: row.city,
      status: row.status,
      createdAt: row.created_at,
      coverImage: row.cover_image?.[0]?.public_url ?? null,
    })
  );
}

export async function getGalleryStats(galleryId: string) {
  const supabase = await createSupabaseServerClient();

  const [listings, soldResult] = await Promise.all([
    supabase.from("listings").select("id, status").eq("seller_id", galleryId),
    supabase
      .from("profiles")
      .select("total_listings_count, total_sold_count")
      .eq("id", galleryId)
      .single(),
  ]);

  const active = listings.data?.filter((l) => l.status === "approved").length ?? 0;
  const pending = listings.data?.filter((l) => l.status === "pending").length ?? 0;
  const archived = listings.data?.filter((l) => l.status === "archived").length ?? 0;

  return {
    active,
    pending,
    archived,
    totalSold: soldResult.data?.total_sold_count ?? 0,
  };
}

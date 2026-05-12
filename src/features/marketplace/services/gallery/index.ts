import { getProfileRestrictionState } from "@/features/profile/services/profile-restrictions";
import { createSupabaseAdminClient } from "@/lib/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";
import { type Listing, type Profile } from "@/types";

export async function getGalleryBySlug(
  slug: string,
  options?: { includeBanned?: boolean; includeUnverified?: boolean }
) {
  if (!hasSupabaseAdminEnv()) return null;
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, phone, city, avatar_url, role, user_type, is_verified, is_banned, ban_reason, business_name, business_logo_url, business_slug, business_description, website_url, verified_business, created_at, updated_at, verification_status"
    )
    .eq("business_slug", slug)
    .eq("user_type", "professional");

  if (!options?.includeUnverified) {
    query = query.eq("verification_status", "approved");
  }

  if (!options?.includeBanned) {
    query = query.eq("is_banned", false);
  }

  const { data: profile, error } = await query.single();

  if (error || !profile) return null;

  if (
    !options?.includeBanned &&
    getProfileRestrictionState({
      isBanned: profile.is_banned,
      banReason: profile.ban_reason,
    }) !== "active"
  ) {
    return null;
  }

  // Fetch listings for this gallery (paginated)
  let listingQuery = supabase
    .from("listings")
    .select(
      "id, slug, title, brand, model, year, mileage, price, city, district, status, created_at, transmission, fuel_type, listing_images(id, public_url, is_cover, sort_order)"
    )
    .eq("seller_id", profile.id);

  if (!options?.includeUnverified) {
    listingQuery = listingQuery.eq("status", "approved");
  }

  const { data: listingsData } = await listingQuery
    .order("created_at", { ascending: false })
    .limit(20);

  const listings = (listingsData || []).map((l) => ({
    ...l,
    fuelType: l.fuel_type,
    images: (l.listing_images || []).map(
      (img: { id: string; public_url: string; is_cover: boolean; sort_order: number }) => ({
        id: img.id,
        url: img.public_url,
        isCover: img.is_cover,
        sortOrder: img.sort_order,
      })
    ),
  }));

  // Gallery total listing count
  const { count: totalListings } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", profile.id)
    .eq("status", "approved");

  // Gallery view count (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const { count: viewCount } = await supabase
    .from("gallery_views")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", profile.id)
    .gte("viewed_on", thirtyDaysAgo);

  return {
    profile: {
      id: profile.id,
      fullName: profile.full_name,
      phone: profile.phone,
      city: profile.city,
      avatarUrl: profile.avatar_url,
      role: profile.role as Profile["role"],
      userType: profile.user_type as Profile["userType"],
      isVerified: profile.is_verified,
      emailVerified: false,
      phoneVerified: false,
      identityVerified: profile.is_verified,
      balanceCredits: 0,
      isBanned: profile.is_banned,
      banReason: profile.ban_reason,
      businessName: profile.business_name,
      businessLogoUrl: profile.business_logo_url,
      businessSlug: profile.business_slug,
      businessDescription: profile.business_description,
      websiteUrl: profile.website_url,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    } as Profile,
    listings: (listings || []) as unknown as Listing[],
    totalListings: totalListings ?? 0,
    viewCount30d: viewCount ?? 0,
  };
}

export async function recordGalleryView(
  sellerId: string,
  options: { viewerId?: string; viewerIp?: string }
): Promise<void> {
  if (!hasSupabaseAdminEnv()) return;
  const supabase = createSupabaseAdminClient();
  const viewedOn = new Date().toISOString().split("T")[0];

  if (options.viewerId) {
    await supabase
      .from("gallery_views")
      .upsert(
        { seller_id: sellerId, viewer_id: options.viewerId, viewed_on: viewedOn },
        { onConflict: "seller_id,viewer_id,viewed_on", ignoreDuplicates: true }
      );
  } else if (options.viewerIp) {
    await supabase
      .from("gallery_views")
      .upsert(
        { seller_id: sellerId, viewer_ip: options.viewerIp, viewed_on: viewedOn },
        { onConflict: "seller_id,viewer_ip,viewed_on", ignoreDuplicates: true }
      );
  }
}

export async function getGalleryById(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone, city, avatar_url, role, user_type, is_verified, business_name, business_logo_url, business_slug, business_description, website_url, verified_business, created_at, updated_at"
    )
    .eq("id", id)
    .single();

  if (error || !profile) return null;

  return profile as unknown as Profile;
}

export interface GalleryListingItem {
  id: string;
  slug: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  city: string;
  status: string;
  createdAt: string;
  coverImage: string | null;
}

export async function getGalleryListings(
  galleryId: string,
  options?: { limit?: number; status?: string }
): Promise<GalleryListingItem[]> {
  const supabase = await createSupabaseServerClient();
  const limit = options?.limit ?? 12;

  const { data, error } = await supabase
    .from("listings")
    .select(
      `id, slug, title, brand, model, year, price, city, status, created_at,
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

  return (data ?? []).map((row: unknown) => {
    const r = row as Record<string, unknown>;
    const coverImages = r.cover_image as { public_url: string }[] | undefined | null;
    return {
      id: r.id as string,
      slug: r.slug as string,
      title: r.title as string,
      brand: r.brand as string,
      model: r.model as string,
      year: r.year as number,
      price: r.price as number,
      city: r.city as string,
      status: r.status as string,
      createdAt: r.created_at as string,
      coverImage: coverImages?.[0]?.public_url ?? null,
    };
  });
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

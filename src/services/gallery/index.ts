import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { hasSupabaseAdminEnv } from "@/lib/supabase/env"
import { type Listing, type Profile } from "@/types"
import { getProfileRestrictionState } from "@/services/profile/profile-restrictions";

export async function getGalleryBySlug(slug: string) {
  if (!hasSupabaseAdminEnv()) return null;
  const supabase = createSupabaseAdminClient()
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, city, avatar_url, role, user_type, is_verified, is_banned, ban_reason, business_name, business_logo_url, business_slug, business_description, website_url, verified_business, created_at, updated_at")
    .eq("business_slug", slug)
    .eq("user_type", "professional")
    .eq("verification_status", "approved")
    .eq("is_banned", false)
    .single()

  if (error || !profile) return null

  if (getProfileRestrictionState({
    isBanned: profile.is_banned,
    banReason: profile.ban_reason,
  }) !== "active") {
    return null;
  }

  // Fetch listings for this gallery
  const { data: listingsData } = await supabase
    .from("listings")
    .select("id, slug, title, brand, model, year, mileage, price, city, district, status, created_at, transmission, fuel_type, listing_images(id, public_url, is_cover, sort_order)")
    .eq("seller_id", profile.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  const listings = (listingsData || []).map(l => ({
    ...l,
    fuelType: l.fuel_type,
    images: (l.listing_images || []).map((img: { id: string; public_url: string; is_cover: boolean; sort_order: number }) => ({
      id: img.id,
      url: img.public_url,
      isCover: img.is_cover,
      sortOrder: img.sort_order
    }))
  }))

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
    viewCount30d: viewCount ?? 0,
  }
}

export async function recordGalleryView(
  sellerId: string,
  options: { viewerId?: string; viewerIp?: string },
): Promise<void> {
  if (!hasSupabaseAdminEnv()) return;
  const supabase = createSupabaseAdminClient();
  const viewedOn = new Date().toISOString().split("T")[0];

  if (options.viewerId) {
    await supabase.from("gallery_views").upsert(
      { seller_id: sellerId, viewer_id: options.viewerId, viewed_on: viewedOn },
      { onConflict: "seller_id,viewer_id,viewed_on", ignoreDuplicates: true },
    );
  } else if (options.viewerIp) {
    await supabase.from("gallery_views").upsert(
      { seller_id: sellerId, viewer_ip: options.viewerIp, viewed_on: viewedOn },
      { onConflict: "seller_id,viewer_ip,viewed_on", ignoreDuplicates: true },
    );
  }
}

export async function getGalleryById(id: string) {
  const supabase = createSupabaseAdminClient()
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, city, avatar_url, role, user_type, is_verified, business_name, business_logo_url, business_slug, business_description, website_url, verified_business, created_at, updated_at")
    .eq("id", id)
    .single()

  if (error || !profile) return null

  return profile as unknown as Profile
}

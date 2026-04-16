import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { hasSupabaseAdminEnv } from "@/lib/supabase/env"
import { type Listing, type Profile } from "@/types"

export async function getGalleryBySlug(slug: string) {
  if (!hasSupabaseAdminEnv()) return null;
  const supabase = createSupabaseAdminClient()
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, city, avatar_url, role, user_type, is_verified, business_name, business_logo_url, business_slug, business_description, website_url, verified_business, created_at, updated_at")
    .eq("business_slug", slug)
    .eq("user_type", "professional")
    .single()

  if (error || !profile) return null

  // Fetch listings for this gallery — correct table name: listing_images
  const { data: listings } = await supabase
    .from("listings")
    .select("id, slug, title, brand, model, year, mileage, price, city, status, created_at, listing_images(id, public_url, is_cover, sort_order)")
    .eq("seller_id", profile.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

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
      businessName: profile.business_name,
      businessLogoUrl: profile.business_logo_url,
      businessSlug: profile.business_slug,
      businessDescription: profile.business_description,
      websiteUrl: profile.website_url,
      verifiedBusiness: profile.verified_business,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    } as Profile,
    listings: (listings || []) as unknown as Listing[]
  }
}

export async function getGalleryById(id: string) {
  const supabase = createSupabaseAdminClient()
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !profile) return null

  return profile as unknown as Profile
}

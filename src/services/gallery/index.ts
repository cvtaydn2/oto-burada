import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { type Listing, type Profile } from "@/types"

export async function getGalleryBySlug(slug: string) {
  const supabase = createSupabaseAdminClient()
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("business_slug", slug)
    .eq("user_type", "professional")
    .single()

  if (error || !profile) return null

  // Fetch listings for this gallery
  const { data: listings } = await supabase
    .from("listings")
    .select("*, listings_images(url, is_cover)")
    .eq("seller_id", profile.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  return {
    profile: profile as unknown as Profile,
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

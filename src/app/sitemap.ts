import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/seo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export const revalidate = 3600; // Re-generate every hour

// Static pages için lastModified: Sitemap her saat yeniden üretildiği için
// son üretim zamanını temsil eden bir tarih kullanıyoruz.
// Bu, SEO açısından daha anlamlı ve cache-friendly.
const getStaticPageDate = () => new Date();
const ITEMS_PER_SITEMAP = 1000;

/**
 * generateSitemaps allows us to split the sitemap into multiple files.
 * sitemap/0.xml -> Static pages + Brands + Cities
 * sitemap/1.xml -> Listings 1-1000
 * sitemap/2.xml -> Listings 1001-2000
 * ...
 */
export async function generateSitemaps() {
  if (!hasSupabaseAdminEnv()) return [{ id: 0 }];

  const admin = createSupabaseAdminClient();
  const { count } = await admin
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  const totalListings = count || 0;
  const numberOfListingSitemaps = Math.ceil(totalListings / ITEMS_PER_SITEMAP);

  // ID 0 is reserved for static/meta pages. Listing sitemaps start from 1.
  return [
    { id: 0 },
    ...Array.from({ length: numberOfListingSitemaps }, (_, i) => ({ id: i + 1 })),
  ];
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl();

  // ── ID 0: Static Pages, Brands, and Cities ──────────────────────────────
  if (id === 0) {
    const now = getStaticPageDate();
    const staticPages: MetadataRoute.Sitemap = [
      { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1.0 },
      { url: `${baseUrl}/listings`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
      { url: `${baseUrl}/aracim-ne-kadar`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
      { url: `${baseUrl}/compare`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    ];

    if (!hasSupabaseAdminEnv()) return staticPages;

    const admin = createSupabaseAdminClient();
    const [
      { data: brands },
      { data: cities },
      { data: sellers },
      combinationsResult
    ] = await Promise.all([
      admin.from("brands").select("slug").eq("is_active", true).order("name"),
      admin.from("cities").select("slug").eq("is_active", true).order("name"),
      // Onaylı ve aktif satıcı galerilerini sitemap'e ekle
      admin.from("profiles")
        .select("business_slug")
        .eq("user_type", "professional")
        .eq("verification_status", "approved")
        .not("business_slug", "is", null),
      // Aktif ilanların bulunduğu Marka + Şehir kombinasyonlarını sitemap'e ekle
      admin.rpc("get_active_brand_city_combinations"),
    ]);

    const combinations = combinationsResult?.data as { brand_slug: string, city_slug: string }[] | null;

    const brandPages: MetadataRoute.Sitemap = (brands ?? []).map((brand) => ({
      url: `${baseUrl}/satilik/${brand.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    const cityPages: MetadataRoute.Sitemap = (cities ?? []).map((city) => ({
      url: `${baseUrl}/satilik-araba/${city.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    const galleryPages: MetadataRoute.Sitemap = (sellers ?? [])
      .filter((s) => s.business_slug)
      .map((s) => ({
        url: `${baseUrl}/gallery/${s.business_slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));

    const comboPages: MetadataRoute.Sitemap = (combinations ?? []).map((c) => ({
      url: `${baseUrl}/satilik/${c.brand_slug}/${c.city_slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...brandPages, ...cityPages, ...galleryPages, ...comboPages];
  }

  // ── ID > 0: Paginated Listings ──────────────────────────────────────────
  if (!hasSupabaseAdminEnv()) return [];

  const admin = createSupabaseAdminClient();
  const pageIndex = id - 1;
  const from = pageIndex * ITEMS_PER_SITEMAP;
  const to = from + ITEMS_PER_SITEMAP - 1;

  const { data: listings } = await admin
    .from("listings")
    .select("slug, updated_at")
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .range(from, to);

  return (listings ?? []).map((listing) => ({
    url: `${baseUrl}/listing/${listing.slug}`,
    lastModified: listing.updated_at ? new Date(listing.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));
}

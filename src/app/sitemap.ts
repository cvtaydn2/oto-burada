import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/seo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export const revalidate = 3600; // Re-generate every hour

// Fixed date for truly static pages — avoids unnecessary cache invalidation
// on every render. Update manually when page content changes significantly.
const STATIC_PAGE_DATE = new Date("2026-01-01");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: STATIC_PAGE_DATE, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/listings`, lastModified: STATIC_PAGE_DATE, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/register`, changeFrequency: "monthly", priority: 0.3 },
  ];

  if (!hasSupabaseAdminEnv()) {
    return staticPages;
  }

  const admin = createSupabaseAdminClient();
  const [{ data: listings }, { data: brands }] = await Promise.all([
    admin
      .from("listings")
      .select("slug, updated_at")
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(5000),
    admin.from("brands").select("name, slug").eq("is_active", true).order("name"),
  ]);

  const listingPages: MetadataRoute.Sitemap = (listings ?? []).map((listing) => ({
    url: `${baseUrl}/listing/${listing.slug}`,
    lastModified: listing.updated_at ? new Date(listing.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const brandPages: MetadataRoute.Sitemap = (brands ?? []).map((brand) => ({
    url: `${baseUrl}/satilik/${brand.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...listingPages, ...brandPages];
}

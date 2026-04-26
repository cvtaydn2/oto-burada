import type { NextConfig } from "next";

/**
 * Extracts the Supabase project hostname from the NEXT_PUBLIC_SUPABASE_URL env var.
 * Returns null if the env var is missing or invalid — the remotePattern is then omitted.
 */
function getSupabaseHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  try {
    const hostname = new URL(url).hostname;
    return hostname || null;
  } catch {
    return null;
  }
}

const supabaseHostname = getSupabaseHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Only add Supabase pattern when the env var is configured
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname }]
        : []),
      { protocol: "https" as const, hostname: "images.unsplash.com" },
      { protocol: "https" as const, hostname: "plus.unsplash.com" },
      { protocol: "https" as const, hostname: "images.pexels.com" },
      { protocol: "https" as const, hostname: "placehold.co" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 80, 85],
    // Image URLs are UUID-based and never change — 1 day cache is safe
    minimumCacheTTL: 86400,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "framer-motion",
      "clsx",
      "tailwind-merge",
    ],
    // Restore scroll position on back/forward navigation
    scrollRestoration: true,
  },
  // Disabled PPR/cacheComponents for now to resolve build conflicts with route segment configs
  cacheComponents: false,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  serverExternalPackages: ["posthog-node", "sharp", "iyzipay"],
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/gallery/:slug",
        destination: "/galeri/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

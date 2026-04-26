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
  async headers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).hostname : "";

    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-analytics.com *.vercel-insights.com;
      style-src 'self' 'unsafe-inline' fonts.googleapis.com;
      font-src 'self' fonts.gstatic.com data:;
      img-src 'self' data: blob: ${supabaseDomain ? supabaseDomain : ""} *.unsplash.com *.pexels.com placehold.co;
      connect-src 'self' ${supabaseDomain ? supabaseDomain : ""} *.vercel-analytics.com *.vercel-insights.com;
      media-src 'self';
      object-src 'none';
      frame-src 'self';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, " ").trim();

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

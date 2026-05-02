import { withSentryConfig } from "@sentry/nextjs";
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
    // TODO: Set to false when upgrading to Vercel Pro for automatic image optimization
    // FREE TIER: Prevents Vercel 1000 image optimization quota exhaustion.
    // In production, we keep it true to save quota. In preview/local, we can leave it false if needed.
    unoptimized: process.env.VERCEL_ENV !== "production" && process.env.NEXT_PUBLIC_FORCE_OPTIMIZED_IMAGES !== "true",
    remotePatterns: [
      // Only add Supabase pattern when the env var is configured
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname }]
        : []),
      { protocol: "https" as const, hostname: "images.unsplash.com" },
      { protocol: "https" as const, hostname: "plus.unsplash.com" },
      { protocol: "https" as const, hostname: "images.pexels.com" },
      { protocol: "https" as const, hostname: "placehold.co" },
      { protocol: "https" as const, hostname: "*.vercel.live" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 80, 85],
    // Image URLs are UUID-based and never change — 1 day cache is safe
    minimumCacheTTL: 86400,
  },
  experimental: {
    // ── PERFORMANCE FIX: Issue PERF-08 - Optimize Large Package Imports ─────
    // Added @supabase/supabase-js and other heavy libraries to reduce bundle size.
    optimizePackageImports: [
      "date-fns",
      "clsx",
      "@supabase/supabase-js",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-aspect-ratio",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-context-menu",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-hover-card",
      "@radix-ui/react-label",
      "@radix-ui/react-menubar",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-toggle",
      "@radix-ui/react-toggle-group",
      "@radix-ui/react-tooltip",
      "react-hook-form",
      "zod",
      "lucide-react",
      "framer-motion",
      "vaul",
      "embla-carousel-react",
    ],
  },
  // Disabled PPR/cacheComponents for now to resolve build conflicts with route segment configs
  cacheComponents: false,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  serverExternalPackages: ["sharp", "iyzipay"],
  transpilePackages: ["lucide-react"],
  // NOTE: output: "standalone" removed — adds unnecessary overhead on Vercel serverless.
  // Re-enable only if deploying via Docker/self-hosting.
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
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // ── BUILD-TIME VALIDATION: Fail build if critical server env vars are missing ──
    // Prevents successful builds that crash at runtime on the first request.
    if (isServer && process.env.NODE_ENV === "production") {
      const requiredServerEnvVars = [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "UPSTASH_REDIS_REST_URL",
        "UPSTASH_REDIS_REST_TOKEN",
      ];
      const missing = requiredServerEnvVars.filter((key) => !process.env[key]);
      if (missing.length > 0) {
        throw new Error(
          `❌ Build failed: Missing required environment variables: ${missing.join(", ")}`
        );
      }
    }
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: "product-jx",
  project: "oto-burada",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});

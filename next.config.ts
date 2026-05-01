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
    unoptimized: true, // VITAL FOR FREE TIER: Prevents Vercel 1000 image optimization quota exhaustion
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
    // ── PERFORMANCE FIX: Issue PERF-08 - Optimize Large Package Imports ─────
    // Added @supabase/supabase-js and posthog-js to reduce bundle size.
    // These are large packages that benefit from tree-shaking optimization.
    optimizePackageImports: [

      "date-fns",
      "clsx",
      "@supabase/supabase-js",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "react-hook-form",
      "zod",
    ],
  },
  // Disabled PPR/cacheComponents for now to resolve build conflicts with route segment configs
  cacheComponents: false,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  serverExternalPackages: ["sharp", "iyzipay"],
  // ── DEPLOYMENT CONFIG: Standalone output for Docker/self-hosting ───────────
  // Kept for future Docker deployment support. Vercel ignores this setting.
  // If deploying to Vercel ONLY, this can be safely removed.
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
  // Security headers are handled dynamically in src/middleware.ts to support CSP nonces
  async headers() {
    return [];
  },
};

export default withSentryConfig(nextConfig, {
 // For all available options, see:
 // https://www.npmjs.com/package/@sentry/webpack-plugin#options

 org: "product-jx",

 project: "oto-burada",

 // Only print logs for uploading source maps in CI
 silent: !process.env.CI,

 // For all available options, see:
 // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

 // Upload a larger set of source maps for prettier stack traces (increases build time)
 widenClientFileUpload: true,

 // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
 // This can increase your server load as well as your hosting bill.
 // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
 // side errors will fail.
 tunnelRoute: "/monitoring",

 webpack: {
   // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
   // See the following for more information:
   // https://docs.sentry.io/product/crons/
   // https://vercel.com/docs/cron-jobs
   automaticVercelMonitors: true,

   // Tree-shaking options for reducing bundle size
   treeshake: {
     // Automatically tree-shake Sentry logger statements to reduce bundle size
     removeDebugLogging: true,
   },
 },
});
